/**
 * Vue Router 配置
 */

import { createRouter, createWebHistory } from 'vue-router';
import { pageRoutes } from '../../pages';
import { setupRouterGuards } from './guards';

/**
 * 创建路由实例
 */
export function createAppRouter() {
  const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
      ...pageRoutes,
      // 404 页面
      {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('../views/NotFoundView.vue'),
        meta: {
          title: '页面未找到 - 《买房记》',
          description: '抱歉，您访问的页面不存在'
        }
      }
    ],
    scrollBehavior(to, from, savedPosition) {
      // 保持滚动位置
      if (savedPosition) {
        return savedPosition;
      }
      // 新页面滚动到顶部
      return { top: 0 };
    }
  });

  // 设置路由守卫
  setupRouterGuards(router);

  return router;
}

/**
 * 路由元信息类型扩展
 */
declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
    description?: string;
    requiresAuth?: boolean;
    roles?: string[];
    keepAlive?: boolean;
  }
}