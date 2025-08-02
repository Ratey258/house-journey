/**
 * UI配置文件
 * 包含界面相关的配置参数
 */

/**
 * Toast提示配置接口
 */
export interface ToastConfig {
  defaultDuration: number;
  maxToasts: number;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  animationDuration: number;
}

/**
 * 动画配置接口
 */
export interface AnimationConfig {
  fadeIn: number;
  fadeOut: number;
  slideIn: number;  
  slideOut: number;
  bounce: number;
  scale: number;
}

/**
 * 桌面端分辨率断点配置接口
 */
export interface BreakpointConfig {
  compact: number;
  standard: number;
  wide: number;
  ultrawide: number;
}

/**
 * UI配置接口
 */
export interface UIConfig {
  toast: ToastConfig;
  animation: AnimationConfig;
  breakpoints: BreakpointConfig;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    successColor: string;
    warningColor: string;
    errorColor: string;
    infoColor: string;
  };
  layout: {
    headerHeight: number;
    sidebarWidth: number;
    sidebarCollapsedWidth: number;
    contentPadding: number;
  };
}

/**
 * UI配置
 */
export const uiConfig: UIConfig = {
  // Toast提示配置
  toast: {
    defaultDuration: 3000,        // 默认显示时长: 3秒
    maxToasts: 5,                 // 最大同时显示数量
    position: 'top-right',        // 显示位置
    animationDuration: 300        // 动画时长
  },

  // 动画配置
  animation: {
    fadeIn: 300,                  // 淡入动画时长
    fadeOut: 200,                 // 淡出动画时长
    slideIn: 400,                 // 滑入动画时长
    slideOut: 300,                // 滑出动画时长
    bounce: 600,                  // 弹跳动画时长
    scale: 250                    // 缩放动画时长
  },

  // 桌面端分辨率断点
  breakpoints: {
    compact: 1280,                // 紧凑桌面布局
    standard: 1920,               // 标准桌面布局
    wide: 2560,                   // 宽屏桌面布局
    ultrawide: 3440               // 超宽屏断点
  },

  // 主题颜色
  theme: {
    primaryColor: '#667eea',      // 主色调
    secondaryColor: '#764ba2',    // 次要色调
    successColor: '#4CAF50',      // 成功色
    warningColor: '#FF9800',      // 警告色
    errorColor: '#F44336',        // 错误色
    infoColor: '#2196F3'          // 信息色
  },

  // 布局配置
  layout: {
    headerHeight: 64,             // 头部高度 (px)
    sidebarWidth: 280,            // 侧边栏宽度 (px)
    sidebarCollapsedWidth: 64,    // 侧边栏折叠宽度 (px)
    contentPadding: 24            // 内容区域内边距 (px)
  }
};

/**
 * 获取Toast配置
 */
export const getToastConfig = (): ToastConfig => uiConfig.toast;

/**
 * 获取动画配置
 */
export const getAnimationConfig = (): AnimationConfig => uiConfig.animation;

/**
 * 获取断点配置
 */
export const getBreakpointConfig = (): BreakpointConfig => uiConfig.breakpoints;