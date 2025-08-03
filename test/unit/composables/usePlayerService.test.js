import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePlayerService } from '@/ui/composables/usePlayerService'
import { ref } from 'vue'

// Mock依赖注入容器
const mockContainer = {
  resolve: vi.fn()
}

const mockPlayerRepository = {
  getPlayer: vi.fn(),
  savePlayer: vi.fn()
}

// Mock inject函数
vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    inject: vi.fn(() => mockContainer)
  }
})

describe('usePlayerService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockContainer.resolve.mockReturnValue(mockPlayerRepository)
  })

  describe('基础功能测试', () => {
    it('应该正确初始化状态', () => {
      const { player, isLoading, error } = usePlayerService()
      
      expect(player.value).toBeNull()
      expect(isLoading.value).toBe(false)
      expect(error.value).toBeNull()
    })

    it('应该提供所有必需的方法', () => {
      const service = usePlayerService()
      
      expect(service).toHaveProperty('loadPlayer')
      expect(service).toHaveProperty('savePlayer')
      expect(service).toHaveProperty('refreshPlayer')
      expect(service).toHaveProperty('depositToBank')
      expect(service).toHaveProperty('withdrawFromBank')
      expect(service).toHaveProperty('takeLoan')
      expect(service).toHaveProperty('repayDebt')
      expect(service).toHaveProperty('clearError')
    })
  })

  describe('玩家数据加载', () => {
    it('成功加载玩家数据', async () => {
      const mockPlayer = {
        id: '1',
        name: '测试玩家',
        money: 1000,
        bankDeposit: 500,
        debt: 200
      }
      
      mockPlayerRepository.getPlayer.mockResolvedValue(mockPlayer)
      
      const { loadPlayer, player, isLoading, error } = usePlayerService()
      
      await loadPlayer()
      
      expect(mockPlayerRepository.getPlayer).toHaveBeenCalled()
      expect(player.value).toEqual(mockPlayer)
      expect(isLoading.value).toBe(false)
      expect(error.value).toBeNull()
    })

    it('处理加载失败的情况', async () => {
      const errorMessage = '加载失败'
      mockPlayerRepository.getPlayer.mockRejectedValue(new Error(errorMessage))
      
      const { loadPlayer, player, isLoading, error } = usePlayerService()
      
      await loadPlayer()
      
      expect(player.value).toBeNull()
      expect(isLoading.value).toBe(false)
      expect(error.value).toBe(errorMessage)
    })
  })

  describe('银行操作测试', () => {
    it('存款操作 - 成功', async () => {
      const { depositToBank, player } = usePlayerService()
      
      // 设置初始玩家数据
      player.value = {
        money: 1000,
        bankDeposit: 500
      }
      
      mockPlayerRepository.savePlayer.mockResolvedValue()
      
      const result = await depositToBank(200)
      
      expect(result).toBe(true)
      expect(player.value.money).toBe(800)
      expect(player.value.bankDeposit).toBe(700)
      expect(mockPlayerRepository.savePlayer).toHaveBeenCalled()
    })

    it('存款操作 - 资金不足', async () => {
      const { depositToBank, player } = usePlayerService()
      
      player.value = {
        money: 100,
        bankDeposit: 500
      }
      
      const result = await depositToBank(200)
      
      expect(result).toBe(false)
      expect(player.value.money).toBe(100) // 金额不变
      expect(mockPlayerRepository.savePlayer).not.toHaveBeenCalled()
    })

    it('取款操作 - 成功', async () => {
      const { withdrawFromBank, player } = usePlayerService()
      
      player.value = {
        money: 1000,
        bankDeposit: 500
      }
      
      mockPlayerRepository.savePlayer.mockResolvedValue()
      
      const result = await withdrawFromBank(200)
      
      expect(result).toBe(true)
      expect(player.value.money).toBe(1200)
      expect(player.value.bankDeposit).toBe(300)
    })

    it('贷款操作 - 成功', async () => {
      const { takeLoan, player } = usePlayerService()
      
      player.value = {
        money: 1000,
        debt: 500,
        availableLoanAmount: 1000
      }
      
      mockPlayerRepository.savePlayer.mockResolvedValue()
      
      const result = await takeLoan(300)
      
      expect(result).toBe(true)
      expect(player.value.money).toBe(1300)
      expect(player.value.debt).toBe(800)
      expect(player.value.availableLoanAmount).toBe(700)
    })

    it('还债操作 - 成功', async () => {
      const { repayDebt, player } = usePlayerService()
      
      player.value = {
        money: 1000,
        debt: 500,
        availableLoanAmount: 500
      }
      
      mockPlayerRepository.savePlayer.mockResolvedValue()
      
      const result = await repayDebt(200)
      
      expect(result).toBe(true)
      expect(player.value.money).toBe(800)
      expect(player.value.debt).toBe(300)
      expect(player.value.availableLoanAmount).toBe(700)
    })
  })

  describe('计算属性测试', () => {
    it('playerMoney应该返回正确的金额', () => {
      const { player, playerMoney } = usePlayerService()
      
      player.value = { money: 1500 }
      expect(playerMoney.value).toBe(1500)
      
      player.value = null
      expect(playerMoney.value).toBe(0)
    })

    it('playerDebt应该返回正确的债务', () => {
      const { player, playerDebt } = usePlayerService()
      
      player.value = { debt: 800 }
      expect(playerDebt.value).toBe(800)
      
      player.value = null
      expect(playerDebt.value).toBe(0)
    })

    it('playerInventory应该返回正确的库存', () => {
      const { player, playerInventory } = usePlayerService()
      
      const mockInventory = [{ id: 1, name: '商品1' }]
      player.value = { inventory: mockInventory }
      expect(playerInventory.value).toEqual(mockInventory)
      
      player.value = null
      expect(playerInventory.value).toEqual([])
    })
  })

  describe('错误处理', () => {
    it('clearError应该清除错误信息', () => {
      const { error, clearError } = usePlayerService()
      
      error.value = '测试错误'
      clearError()
      
      expect(error.value).toBeNull()
    })

    it('无玩家数据时银行操作应该返回false', async () => {
      const { depositToBank, player } = usePlayerService()
      
      // 确保没有玩家数据
      player.value = null
      
      const result = await depositToBank(200)
      
      expect(result).toBe(false)
    })
  })
})