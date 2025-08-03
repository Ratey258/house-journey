import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useServices } from '@/ui/composables/useServices'

// Mock依赖注入容器
const mockContainer = {
  resolve: vi.fn()
}

const mockServices = {
  market: { name: 'MarketService' },
  player: { name: 'PlayerService' },
  gameCore: { name: 'GameCoreService' },
  event: { name: 'EventService' }
}

// Mock inject函数
vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    inject: vi.fn(() => mockContainer)
  }
})

describe('useServices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // 设置mock容器的resolve方法
    mockContainer.resolve.mockImplementation((serviceName) => {
      switch (serviceName) {
        case 'marketService':
          return mockServices.market
        case 'playerService':
          return mockServices.player
        case 'gameCoreService':
          return mockServices.gameCore
        case 'eventService':
          return mockServices.event
        default:
          return null
      }
    })
  })

  describe('基础功能测试', () => {
    it('应该提供所有核心服务', () => {
      const services = useServices()
      
      expect(services).toHaveProperty('market')
      expect(services).toHaveProperty('player')
      expect(services).toHaveProperty('gameCore')
      expect(services).toHaveProperty('event')
    })

    it('应该正确解析服务实例', () => {
      const services = useServices()
      
      expect(services.market).toBe(mockServices.market)
      expect(services.player).toBe(mockServices.player)
      expect(services.gameCore).toBe(mockServices.gameCore)
      expect(services.event).toBe(mockServices.event)
    })

    it('应该从DI容器正确解析服务', () => {
      useServices()
      
      expect(mockContainer.resolve).toHaveBeenCalledWith('marketService')
      expect(mockContainer.resolve).toHaveBeenCalledWith('playerService')
      expect(mockContainer.resolve).toHaveBeenCalledWith('gameCoreService')
      expect(mockContainer.resolve).toHaveBeenCalledWith('eventService')
    })
  })

  describe('错误处理', () => {
    it('当DI容器不可用时应该处理优雅', async () => {
      // Mock inject返回null模拟容器不可用
      const { inject } = await import('vue')
      inject.mockReturnValueOnce(null)
      
      const services = useServices()
      
      expect(services.market).toBeNull()
      expect(services.player).toBeNull()
      expect(services.gameCore).toBeNull()
      expect(services.event).toBeNull()
    })

    it('当服务解析失败时应该返回null', () => {
      mockContainer.resolve.mockReturnValue(null)
      
      const services = useServices()
      
      expect(services.market).toBeNull()
      expect(services.player).toBeNull()
      expect(services.gameCore).toBeNull()
      expect(services.event).toBeNull()
    })

    it('当容器解析抛出异常时应该处理', () => {
      mockContainer.resolve.mockImplementation(() => {
        throw new Error('Service resolution failed')
      })
      
      // 应该不抛出异常
      expect(() => useServices()).not.toThrow()
      
      const services = useServices()
      expect(services.market).toBeNull()
    })
  })

  describe('服务单例测试', () => {
    it('多次调用useServices应该返回相同的服务实例', () => {
      const services1 = useServices()
      const services2 = useServices()
      
      expect(services1.market).toBe(services2.market)
      expect(services1.player).toBe(services2.player)
      expect(services1.gameCore).toBe(services2.gameCore)
      expect(services1.event).toBe(services2.event)
    })

    it('应该缓存解析结果避免重复调用容器', () => {
      useServices()
      useServices()
      
      // DI容器的resolve方法应该只被调用一次
      expect(mockContainer.resolve).toHaveBeenCalledTimes(4)
    })
  })

  describe('类型安全测试', () => {
    it('服务应该具有正确的类型推断', () => {
      const services = useServices()
      
      // 这些检查确保TypeScript类型推断正确工作
      expect(typeof services.market).toBe('object')
      expect(typeof services.player).toBe('object')
      expect(typeof services.gameCore).toBe('object')
      expect(typeof services.event).toBe('object')
    })
  })

  describe('依赖注入集成测试', () => {
    it('应该正确集成依赖注入容器', () => {
      const services = useServices()
      
      // 验证所有服务都通过DI容器正确解析
      expect(mockContainer.resolve).toHaveBeenCalledWith('marketService')
      expect(mockContainer.resolve).toHaveBeenCalledWith('playerService')
      expect(mockContainer.resolve).toHaveBeenCalledWith('gameCoreService')
      expect(mockContainer.resolve).toHaveBeenCalledWith('eventService')
      
      // 验证返回的是正确的服务实例
      expect(services.market.name).toBe('MarketService')
      expect(services.player.name).toBe('PlayerService')
      expect(services.gameCore.name).toBe('GameCoreService')
      expect(services.event.name).toBe('EventService')
    })
  })
})