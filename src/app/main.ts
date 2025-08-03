/**
 * 应用主入口文件
 * Vue 3.5 + FSD架构 + Clean Architecture
 */

import { createApp } from 'vue';
import { createAppRouter } from './router';
import { createAppStore } from './store';
import { getAppConfig, validateAppConfig } from './config';
import AppProvider from './providers/AppProvider.vue';

// 导入全局样式
import '../shared/styles/global.css';
import '../shared/styles/variables.css';

/**
 * 创建Vue应用实例
 */
async function createVueApp() {
  // 获取应用配置
  const config = getAppConfig();
  
  // 验证配置
  if (!validateAppConfig(config)) {
    throw new Error('应用配置验证失败');
  }

  if (config.debug) {
    console.log('🚀 应用启动配置:', config);
  }

  // 创建Vue应用
  const app = createApp(AppProvider);

  // 创建路由
  const router = createAppRouter();
  app.use(router);

  // 创建状态管理
  const store = createAppStore();
  app.use(store);

  // 全局属性
  app.config.globalProperties.$appConfig = config;

  // 开发环境配置
  if (config.debug) {
    app.config.performance = true;
    
    // 全局错误处理
    app.config.errorHandler = (error, instance, info) => {
      console.error('🚨 Vue应用错误:', error);
      console.error('📍 组件实例:', instance);
      console.error('ℹ️ 错误信息:', info);
    };
    
    // 警告处理
    app.config.warnHandler = (msg, instance, trace) => {
      console.warn('⚠️ Vue警告:', msg);
      console.warn('📍 组件实例:', instance);
      console.warn('📋 组件栈:', trace);
    };
  }

  return { app, router, config };
}

/**
 * 挂载应用
 */
async function mountApp() {
  try {
    const { app, router, config } = await createVueApp();
    
    // 等待路由准备完成
    await router.isReady();
    
    // 挂载到DOM
    const mountElement = document.getElementById('app');
    if (!mountElement) {
      throw new Error('找不到挂载元素 #app');
    }
    
    app.mount(mountElement);
    
    if (config.debug) {
      console.log('✅ 应用挂载成功');
      console.log('📱 当前路由:', router.currentRoute.value.path);
    }
    
    // 设置全局应用信息
    document.title = config.name;
    
    // 开发环境信息
    if (config.debug) {
      console.log(`🏠 ${config.name} v${config.version}`);
      console.log('🏗️ 架构: Feature-Sliced Design + Clean Architecture');
      console.log('⚡ Vue 3.5 + TypeScript 5.4+ + Vite 6.0');
    }
    
  } catch (error) {
    console.error('🚨 应用启动失败:', error);
    
    // 显示友好的错误页面
    document.body.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        font-family: system-ui, -apple-system, sans-serif;
        background: #f5f5f5;
        margin: 0;
        padding: 20px;
      ">
        <div style="
          text-align: center;
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          max-width: 400px;
        ">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🚨</div>
          <h2 style="color: #e74c3c; margin-bottom: 1rem;">应用启动失败</h2>
          <p style="color: #666; margin-bottom: 2rem;">
            应用无法正常启动，请刷新页面重试。
          </p>
          <button onclick="window.location.reload()" style="
            background: #3498db;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1rem;
          ">
            刷新页面
          </button>
        </div>
      </div>
    `;
  }
}

// 启动应用
mountApp();