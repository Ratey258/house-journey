/**
 * 第三方库配置文件 - TypeScript版本
 * 用于初始化和配置游戏中使用的第三方库
 * 
 * 优化说明：移除了未使用的Chart.js依赖，仅保留ECharts以减少构建体积
 */

import type { App } from 'vue';

// 图表库 - 使用ECharts替代Chart.js
import * as echarts from 'echarts/core';
import { 
  LineChart, 
  BarChart, 
  PieChart,
  ScatterChart
} from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LegendComponent,
  ToolboxComponent
} from 'echarts/components';
import { LabelLayout, UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';

// 日期处理
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';
import 'dayjs/locale/zh-cn';

// Element Plus
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';

// 虚拟滚动
import VueVirtualScroller from 'vue-virtual-scroller';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';

// 音频处理
import { Howl, Howler } from 'howler';

// 工具函数
// 移除VueUseComponentsPlugin导入

/**
 * 初始化ECharts配置
 */
function setupECharts(): void {
  // 注册必要的组件
  echarts.use([
    TitleComponent,
    TooltipComponent,
    GridComponent,
    DatasetComponent,
    TransformComponent,
    LegendComponent,
    ToolboxComponent,
    LineChart,
    BarChart,
    PieChart,
    ScatterChart,
    LabelLayout,
    UniversalTransition,
    CanvasRenderer
  ]);

  // 设置默认主题
  const theme = {
    color: [
      '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
      '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'
    ],
    backgroundColor: 'transparent',
    textStyle: {
      color: '#333',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    },
    title: {
      textStyle: {
        color: '#333',
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      backgroundColor: 'rgba(50, 50, 50, 0.9)',
      borderColor: 'transparent',
      textStyle: {
        color: '#fff'
      }
    },
    grid: {
      borderColor: 'transparent'
    }
  };

  // 注册主题
  echarts.registerTheme('houseJourney', theme);

  console.log('✅ ECharts 配置初始化完成');
}

/**
 * 初始化日期处理库
 */
function setupDayjs(): void {
  // 扩展插件
  dayjs.extend(relativeTime);
  dayjs.extend(updateLocale);
  
  // 设置中文语言
  dayjs.locale('zh-cn');
  
  // 自定义相对时间显示
  dayjs.updateLocale('zh-cn', {
    relativeTime: {
      future: "%s后",
      past: "%s前", 
      s: '几秒',
      m: "1分钟",
      mm: "%d分钟",
      h: "1小时",
      hh: "%d小时", 
      d: "1天",
      dd: "%d天",
      M: "1个月",
      MM: "%d个月",
      y: "1年",
      yy: "%d年"
    }
  });

  console.log('✅ Dayjs 配置初始化完成');
}

/**
 * 初始化Element Plus
 */
function setupElementPlus(app: App): void {
  app.use(ElementPlus, {
    locale: zhCn,
    size: 'default',
    zIndex: 2000
  });

  console.log('✅ Element Plus 配置初始化完成');
}

/**
 * 初始化虚拟滚动
 */
function setupVueVirtualScroller(app: App): void {
  app.use(VueVirtualScroller);
  console.log('✅ Vue Virtual Scroller 配置初始化完成');
}

/**
 * 初始化音频处理
 */
function setupHowler(): void {
  // 全局音频设置
  Howler.volume(0.7); // 默认音量70%
  // 注意：html5PoolSize 在新版本的Howler中可能不存在，移除该行
  
  // 设置音频格式偏好
  const formats = ['webm', 'mp3', 'wav'];
  
  // 检测浏览器支持的音频格式
  const supportedFormat = formats.find(format => {
    const audio = document.createElement('audio');
    return audio.canPlayType(`audio/${format}`) !== '';
  });

  if (supportedFormat) {
    console.log(`✅ Howler 配置初始化完成，支持格式: ${supportedFormat}`);
  } else {
    console.warn('⚠️ 浏览器不支持常见音频格式');
  }
}

/**
 * 初始化性能监控
 */
function setupPerformanceMonitoring(): void {
  // 监控资源使用情况
  if ('memory' in performance) {
    const memoryInfo = (performance as any).memory;
    if (memoryInfo) {
      console.log(`📊 内存使用情况: ${Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024)}MB / ${Math.round(memoryInfo.jsHeapSizeLimit / 1024 / 1024)}MB`);
    }
  }

  // 监控页面加载性能
  window.addEventListener('load', () => {
    const perfData = performance.timing;
    const loadTime = perfData.loadEventEnd - perfData.navigationStart;
    console.log(`📊 页面加载时间: ${loadTime}ms`);
  });

  console.log('✅ 性能监控初始化完成');
}

/**
 * 错误监控和上报
 */
function setupErrorMonitoring(): void {
  // 监控全局JavaScript错误
  window.addEventListener('error', (event) => {
    console.error('🚨 全局JavaScript错误:', {
      message: event.message,
      filename: event.filename,
      line: event.lineno,
      column: event.colno,
      error: event.error
    });
  });

  // 监控Promise未捕获的reject
  window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 未捕获的Promise错误:', event.reason);
  });

  console.log('✅ 错误监控初始化完成');
}

/**
 * 主要的第三方库初始化函数
 * @param app - Vue应用实例
 */
export function setupThirdParty(app: App): void {
  console.log('🚀 开始初始化第三方库...');

  try {
    // 依次初始化各个库
    setupECharts();
    setupDayjs();
    setupElementPlus(app);
    setupVueVirtualScroller(app);
    setupHowler();
    // setupPerformanceMonitoring(); // 暂时隐藏性能监控
    setupErrorMonitoring();

    console.log('✅ 所有第三方库初始化完成');
  } catch (error) {
    console.error('❌ 第三方库初始化失败:', error);
    throw error;
  }
}

// 导出工具函数用于其他模块使用
export {
  echarts,
  dayjs,
  Howl,
  Howler
};