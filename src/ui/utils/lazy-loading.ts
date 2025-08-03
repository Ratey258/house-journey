/**
 * 懒加载组件工具
 * 用于性能优化的组件动态导入
 */

import { defineAsyncComponent, AsyncComponentLoader } from 'vue'

/**
 * 创建懒加载组件
 * @param loader 组件加载器函数
 * @param loadingComponent 加载中显示的组件
 * @param errorComponent 错误时显示的组件
 * @param delay 延迟时间（毫秒）
 * @param timeout 超时时间（毫秒）
 */
export function createLazyComponent(
  loader: AsyncComponentLoader,
  options: {
    loadingComponent?: any
    errorComponent?: any
    delay?: number
    timeout?: number
  } = {}
) {
  return defineAsyncComponent({
    loader,
    loadingComponent: options.loadingComponent,
    errorComponent: options.errorComponent,
    delay: options.delay || 200,
    timeout: options.timeout || 10000
  })
}

/**
 * 预定义的懒加载组件集合
 * 按优先级和使用频率分组
 */

// 🔥 高频使用组件 - 短延迟
export const HighFrequencyComponents = {
  // 游戏核心组件
  GameHeader: () => import('@/ui/components/game/GameHeader.vue'),
  GameSidebar: () => import('@/ui/components/game/GameSidebar.vue'),
  
  // 玩家核心组件
  PlayerInfo: () => import('@/ui/components/player/PlayerInfo.vue'),
  
  // 市场核心组件
  Market: () => import('@/ui/components/market/Market.vue'),
  PriceChart: () => import('@/ui/components/market/PriceChart.vue')
}

// ⚡ 中频使用组件 - 中等延迟
export const MediumFrequencyComponents = {
  // 库存和交易
  Inventory: () => import('@/ui/components/player/Inventory.vue'),
  TradePanel: () => import('@/ui/components/market/TradePanel.vue'),
  
  // 房产系统
  HouseMarket: () => import('@/ui/components/market/HouseMarket.vue'),
  
  // 银行系统
  BankModal: () => import('@/ui/components/player/BankModal.vue')
}

// 🐌 低频使用组件 - 长延迟
export const LowFrequencyComponents = {
  // 设置和配置
  SettingsView: () => import('@/ui/views/SettingsView.vue'),
  SavesView: () => import('@/ui/views/SavesView.vue'),
  
  // 错误处理
  ErrorBoundary: () => import('@/ui/components/common/ErrorBoundary.vue'),
  ErrorDialog: () => import('@/ui/components/common/ErrorDialog.vue'),
  
  // 开发工具
  DevToolsView: () => import('@/ui/views/DevToolsView.vue'),
  FloatingDevTools: () => import('@/ui/components/common/FloatingDevTools.vue'),
  
  // 教程系统
  TutorialSystem: () => import('@/ui/components/common/TutorialSystem.vue')
}

/**
 * 智能懒加载 - 根据网络状况和设备性能调整策略
 */
export class SmartLazyLoader {
  private static networkType: string = 'unknown'
  private static deviceMemory: number = 4 // 默认4GB
  
  static {
    // 检测网络类型
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      SmartLazyLoader.networkType = connection?.effectiveType || 'unknown'
    }
    
    // 检测设备内存
    if ('deviceMemory' in navigator) {
      SmartLazyLoader.deviceMemory = (navigator as any).deviceMemory || 4
    }
  }
  
  /**
   * 获取优化的加载策略
   */
  static getLoadingStrategy() {
    const isLowEndDevice = SmartLazyLoader.deviceMemory < 4
    const isSlowNetwork = ['slow-2g', '2g', '3g'].includes(SmartLazyLoader.networkType)
    
    if (isLowEndDevice || isSlowNetwork) {
      return {
        delay: 500,
        timeout: 15000,
        chunkSize: 'small'
      }
    } else if (SmartLazyLoader.deviceMemory >= 8 && ['4g', '5g'].includes(SmartLazyLoader.networkType)) {
      return {
        delay: 100,
        timeout: 5000,
        chunkSize: 'large'
      }
    }
    
    return {
      delay: 200,
      timeout: 10000,
      chunkSize: 'medium'
    }
  }
  
  /**
   * 创建智能懒加载组件
   */
  static createSmartComponent(loader: AsyncComponentLoader, fallback?: any) {
    const strategy = SmartLazyLoader.getLoadingStrategy()
    
    return defineAsyncComponent({
      loader,
      loadingComponent: fallback,
      delay: strategy.delay,
      timeout: strategy.timeout
    })
  }
}

/**
 * 预加载重要组件
 * 在空闲时间预加载关键组件以提升用户体验
 */
export class ComponentPreloader {
  private static preloadQueue: Array<() => Promise<any>> = []
  private static isPreloading = false
  
  /**
   * 添加组件到预加载队列
   */
  static addToQueue(loader: () => Promise<any>) {
    ComponentPreloader.preloadQueue.push(loader)
  }
  
  /**
   * 开始预加载过程
   */
  static async startPreloading() {
    if (ComponentPreloader.isPreloading) return
    
    ComponentPreloader.isPreloading = true
    
    // 使用requestIdleCallback在浏览器空闲时预加载
    const preloadNext = async () => {
      if (ComponentPreloader.preloadQueue.length === 0) {
        ComponentPreloader.isPreloading = false
        return
      }
      
      const loader = ComponentPreloader.preloadQueue.shift()!
      
      try {
        await loader()
      } catch (error) {
        console.warn('组件预加载失败:', error)
      }
      
      // 继续预加载下一个
      if ('requestIdleCallback' in window) {
        requestIdleCallback(preloadNext)
      } else {
        setTimeout(preloadNext, 100)
      }
    }
    
    preloadNext()
  }
  
  /**
   * 预加载核心游戏组件
   */
  static preloadCoreComponents() {
    // 添加核心组件到预加载队列
    Object.values(HighFrequencyComponents).forEach(loader => {
      ComponentPreloader.addToQueue(loader)
    })
    
    // 开始预加载
    ComponentPreloader.startPreloading()
  }
}

/**
 * 组件懒加载助手
 * 提供常用的懒加载模式
 */
export const LazyComponentHelper = {
  /**
   * 创建带加载指示器的懒加载组件
   */
  withLoadingIndicator: (loader: AsyncComponentLoader) => {
    return createLazyComponent(loader, {
      loadingComponent: {
        template: '<div class="component-loading">⚡ 加载中...</div>'
      }
    })
  },
  
  /**
   * 创建带错误处理的懒加载组件
   */
  withErrorHandling: (loader: AsyncComponentLoader) => {
    return createLazyComponent(loader, {
      errorComponent: {
        template: '<div class="component-error">❌ 组件加载失败</div>'
      }
    })
  },
  
  /**
   * 创建完整的懒加载组件（包含加载和错误处理）
   */
  complete: (loader: AsyncComponentLoader) => {
    return createLazyComponent(loader, {
      loadingComponent: {
        template: `
          <div class="component-loading">
            <div class="loading-spinner"></div>
            <span>正在加载组件...</span>
          </div>
        `
      },
      errorComponent: {
        template: `
          <div class="component-error">
            <span>❌ 组件加载失败</span>
            <button onclick="location.reload()">重新加载</button>
          </div>
        `
      }
    })
  }
}