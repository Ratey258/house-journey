/**
 * 桌面端布局系统 Composable
 * 基于 @vueuse/core 实现桌面端自适应布局
 * 专门针对桌面端（网页+Electron）优化屏幕尺寸和窗口体验
 */
import {
  useWindowSize,
  useFullscreen,
  useDark,
  useBreakpoints,
  breakpointsTailwind,
  useElementSize,
  useResizeObserver,
  useMagicKeys,
  whenever
} from '@vueuse/core';
import { computed, ref, watch, onMounted, readonly, type Ref } from 'vue';
import { useSmartLogger } from '../../infrastructure/utils/smartLogger';

// 桌面端屏幕尺寸断点
const desktopBreakpoints = {
  small: 1366,    // 小屏桌面 (1366x768)
  medium: 1680,   // 中屏桌面 (1680x1050)
  large: 1920,    // 大屏桌面 (1920x1080)
  xlarge: 2560,   // 超大屏桌面 (2K)
  ultra: 3840     // 4K屏幕
};

// 布局配置接口
export interface LayoutConfig {
  sidebar: 'hidden' | 'collapsed' | 'expanded' | 'floating';
  panels: 'single' | 'dual' | 'multi';
  toolbar: 'hidden' | 'compact' | 'full';
  content: 'centered' | 'wide' | 'full';
  spacing: 'compact' | 'normal' | 'relaxed';
}

// 窗口状态接口
export interface WindowState {
  isFullscreen: boolean;
  isMaximized: boolean;
  isMinimized: boolean;
  canFullscreen: boolean;
  canMaximize: boolean;
  canMinimize: boolean;
}

// 屏幕信息接口
export interface ScreenInfo {
  width: number;
  height: number;
  ratio: number;
  isWidescreen: boolean;
  isUltraWide: boolean;
  is4K: boolean;
  isRetina: boolean;
  orientation: 'landscape' | 'portrait';
  category: 'small' | 'medium' | 'large' | 'xlarge' | 'ultra';
}

// 布局优化建议接口
export interface LayoutSuggestion {
  type: 'info' | 'warning' | 'recommendation';
  title: string;
  message: string;
  action?: string;
  priority: 'low' | 'medium' | 'high';
}

export function useDesktopLayout() {
  const logger = useSmartLogger();

  // 核心hooks
  const { width, height } = useWindowSize();
  const { isFullscreen, toggle: toggleFullscreen, enter: enterFullscreen, exit: exitFullscreen } = useFullscreen();
  const isDark = useDark();
  const breakpoints = useBreakpoints(breakpointsTailwind);

  // 自定义桌面端断点
  const desktopBreakpointsRef = useBreakpoints(desktopBreakpoints);

  // 键盘快捷键
  const keys = useMagicKeys();
  const ctrlF11 = keys['Ctrl+F11'];
  const f11 = keys['F11'];
  const altEnter = keys['Alt+Enter'];

  // 布局状态
  const currentLayout = ref<LayoutConfig>({
    sidebar: 'expanded',
    panels: 'single',
    toolbar: 'full',
    content: 'centered',
    spacing: 'normal'
  });

  // 布局建议
  const layoutSuggestions = ref<LayoutSuggestion[]>([]);

  // 屏幕信息计算
  const screenInfo = computed<ScreenInfo>(() => {
    const w = width.value;
    const h = height.value;
    const ratio = w / h;

    let category: ScreenInfo['category'] = 'small';
    if (w >= desktopBreakpoints.ultra) category = 'ultra';
    else if (w >= desktopBreakpoints.xlarge) category = 'xlarge';
    else if (w >= desktopBreakpoints.large) category = 'large';
    else if (w >= desktopBreakpoints.medium) category = 'medium';

    return {
      width: w,
      height: h,
      ratio,
      isWidescreen: ratio >= 1.6,
      isUltraWide: ratio >= 2.1,
      is4K: w >= 3840 && h >= 2160,
      isRetina: window.devicePixelRatio >= 2,
      orientation: w > h ? 'landscape' : 'portrait',
      category
    };
  });

  // 窗口状态（集成Electron功能）
  const windowState = computed<WindowState>(() => ({
    isFullscreen: isFullscreen.value,
    isMaximized: false, // 将由Electron API提供
    isMinimized: false, // 将由Electron API提供
    canFullscreen: true,
    canMaximize: !!window.electronAPI?.maximize,
    canMinimize: !!window.electronAPI?.minimize
  }));

  // 智能布局配置
  const optimizedLayout = computed<LayoutConfig>(() => {
    const screen = screenInfo.value;
    const config: LayoutConfig = {
      sidebar: 'expanded',
      panels: 'single',
      toolbar: 'full',
      content: 'centered',
      spacing: 'normal'
    };

    // 根据屏幕尺寸调整布局
    switch (screen.category) {
      case 'small':
        config.sidebar = 'collapsed';
        config.panels = 'single';
        config.toolbar = 'compact';
        config.content = 'wide';
        config.spacing = 'compact';
        break;

      case 'medium':
        config.sidebar = 'expanded';
        config.panels = 'single';
        config.toolbar = 'full';
        config.content = 'centered';
        config.spacing = 'normal';
        break;

      case 'large':
        config.sidebar = 'expanded';
        config.panels = screen.isWidescreen ? 'dual' : 'single';
        config.toolbar = 'full';
        config.content = 'wide';
        config.spacing = 'normal';
        break;

      case 'xlarge':
        config.sidebar = 'expanded';
        config.panels = 'dual';
        config.toolbar = 'full';
        config.content = 'wide';
        config.spacing = 'relaxed';
        break;

      case 'ultra':
        config.sidebar = 'expanded';
        config.panels = screen.isUltraWide ? 'multi' : 'dual';
        config.toolbar = 'full';
        config.content = 'full';
        config.spacing = 'relaxed';
        break;
    }

    // 全屏模式调整
    if (isFullscreen.value) {
      config.toolbar = 'hidden';
      config.content = 'full';
    }

    // 暗色主题调整
    if (isDark.value && screen.category === 'small') {
      config.spacing = 'compact'; // 暗色主题下小屏更紧凑
    }

    return config;
  });

  // CSS变量生成
  const cssVariables = computed(() => {
    const screen = screenInfo.value;
    const layout = optimizedLayout.value;

    return {
      // 布局尺寸
      '--layout-sidebar-width': getSidebarWidth(layout.sidebar),
      '--layout-panel-gap': getPanelGap(layout.spacing),
      '--layout-content-max-width': getContentMaxWidth(layout.content, screen.width),
      '--layout-toolbar-height': getToolbarHeight(layout.toolbar),

      // 响应式间距
      '--layout-spacing-xs': getSpacing('xs', layout.spacing),
      '--layout-spacing-sm': getSpacing('sm', layout.spacing),
      '--layout-spacing-md': getSpacing('md', layout.spacing),
      '--layout-spacing-lg': getSpacing('lg', layout.spacing),
      '--layout-spacing-xl': getSpacing('xl', layout.spacing),

      // 断点
      '--layout-breakpoint-current': screen.category,
      '--layout-screen-width': `${screen.width}px`,
      '--layout-screen-height': `${screen.height}px`,

      // 状态
      '--layout-is-fullscreen': isFullscreen.value ? '1' : '0',
      '--layout-is-widescreen': screen.isWidescreen ? '1' : '0',
      '--layout-is-ultrawide': screen.isUltraWide ? '1' : '0'
    };
  });

  // 布局建议生成
  const generateLayoutSuggestions = (): void => {
    const suggestions: LayoutSuggestion[] = [];
    const screen = screenInfo.value;

    // 小屏幕建议
    if (screen.category === 'small') {
      suggestions.push({
        type: 'recommendation',
        title: '小屏幕优化',
        message: '当前屏幕分辨率较低，建议使用紧凑布局以获得更好的使用体验',
        action: 'apply-compact-layout',
        priority: 'medium'
      });
    }

    // 超宽屏建议
    if (screen.isUltraWide && optimizedLayout.value.panels === 'single') {
      suggestions.push({
        type: 'recommendation',
        title: '超宽屏优化',
        message: '您的显示器支持超宽布局，建议启用多面板视图以充分利用屏幕空间',
        action: 'enable-multi-panel',
        priority: 'high'
      });
    }

    // 4K屏幕建议
    if (screen.is4K && optimizedLayout.value.spacing === 'normal') {
      suggestions.push({
        type: 'info',
        title: '4K显示器',
        message: '检测到4K显示器，已自动优化界面缩放和间距',
        priority: 'low'
      });
    }

    // 竖屏警告
    if (screen.orientation === 'portrait') {
      suggestions.push({
        type: 'warning',
        title: '竖屏模式',
        message: '当前为竖屏模式，游戏界面可能不是最佳状态。建议调整为横屏模式',
        action: 'suggest-landscape',
        priority: 'high'
      });
    }

    // 全屏建议
    if (!isFullscreen.value && screen.category >= 'large') {
      suggestions.push({
        type: 'info',
        title: '全屏模式',
        message: '按F11或Ctrl+F11可以进入全屏模式，获得更沉浸的游戏体验',
        action: 'enter-fullscreen',
        priority: 'low'
      });
    }

    layoutSuggestions.value = suggestions;
  };

  // 辅助函数
  const getSidebarWidth = (sidebar: LayoutConfig['sidebar']): string => {
    switch (sidebar) {
      case 'hidden': return '0px';
      case 'collapsed': return '60px';
      case 'expanded': return '280px';
      case 'floating': return '320px';
      default: return '280px';
    }
  };

  const getPanelGap = (spacing: LayoutConfig['spacing']): string => {
    switch (spacing) {
      case 'compact': return '8px';
      case 'normal': return '16px';
      case 'relaxed': return '24px';
      default: return '16px';
    }
  };

  const getContentMaxWidth = (content: LayoutConfig['content'], screenWidth: number): string => {
    switch (content) {
      case 'centered': return '1200px';
      case 'wide': return '1400px';
      case 'full': return '100%';
      default: return '1200px';
    }
  };

  const getToolbarHeight = (toolbar: LayoutConfig['toolbar']): string => {
    switch (toolbar) {
      case 'hidden': return '0px';
      case 'compact': return '40px';
      case 'full': return '56px';
      default: return '56px';
    }
  };

  const getSpacing = (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl', spacing: LayoutConfig['spacing']): string => {
    const multiplier = spacing === 'compact' ? 0.75 : spacing === 'relaxed' ? 1.25 : 1;
    const base = {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32
    };
    return `${base[size] * multiplier}px`;
  };

  // 布局控制方法
  const applyLayout = (layout: Partial<LayoutConfig>): void => {
    currentLayout.value = { ...currentLayout.value, ...layout };
    logger.info('布局已更新', { layout: currentLayout.value });
  };

  const applyOptimizedLayout = (): void => {
    currentLayout.value = { ...optimizedLayout.value };
    logger.info('已应用优化布局', {
      layout: currentLayout.value,
      screenCategory: screenInfo.value.category
    });
  };

  const resetLayout = (): void => {
    currentLayout.value = {
      sidebar: 'expanded',
      panels: 'single',
      toolbar: 'full',
      content: 'centered',
      spacing: 'normal'
    };
    logger.info('布局已重置为默认设置');
  };

  // 窗口控制方法
  const windowControls = {
    async minimize(): Promise<void> {
      if (window.electronAPI?.minimize) {
        await window.electronAPI.minimize();
        logger.info('窗口已最小化');
      }
    },

    async maximize(): Promise<void> {
      if (window.electronAPI?.maximize) {
        await window.electronAPI.maximize();
        logger.info('窗口最大化状态已切换');
      }
    },

    async close(): Promise<void> {
      if (window.electronAPI?.close) {
        await window.electronAPI.close();
        logger.info('窗口关闭请求已发送');
      }
    },

    async toggleFullscreen(): Promise<void> {
      try {
        await toggleFullscreen();
        logger.info(`全屏模式已${isFullscreen.value ? '开启' : '关闭'}`);
      } catch (error) {
        logger.error('切换全屏模式失败', error);
      }
    },

    async enterFullscreen(): Promise<void> {
      try {
        await enterFullscreen();
        logger.info('已进入全屏模式');
      } catch (error) {
        logger.error('进入全屏模式失败', error);
      }
    },

    async exitFullscreen(): Promise<void> {
      try {
        await exitFullscreen();
        logger.info('已退出全屏模式');
      } catch (error) {
        logger.error('退出全屏模式失败', error);
      }
    }
  };

  // 建议操作处理
  const handleSuggestionAction = (action: string): void => {
    switch (action) {
      case 'apply-compact-layout':
        applyLayout({
          sidebar: 'collapsed',
          spacing: 'compact',
          toolbar: 'compact'
        });
        break;

      case 'enable-multi-panel':
        applyLayout({
          panels: screenInfo.value.isUltraWide ? 'multi' : 'dual',
          content: 'wide'
        });
        break;

      case 'enter-fullscreen':
        windowControls.enterFullscreen();
        break;

      case 'suggest-landscape':
        // 显示提示，无法强制旋转屏幕
        logger.info('建议将显示器调整为横屏模式');
        break;

      default:
        logger.warn('未知的建议操作', action);
    }
  };

  // 自动应用CSS变量
  const applyCssVariables = (): void => {
    const vars = cssVariables.value;
    const root = document.documentElement;

    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, String(value));
    });
  };

  // 监听屏幕尺寸变化
  watch([width, height], () => {
    generateLayoutSuggestions();
    applyCssVariables();
  }, { immediate: true });

  // 监听全屏状态变化
  watch(isFullscreen, (newValue) => {
    generateLayoutSuggestions();
    applyCssVariables();
    logger.info(`全屏状态变化: ${newValue ? '开启' : '关闭'}`);
  });

  // 监听布局变化
  watch(currentLayout, () => {
    applyCssVariables();
  }, { deep: true });

  // 键盘快捷键监听
  whenever(f11, () => windowControls.toggleFullscreen());
  whenever(ctrlF11, () => windowControls.toggleFullscreen());
  whenever(altEnter, () => windowControls.toggleFullscreen());

  // 初始化
  onMounted(() => {
    generateLayoutSuggestions();
    applyCssVariables();
    logger.info('桌面端布局系统已初始化', {
      screenInfo: screenInfo.value,
      layout: currentLayout.value
    });
  });

  return {
    // 屏幕信息
    screenInfo: readonly(screenInfo),
    windowState: readonly(windowState),

    // 布局状态
    currentLayout: readonly(currentLayout),
    optimizedLayout: readonly(optimizedLayout),
    cssVariables: readonly(cssVariables),

    // 建议系统
    layoutSuggestions: readonly(layoutSuggestions),
    handleSuggestionAction,

    // 布局控制
    applyLayout,
    applyOptimizedLayout,
    resetLayout,

    // 窗口控制
    windowControls,

    // 原始数据
    width: readonly(width),
    height: readonly(height),
    isFullscreen: readonly(isFullscreen),
    isDark: readonly(isDark),

    // 断点
    breakpoints: readonly(breakpoints),
    desktopBreakpoints: readonly(desktopBreakpointsRef)
  };
}
