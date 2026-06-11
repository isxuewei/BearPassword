import { request } from '@/utils/request'
import type { AvatarUploadResult, ChangePasswordParams, LoginParams, LoginResult, RegisterParams, SendRegisterCodeParams, UserProfile } from '@/types'

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
