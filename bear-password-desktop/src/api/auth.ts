import { request } from '@/utils/request'
import type {
  AvatarUploadResult,
  ChangePasswordParams,
  LoginParams,
  LoginResult,
  RegisterParams,
  SendRegisterCodeParams,
  UpdateNicknameParams,
  UpdateUsernameParams,
  UserProfile,
  UsernameCheckResult
} from '@/types'

/**
 * 认证相关 API
 * 对接 bear-password-server AuthController
 */

/** 用户登录 POST /auth/login */
export function loginApi(params: LoginParams): Promise<LoginResult> {
  return request.post<LoginResult>('/auth/login', params)
}

/** 退出登录 POST /auth/logout */
export function logoutApi(): Promise<void> {
  return request.post<void>('/auth/logout')
}

/** 获取当前用户信息 GET /auth/me */
export function getCurrentUserApi(): Promise<UserProfile> {
  return request.get<UserProfile>('/auth/me')
}

/** 修改登录密码 PUT /auth/password */
export function changePasswordApi(params: ChangePasswordParams): Promise<void> {
  return request.put<void>('/auth/password', params)
}

/** 上传头像 POST /auth/avatar */
export function uploadAvatarApi(file: File): Promise<AvatarUploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  return request.post<AvatarUploadResult>('/auth/avatar', formData)
}

/** 发送注册验证码 POST /auth/register/code */
export function sendRegisterCodeApi(params: SendRegisterCodeParams): Promise<void> {
  return request.post<void>('/auth/register/code', params)
}

/** 注册 POST /auth/register */
export function registerApi(params: RegisterParams): Promise<LoginResult> {
  return request.post<LoginResult>('/auth/register', params)
}

/** 校验用户名是否可用 GET /auth/username/check */
export function checkUsernameApi(username: string): Promise<UsernameCheckResult> {
  return request.get<UsernameCheckResult>('/auth/username/check', { params: { username } })
}

/** 修改用户名 PUT /auth/username */
export function updateUsernameApi(params: UpdateUsernameParams): Promise<void> {
  return request.put<void>('/auth/username', params)
}

/** 修改昵称 PUT /auth/nickname */
export function updateNicknameApi(params: UpdateNicknameParams): Promise<void> {
  return request.put<void>('/auth/nickname', params)
}
