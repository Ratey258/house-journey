/**
 * 第三方库配置文件
 * 用于初始化和配置游戏中使用的第三方库
 */

// 图表库
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
function setupECharts() {
  // 注册必要的组件
  echarts.use([
    LineChart,
    BarChart,
    PieChart,
    ScatterChart,
    TitleComponent,
    TooltipComponent,
    GridComponent,
    DatasetComponent,
    TransformComponent,
    LegendComponent,
    ToolboxComponent,
    LabelLayout,
    UniversalTransition,
    CanvasRenderer
  ]);

  // 设置主题色
  const theme = {
    color: [
      '#3498DB', // 品牌蓝
      '#F39C12', // 活力橙
      '#2ECC71', // 成功绿
      '#E74C3C', // 错误红
      '#9B59B6', // 紫色
      '#1ABC9C', // 青色
      '#34495E'  // 深灰色
    ],
    backgroundColor: 'rgba(255, 255, 255, 0)',
    textStyle: {},
    title: {
      textStyle: {
        color: '#34495E',
        fontSize: 16
      },
      subtextStyle: {
        color: '#95A5A6'
      }
    },
    line: {
      itemStyle: {
        borderWidth: 2
      },
      lineStyle: {
        width: 3
      },
      symbolSize: 8,
      symbol: 'circle',
      smooth: true
    },
    radar: {
      itemStyle: {
        borderWidth: 1
      },
      lineStyle: {
        width: 2
      },
      symbolSize: 6,
      symbol: 'circle',
      smooth: true
    }
  };

  // 注册自定义主题
  echarts.registerTheme('buyHouseTheme', theme);

  return echarts;
}

/**
 * 初始化日期处理
 */
function setupDayjs() {
  // 使用插件
  dayjs.extend(relativeTime);
  dayjs.extend(updateLocale);
  
  // 设置中文
  dayjs.locale('zh-cn');
  
  // 自定义相对时间文本
  dayjs.updateLocale('zh-cn', {
    relativeTime: {
      future: '%s后',
      past: '%s前',
      s: '几秒',
      m: '1分钟',
      mm: '%d分钟',
      h: '1小时',
      hh: '%d小时',
      d: '1天',
      dd: '%d天',
      w: '1周',
      ww: '%d周',
      M: '1个月',
      MM: '%d个月',
      y: '1年',
      yy: '%d年'
    }
  });

  return dayjs;
}

/**
 * 初始化音频系统
 */
function setupAudio() {
  // 设置全局配置
  Howler.autoUnlock = true;
  Howler.autoSuspend = true;
  Howler.html5PoolSize = 10;
  
  // 创建音频管理器
  const audioManager = {
    sounds: {},
    
    // 加载音效
    load(id, src, options = {}) {
      this.sounds[id] = new Howl({
        src: Array.isArray(src) ? src : [src],
        volume: options.volume || 1.0,
        loop: options.loop || false,
        preload: options.preload !== false,
        html5: options.html5 || false,
        onload: options.onload || null,
        onloaderror: options.onloaderror || null
      });
      
      return this.sounds[id];
    },
    
    // 播放音效
    play(id, options = {}) {
      const sound = this.sounds[id];
      if (!sound) return null;
      
      const soundId = sound.play();
      
      if (options.volume !== undefined) {
        sound.volume(options.volume, soundId);
      }
      
      if (options.rate !== undefined) {
        sound.rate(options.rate, soundId);
      }
      
      return soundId;
    },
    
    // 停止音效
    stop(id) {
      const sound = this.sounds[id];
      if (sound) sound.stop();
    },
    
    // 暂停音效
    pause(id) {
      const sound = this.sounds[id];
      if (sound) sound.pause();
    },
    
    // 设置全局音量
    setGlobalVolume(volume) {
      Howler.volume(volume);
    }
  };
  
  return audioManager;
}

/**
 * 安装所有第三方库
 * @param {Object} app - Vue应用实例
 */
export function setupThirdParty(app) {
  // 设置ECharts
  const echarts = setupECharts();
  app.config.globalProperties.$echarts = echarts;
  
  // 设置日期处理
  const dayjs = setupDayjs();
  app.config.globalProperties.$dayjs = dayjs;
  
  // 设置音频系统
  const audioManager = setupAudio();
  app.config.globalProperties.$audio = audioManager;
  
  // 安装Element Plus
  app.use(ElementPlus, {
    locale: zhCn,
    size: 'default',
    zIndex: 2000
  });
  
  // 安装虚拟滚动
  app.use(VueVirtualScroller);
  
  // 移除VueUseComponentsPlugin的使用
} 