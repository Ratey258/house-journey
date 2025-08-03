/**
 * 全局状态管理配置
 */

import { createPinia } from 'pinia';

/**
 * 创建Pinia实例
 */
export function createAppStore() {
  const pinia = createPinia();
  
  // 开发环境插件
  if (import.meta.env.DEV) {
    // 可以添加Pinia DevTools支持
  }
  
  return pinia;
}