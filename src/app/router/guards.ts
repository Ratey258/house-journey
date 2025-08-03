/**
 * 路由守卫配置
 */

import type { Router } from 'vue-router';

/**
 * 设置路由守卫
 */
export function setupRouterGuards(router: Router): void {
  // 全局前置守卫
  router.beforeEach((to, from, next) => {
    // 设置页面标题
    if (to.meta.title) {
      document.title = to.meta.title;
    }

    // 这里可以添加认证检查
    // if (to.meta.requiresAuth && !isAuthenticated()) {
    //   next('/login');
    //   return;
    // }

    // 开发环境日志
    if (import.meta.env.DEV) {
      console.log(`🔄 路由导航: ${from.path} → ${to.path}`);
    }

    next();
  });

  // 全局后置守卫
  router.afterEach((to, from) => {
    // 页面访问统计
    if (import.meta.env.DEV) {
      console.log(`✅ 路由完成: ${to.path} (来自: ${from.path})`);
    }

    // 这里可以添加页面访问分析
    // trackPageView(to.path, to.meta.title);
  });

  // 路由错误处理
  router.onError((error) => {
    console.error('🚨 路由错误:', error);
    
    // 这里可以添加错误报告
    // reportError('router-error', error);
  });
}