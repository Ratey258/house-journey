/**
 * 性能监控工具
 * 用于监控应用性能并提供优化建议
 */

export interface PerformanceMetrics {
  // 页面加载性能
  pageLoad: {
    domContentLoaded: number
    loadComplete: number
    firstContentfulPaint: number
    largestContentfulPaint: number
  }
  
  // 组件渲染性能
  componentRender: {
    name: string
    mountTime: number
    updateTime: number
    renderCount: number
  }[]
  
  // 内存使用情况
  memory: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  }
  
  // 网络性能
  network: {
    effectiveType: string
    downlink: number
    rtt: number
  }
}

/**
 * 性能监控器类
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Partial<PerformanceMetrics> = {}
  private componentTimers = new Map<string, number>()
  private renderCounts = new Map<string, number>()
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }
  
  /**
   * 初始化性能监控
   */
  init() {
    this.collectPageLoadMetrics()
    this.collectNetworkMetrics()
    this.setupPerformanceObserver()
    this.startMemoryMonitoring()
  }
  
  /**
   * 收集页面加载性能指标
   */
  private collectPageLoadMetrics() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const timing = performance.timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      this.metrics.pageLoad = {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0
      }
      
      // 获取Paint时间
      const paintEntries = performance.getEntriesByType('paint')
      paintEntries.forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.pageLoad!.firstContentfulPaint = entry.startTime
        }
      })
    }
  }
  
  /**
   * 收集网络性能指标
   */
  private collectNetworkMetrics() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      this.metrics.network = {
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0
      }
    }
  }
  
  /**
   * 设置性能观察器
   */
  private setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      // 观察LCP
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        if (this.metrics.pageLoad) {
          this.metrics.pageLoad.largestContentfulPaint = lastEntry.startTime
        }
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      
      // 观察长任务
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          if (entry.duration > 50) {
            console.warn(`检测到长任务: ${entry.duration}ms`, entry)
          }
        })
      })
      longTaskObserver.observe({ entryTypes: ['longtask'] })
    }
  }
  
  /**
   * 开始内存监控
   */
  private startMemoryMonitoring() {
    const collectMemoryInfo = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        this.metrics.memory = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        }
      }
    }
    
    // 立即收集一次
    collectMemoryInfo()
    
    // 每30秒收集一次内存信息
    setInterval(collectMemoryInfo, 30000)
  }
  
  /**
   * 记录组件挂载开始
   */
  startComponentMount(componentName: string) {
    this.componentTimers.set(`${componentName}-mount`, performance.now())
  }
  
  /**
   * 记录组件挂载结束
   */
  endComponentMount(componentName: string) {
    const startTime = this.componentTimers.get(`${componentName}-mount`)
    if (startTime) {
      const mountTime = performance.now() - startTime
      this.recordComponentMetric(componentName, 'mount', mountTime)
      this.componentTimers.delete(`${componentName}-mount`)
    }
  }
  
  /**
   * 记录组件更新开始
   */
  startComponentUpdate(componentName: string) {
    this.componentTimers.set(`${componentName}-update`, performance.now())
  }
  
  /**
   * 记录组件更新结束
   */
  endComponentUpdate(componentName: string) {
    const startTime = this.componentTimers.get(`${componentName}-update`)
    if (startTime) {
      const updateTime = performance.now() - startTime
      this.recordComponentMetric(componentName, 'update', updateTime)
      this.componentTimers.delete(`${componentName}-update`)
    }
  }
  
  /**
   * 记录组件性能指标
   */
  private recordComponentMetric(componentName: string, type: 'mount' | 'update', time: number) {
    if (!this.metrics.componentRender) {
      this.metrics.componentRender = []
    }
    
    const renderCount = this.renderCounts.get(componentName) || 0
    this.renderCounts.set(componentName, renderCount + 1)
    
    const existingMetric = this.metrics.componentRender.find(m => m.name === componentName)
    if (existingMetric) {
      if (type === 'mount') {
        existingMetric.mountTime = time
      } else {
        existingMetric.updateTime = time
      }
      existingMetric.renderCount = renderCount + 1
    } else {
      this.metrics.componentRender.push({
        name: componentName,
        mountTime: type === 'mount' ? time : 0,
        updateTime: type === 'update' ? time : 0,
        renderCount: 1
      })
    }
  }
  
  /**
   * 获取性能指标
   */
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics }
  }
  
  /**
   * 获取性能报告
   */
  getPerformanceReport(): string {
    const metrics = this.getMetrics()
    const report = []
    
    report.push('🚀 性能监控报告')
    report.push('=' * 50)
    
    // 页面加载性能
    if (metrics.pageLoad) {
      report.push('\n📊 页面加载性能:')
      report.push(`  DOM内容加载: ${metrics.pageLoad.domContentLoaded}ms`)
      report.push(`  页面完全加载: ${metrics.pageLoad.loadComplete}ms`)
      report.push(`  首次内容绘制: ${metrics.pageLoad.firstContentfulPaint}ms`)
      report.push(`  最大内容绘制: ${metrics.pageLoad.largestContentfulPaint}ms`)
    }
    
    // 内存使用
    if (metrics.memory) {
      const memoryMB = (metrics.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)
      const totalMB = (metrics.memory.totalJSHeapSize / 1024 / 1024).toFixed(2)
      report.push(`\n💾 内存使用: ${memoryMB}MB / ${totalMB}MB`)
    }
    
    // 网络性能
    if (metrics.network) {
      report.push('\n🌐 网络性能:')
      report.push(`  连接类型: ${metrics.network.effectiveType}`)
      report.push(`  下载速度: ${metrics.network.downlink}Mbps`)
      report.push(`  往返时间: ${metrics.network.rtt}ms`)
    }
    
    // 组件性能
    if (metrics.componentRender && metrics.componentRender.length > 0) {
      report.push('\n🎯 组件渲染性能:')
      metrics.componentRender
        .sort((a, b) => b.mountTime + b.updateTime - (a.mountTime + a.updateTime))
        .slice(0, 10) // 只显示前10个最慢的组件
        .forEach(component => {
          report.push(`  ${component.name}: 挂载${component.mountTime.toFixed(2)}ms, 更新${component.updateTime.toFixed(2)}ms, 渲染次数${component.renderCount}`)
        })
    }
    
    return report.join('\n')
  }
  
  /**
   * 输出性能报告到控制台
   */
  logPerformanceReport() {
    console.log(this.getPerformanceReport())
  }
  
  /**
   * 获取性能建议
   */
  getPerformanceAdvice(): string[] {
    const advice = []
    const metrics = this.getMetrics()
    
    // 页面加载建议
    if (metrics.pageLoad) {
      if (metrics.pageLoad.loadComplete > 3000) {
        advice.push('⚠️ 页面加载时间过长（>3s），建议优化资源加载')
      }
      if (metrics.pageLoad.firstContentfulPaint > 2000) {
        advice.push('⚠️ 首次内容绘制时间过长（>2s），建议优化关键渲染路径')
      }
      if (metrics.pageLoad.largestContentfulPaint > 2500) {
        advice.push('⚠️ 最大内容绘制时间过长（>2.5s），建议优化主要内容加载')
      }
    }
    
    // 内存建议
    if (metrics.memory) {
      const memoryMB = metrics.memory.usedJSHeapSize / 1024 / 1024
      if (memoryMB > 100) {
        advice.push('⚠️ 内存使用过高（>100MB），建议检查内存泄漏')
      }
    }
    
    // 组件性能建议
    if (metrics.componentRender) {
      const slowComponents = metrics.componentRender.filter(c => c.mountTime > 100 || c.updateTime > 50)
      if (slowComponents.length > 0) {
        advice.push(`⚠️ 发现${slowComponents.length}个渲染较慢的组件，建议优化`)
      }
      
      const highRenderCountComponents = metrics.componentRender.filter(c => c.renderCount > 50)
      if (highRenderCountComponents.length > 0) {
        advice.push(`⚠️ 发现${highRenderCountComponents.length}个频繁重渲染的组件，建议添加缓存`)
      }
    }
    
    if (advice.length === 0) {
      advice.push('✅ 应用性能表现良好！')
    }
    
    return advice
  }
}

/**
 * Vue组件性能监控Mixin
 */
export const PerformanceMonitorMixin = {
  beforeMount() {
    PerformanceMonitor.getInstance().startComponentMount(this.$options.name || 'Unknown')
  },
  mounted() {
    PerformanceMonitor.getInstance().endComponentMount(this.$options.name || 'Unknown')
  },
  beforeUpdate() {
    PerformanceMonitor.getInstance().startComponentUpdate(this.$options.name || 'Unknown')
  },
  updated() {
    PerformanceMonitor.getInstance().endComponentUpdate(this.$options.name || 'Unknown')
  }
}

/**
 * 性能监控组合式API
 */
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance()
  
  return {
    startComponentMount: monitor.startComponentMount.bind(monitor),
    endComponentMount: monitor.endComponentMount.bind(monitor),
    startComponentUpdate: monitor.startComponentUpdate.bind(monitor),
    endComponentUpdate: monitor.endComponentUpdate.bind(monitor),
    getMetrics: monitor.getMetrics.bind(monitor),
    getPerformanceReport: monitor.getPerformanceReport.bind(monitor),
    logPerformanceReport: monitor.logPerformanceReport.bind(monitor),
    getPerformanceAdvice: monitor.getPerformanceAdvice.bind(monitor)
  }
}