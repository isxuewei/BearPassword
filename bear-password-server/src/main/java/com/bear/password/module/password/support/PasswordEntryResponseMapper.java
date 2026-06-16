package com.bear.password.module.password.support;

import com.bear.password.common.exception.BusinessException;
import com.bear.password.common.result.ResultCode;
import com.bear.password.module.password.dto.PasswordEntryResponse;
import com.bear.password.module.password.entity.PasswordEntry;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;

/**
 * 密码条目与响应 DTO 转换
 */
@Component
@RequiredArgsConstructor
public class PasswordEntryResponseMapper {

    private static final String LABELS_KEY = "passwordLabels";
    private static final TypeReference<Map<String, Object>> CONTENT_TYPE = new TypeReference<>() {
    };
    private static final TypeReference<List<String>> LABEL_TYPE = new TypeReference<>() {
    };

    private final ObjectMapper objectMapper;

    public PasswordEntryResponse toResponse(PasswordEntry entry) {
        PasswordEntryResponse response = new PasswordEntryResponse();
        response.setId(entry.getId());
        response.setPasswordType(entry.getPasswordType());
        response.setContent(fromJson(entry.getContent(), CONTENT_TYPE));
        response.setCreateTime(entry.getCreateTime());
        response.setUpdateTime(entry.getUpdateTime());
        return response;
    }

    public List<String> collectUserLabels(List<PasswordEntry> entries) {
        TreeSet<String> labels = new TreeSet<>();
        for (PasswordEntry entry : entries) {
            extractLabels(entry.getContent()).stream()
                    .filter(StringUtils::hasText)
                    .map(String::trim)
                    .forEach(labels::add);
        }
        return labels.stream().toList();
    }

    public List<String> extractLabels(String contentJson) {
        Map<String, Object> content = fromJson(contentJson, CONTENT_TYPE);
        if (content == null) {
            return List.of();
        }
        Object raw = content.get(LABELS_KEY);
        if (!(raw instanceof List<?> list)) {
            return List.of();
        }
        List<String> labels = new ArrayList<>();
        for (Object item : list) {
            if (item == null) {
                continue;
            }
            String label = String.valueOf(item).trim();
            if (StringUtils.hasText(label)) {
                labels.add(label);
            }
        }
        return labels;
    }

    public String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "JSON 格式错误");
        }
    }

    public <T> T fromJson(String json, TypeReference<T> typeReference) {
        if (!StringUtils.hasText(json)) {
            return null;
        }
        try {
            return objectMapper.readValue(json, typeReference);
        } catch (JsonProcessingException e) {
            throw new BusinessException(ResultCode.INTERNAL_ERROR.getCode(), "数据解析失败");
        }
    }
}
