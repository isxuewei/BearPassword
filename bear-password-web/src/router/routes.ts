import type { RouteRecordRaw } from 'vue-router'
import AuthPage from '@/views/login/AuthPage.vue'

/**
 * 路由表定义（模块化）
 * 按功能区域划分：认证区 / 主应用区
 */
const VaultView = () => import('@/views/vault/VaultViewHost.vue')

export const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: AuthPage,
    meta: { requiresAuth: false, title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: AuthPage,
    meta: { requiresAuth: false, title: '注册' }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: { title: '首页', icon: 'dashboard' }
      },
      {
        path: 'vault',
        name: 'Vault',
        component: VaultView,
        meta: { title: '密码库', icon: 'vault' }
      },
      {
        path: 'favorites',
        name: 'Favorites',
        component: VaultView,
        meta: { title: '收藏夹', icon: 'favorites', mode: 'favorites' }
      },
      {
        path: 'recent',
        name: 'Recent',
        component: VaultView,
        meta: { title: '最近访问', icon: 'recent', mode: 'recent' }
      },
      {
        path: 'settings',
        redirect: '/dashboard'
      },
      {
        path: 'profile',
        redirect: '/dashboard'
      },
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]
