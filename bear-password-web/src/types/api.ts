/**
 * API 通用类型定义
 * 所有接口响应遵循统一格式，便于 Axios 拦截器统一处理
 */

/** 后端统一响应结构（预留 REST API 对接） */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

/** 分页请求参数 */
export interface PageParams {
  page: number
  pageSize: number
}

/** 分页响应数据 */
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}
