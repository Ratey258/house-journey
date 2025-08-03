import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMarketService } from '@/ui/composables/useMarketService'

// Mock依赖注入容器
const mockContainer = {
  resolve: vi.fn()
}

const mockMarketService = {
  buyProduct: vi.fn(),
  sellProduct: vi.fn()
}

// Mock inject函数
vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    inject: vi.fn(() => mockContainer)
  }
})

describe('useMarketService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockContainer.resolve.mockReturnValue(mockMarketService)
  })

  describe('基础功能测试', () => {
    it('应该正确初始化状态', () => {
      const { isLoading, error } = useMarketService()
      
      expect(isLoading.value).toBe(false)
      expect(error.value).toBeNull()
    })

    it('应该提供所有必需的方法', () => {
      const service = useMarketService()
      
      expect(service).toHaveProperty('buyProduct')
      expect(service).toHaveProperty('sellProduct')
      expect(service).toHaveProperty('isLoading')
      expect(service).toHaveProperty('error')
      expect(service).toHaveProperty('clearError')
    })
  })

  describe('购买商品测试', () => {
    it('成功购买商品', async () => {
      const mockResult = {
        success: true,
        data: {
          productId: 'product1',
          quantity: 5,
          totalCost: 1000
        }
      }
      
      mockMarketService.buyProduct.mockResolvedValue(mockResult)
      
      const { buyProduct, isLoading, error } = useMarketService()
      
      const result = await buyProduct('product1', 5)
      
      expect(mockMarketService.buyProduct).toHaveBeenCalledWith('product1', 5)
      expect(result).toEqual(mockResult)
      expect(isLoading.value).toBe(false)
      expect(error.value).toBeNull()
    })

    it('购买商品失败', async () => {
      const errorMessage = '资金不足'
      mockMarketService.buyProduct.mockRejectedValue(new Error(errorMessage))
      
      const { buyProduct, isLoading, error } = useMarketService()
      
      const result = await buyProduct('product1', 5)
      
      expect(result).toEqual({
        success: false,
        error: errorMessage
      })
      expect(isLoading.value).toBe(false)
      expect(error.value).toBe(errorMessage)
    })

    it('购买过程中loading状态应该正确变化', async () => {
      let loadingStates = []
      
      // 模拟异步操作
      mockMarketService.buyProduct.mockImplementation(async () => {
        // 延迟执行，模拟网络请求
        await new Promise(resolve => setTimeout(resolve, 10))
        return { success: true }
      })
      
      const { buyProduct, isLoading } = useMarketService()
      
      // 监听loading状态变化
      const watchLoading = () => {
        loadingStates.push(isLoading.value)
      }
      
      watchLoading() // 初始状态
      const promise = buyProduct('product1', 1)
      watchLoading() // 开始loading
      await promise
      watchLoading() // 结束loading
      
      expect(loadingStates).toEqual([false, true, false])
    })
  })

  describe('出售商品测试', () => {
    it('成功出售商品', async () => {
      const mockResult = {
        success: true,
        data: {
          productId: 'product1',
          quantity: 3,
          totalRevenue: 600
        }
      }
      
      mockMarketService.sellProduct.mockResolvedValue(mockResult)
      
      const { sellProduct } = useMarketService()
      
      const result = await sellProduct('product1', 3)
      
      expect(mockMarketService.sellProduct).toHaveBeenCalledWith('product1', 3)
      expect(result).toEqual(mockResult)
    })

    it('出售商品失败', async () => {
      const errorMessage = '库存不足'
      mockMarketService.sellProduct.mockRejectedValue(new Error(errorMessage))
      
      const { sellProduct, error } = useMarketService()
      
      const result = await sellProduct('product1', 10)
      
      expect(result).toEqual({
        success: false,
        error: errorMessage
      })
      expect(error.value).toBe(errorMessage)
    })
  })

  describe('错误处理', () => {
    it('clearError应该清除错误信息', () => {
      const { error, clearError } = useMarketService()
      
      error.value = '测试错误'
      clearError()
      
      expect(error.value).toBeNull()
    })

    it('多次操作的错误应该互相独立', async () => {
      mockMarketService.buyProduct.mockRejectedValue(new Error('购买错误'))
      mockMarketService.sellProduct.mockResolvedValue({ success: true })
      
      const { buyProduct, sellProduct, error } = useMarketService()
      
      // 第一次操作失败
      await buyProduct('product1', 1)
      expect(error.value).toBe('购买错误')
      
      // 第二次操作成功，应该清除错误
      await sellProduct('product2', 1)
      expect(error.value).toBeNull()
    })
  })

  describe('并发操作测试', () => {
    it('并发操作应该正确处理loading状态', async () => {
      // 模拟两个异步操作
      mockMarketService.buyProduct.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 50))
      )
      mockMarketService.sellProduct.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 30))
      )
      
      const { buyProduct, sellProduct, isLoading } = useMarketService()
      
      expect(isLoading.value).toBe(false)
      
      // 同时启动两个操作
      const buyPromise = buyProduct('product1', 1)
      const sellPromise = sellProduct('product2', 1)
      
      expect(isLoading.value).toBe(true)
      
      // 等待所有操作完成
      await Promise.all([buyPromise, sellPromise])
      
      expect(isLoading.value).toBe(false)
    })
  })
})