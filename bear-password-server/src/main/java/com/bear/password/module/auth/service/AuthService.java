package com.bear.password.module.auth.service;

import cn.dev33.satoken.stp.StpUtil;
import com.bear.password.common.constant.AuthConstants;
import com.bear.password.common.exception.BusinessException;
import com.bear.password.common.result.ResultCode;
import com.bear.password.module.auth.dto.*;
import com.bear.password.module.user.entity.User;
import com.bear.password.module.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.dromara.x.file.storage.core.FileInfo;
import org.dromara.x.file.storage.core.FileStorageService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

/**
 * 认证服务接口
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private static final long MAX_AVATAR_BYTES = 2 * 1024 * 1024;
    private static final Set<String> ALLOWED_AVATAR_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
    );

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;
    private final EmailService emailService;
    private final VerificationCodeService verificationCodeService;

    public LoginResponse login(LoginRequest request) {
        User user = userService.getByUsername(request.getUsername());
        if (user == null) {
            throw new BusinessException(ResultCode.UNAUTHORIZED.getCode(), "用户名或密码错误");
        }

        if (user.getStatus() != null && user.getStatus() == 0) {
            throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "账号已被禁用");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException(ResultCode.UNAUTHORIZED.getCode(), "用户名或密码错误");
        }

        // Sa-Token 登录，以用户 ID 作为 loginId
        StpUtil.login(user.getId());
        StpUtil.getSession().set(AuthConstants.SESSION_USERNAME, user.getUsername());
        String avatar = normalizeAvatar(user.getAvatar());
        StpUtil.getSession().set(AuthConstants.SESSION_AVATAR, avatar);

        return new LoginResponse(StpUtil.getTokenValue(), user.getUsername(), avatar);
    }

    public void logout() {
        StpUtil.logout();
    }

    public UserInfoResponse currentUser() {
        long userId = StpUtil.getLoginIdAsLong();
        String username = (String) StpUtil.getSession().get(AuthConstants.SESSION_USERNAME);
        String avatar = (String) StpUtil.getSession().get(AuthConstants.SESSION_AVATAR);
        return new UserInfoResponse(userId, username, avatar);
    }

    public void changePassword(ChangePasswordRequest request) {
        long userId = StpUtil.getLoginIdAsLong();
        User user = userService.getById(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.UNAUTHORIZED.getCode(), "用户不存在或登录已失效");
        }

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "当前密码不正确");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "新密码不能与当前密码相同");
        }

        User update = new User();
        update.setId(userId);
        update.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userService.updateById(update);
    }

    public AvatarUploadResponse uploadAvatar(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "请选择要上传的头像");
        }

        String contentType = file.getContentType();
        if (!StringUtils.hasText(contentType) || !ALLOWED_AVATAR_TYPES.contains(contentType)) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "仅支持 JPG、PNG、WebP、GIF 格式的图片");
        }

        if (file.getSize() > MAX_AVATAR_BYTES) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "头像大小不能超过 2MB");
        }

        long userId = StpUtil.getLoginIdAsLong();
        User user = userService.getById(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.UNAUTHORIZED.getCode(), "用户不存在或登录已失效");
        }

        String oldAvatar = user.getAvatar();
        FileInfo fileInfo = fileStorageService.of(file)
                .setPath("avatar/" + userId + "/")
                .upload();
        String avatarUrl = fileInfo.getUrl();

        User update = new User();
        update.setId(userId);
        update.setAvatar(avatarUrl);
        userService.updateById(update);
        StpUtil.getSession().set(AuthConstants.SESSION_AVATAR, avatarUrl);

        if (StringUtils.hasText(oldAvatar) && !oldAvatar.equals(avatarUrl)) {
            try {
                fileStorageService.delete(oldAvatar);
            } catch (Exception ex) {
                log.warn("删除旧头像失败 userId={} url={}", userId, oldAvatar, ex);
            }
        }

        return new AvatarUploadResponse(avatarUrl);
    }

    public void sendRegisterCode(SendRegisterCodeRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (userService.getByEmail(email) != null) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "该邮箱已注册");
        }

        verificationCodeService.sendCode(email, code -> emailService.sendRegisterCode(email, code));
    }

    public LoginResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        String username = request.getUsername().trim();

        verificationCodeService.verifyAndConsume(email, request.getCode());

        if (userService.getByEmail(email) != null) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "该邮箱已注册");
        }
        if (userService.getByUsername(username) != null) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "用户名已被占用");
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setNickname(username);
        user.setStatus(1);
        userService.save(user);

        StpUtil.login(user.getId());
        StpUtil.getSession().set(AuthConstants.SESSION_USERNAME, user.getUsername());
        String avatar = normalizeAvatar(user.getAvatar());
        StpUtil.getSession().set(AuthConstants.SESSION_AVATAR, avatar);

        return new LoginResponse(StpUtil.getTokenValue(), user.getUsername(), avatar);
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    /** Sa-Token Session 使用 ConcurrentHashMap，不能存 null */
    private String normalizeAvatar(String avatar) {
        return avatar != null ? avatar : "";
    }
}
