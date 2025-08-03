# Service Layer 迁移指南

## 📋 概述

本指南展示如何将现有组件从直接访问 Store 迁移到使用 Service Composables，以实现更好的架构一致性和可维护性。

## 🎯 迁移目标

### 当前架构问题
```vue
<!-- ❌ 不推荐：直接访问 Store -->
<script setup>
import { useGameStore } from '@/stores';

const gameStore = useGameStore();
const player = computed(() => gameStore.player);

// 直接调用 Store 方法
const buyProduct = async (productId) => {
  await gameStore.buyProduct(productId, 1);
};
</script>
```

### 目标架构
```vue
<!-- ✅ 推荐：使用 Service Composables -->
<script setup>
import { useMarketService, usePlayerService } from '@/ui/composables';

const { buyProduct } = useMarketService();
const { player, playerMoney } = usePlayerService();

// 使用类型安全的服务方法
const handleBuyProduct = async (productId: string) => {
  const result = await buyProduct(productId, 1);
  if (!result.success) {
    console.error(result.message);
  }
};
</script>
```

## 🔄 迁移步骤

### 步骤 1: 识别直接 Store 访问

查找以下模式的代码：
- `useGameStore()`
- `usePlayerStore()`
- `useMarketStore()`
- 直接调用 Store 的 actions

### 步骤 2: 引入 Service Composables

```typescript
// 替换 Store 导入
// ❌ 旧方式
import { useGameStore } from '@/stores';

// ✅ 新方式
import { 
  useMarketService, 
  usePlayerService, 
  useEventEmitter 
} from '@/ui/composables';
```

### 步骤 3: 重构组件逻辑

```vue
<script setup lang="ts">
// ✅ 使用多个专门的 Service Composables
const {
  buyProduct,
  sellProduct,
  isLoading: isMarketLoading,
  error: marketError
} = useMarketService();

const {
  player,
  playerMoney,
  playerInventory,
  loadPlayer
} = usePlayerService();

const {
  on: addEventListener,
  emit: emitEvent
} = useEventEmitter();

// 业务逻辑变得更清晰
const handlePurchase = async (productId: string, quantity: number) => {
  try {
    const result = await buyProduct(productId, quantity);
    
    if (result.success) {
      await loadPlayer(); // 刷新玩家数据
      emitEvent('PURCHASE_SUCCESS', { productId, quantity });
    } else {
      // 处理业务错误
      console.error('购买失败:', result.message);
    }
  } catch (error) {
    // 处理系统错误
    console.error('系统错误:', error);
  }
};
</script>
```

## 🏗️ Service Composables 设计原则

### 1. 单一职责原则
每个 Composable 只负责一个业务领域：

```typescript
// ✅ 好的设计：职责分明
useMarketService()    // 只处理市场相关业务
usePlayerService()    // 只处理玩家相关业务
useEventEmitter()     // 只处理事件通信
```

### 2. 依赖注入集成
通过 DI 容器获取服务实例：

```typescript
export function useMarketService() {
  // 通过依赖注入获取服务
  const container = inject<DIContainer>('diContainer');
  const marketService = container.resolve<MarketService>('marketService');
  
  // 包装服务方法，提供更好的 Vue 集成
  const buyProduct = async (productId: string, quantity: number) => {
    return await marketService.tradeProduct(productId, quantity, true);
  };
  
  return { buyProduct };
}
```

### 3. 错误处理统一化
每个 Composable 提供统一的错误处理：

```typescript
export function useMarketService() {
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  
  const buyProduct = async (productId: string, quantity: number) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      const result = await marketService.tradeProduct(productId, quantity, true);
      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '操作失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };
  
  return {
    buyProduct,
    isLoading: readonly(isLoading),
    error: readonly(error),
    clearError: () => { error.value = null; }
  };
}
```

## 📊 迁移优先级

### 高优先级组件
1. **Market.vue** - 市场交易核心组件
2. **PlayerInfo.vue** - 玩家信息显示
3. **Inventory.vue** - 库存管理
4. **HouseMarket.vue** - 房产交易

### 中优先级组件
1. **GameHeader.vue** - 游戏头部信息
2. **GameSidebar.vue** - 游戏侧边栏
3. **BankModal.vue** - 银行操作模态框

### 低优先级组件
1. 纯展示组件
2. 工具类组件
3. 静态配置组件

## 🧪 测试策略

### Service Composables 测试
```typescript
// useMarketService.test.ts
import { useMarketService } from '@/ui/composables/useMarketService';

describe('useMarketService', () => {
  it('should handle product purchase correctly', async () => {
    const { buyProduct } = useMarketService();
    const result = await buyProduct('product-1', 2);
    
    expect(result.success).toBe(true);
  });
  
  it('should handle errors gracefully', async () => {
    const { buyProduct, error } = useMarketService();
    
    // 模拟错误场景
    await buyProduct('invalid-product', 1);
    
    expect(error.value).toBeTruthy();
  });
});
```

### 组件集成测试
```typescript
// EnhancedMarket.test.ts
import { mount } from '@vue/test-utils';
import EnhancedMarket from '@/ui/components/examples/EnhancedMarket.vue';

describe('EnhancedMarket', () => {
  it('should use service composables correctly', async () => {
    const wrapper = mount(EnhancedMarket, {
      global: {
        provide: {
          diContainer: mockDIContainer
        }
      }
    });
    
    // 测试组件通过 Service Composables 正确工作
    expect(wrapper.vm).toBeDefined();
  });
});
```

## 🚀 实施计划

### 第一阶段：准备工作（已完成）
- [x] 创建 Service Composables
- [x] 更新 DI 容器配置
- [x] 编写迁移指南

### 第二阶段：示例组件
- [x] 创建 EnhancedPlayerInfo 示例
- [x] 创建 EnhancedMarket 示例
- [ ] 创建更多示例组件

### 第三阶段：核心组件迁移（已完成 ✅）
- [x] 迁移 Market.vue
- [x] 迁移 PlayerInfo.vue
- [x] 迁移 Inventory.vue
- [x] 迁移 HouseMarket.vue

### 第四阶段：全面推广（已完成 ✅）
- [x] 迁移所有高优先级业务组件
- [x] 迁移中优先级组件（GameView.vue、BankModal.vue）
- [x] 扩展Service Composables功能（银行操作）
- [x] 创建完整单元测试框架
- [x] 实现企业级性能优化体系
- [x] 更新项目文档

## 📈 收益评估

### 短期收益
1. **更好的错误处理**：统一的错误处理机制
2. **类型安全**：完整的 TypeScript 支持
3. **代码复用**：Service 逻辑可在多个组件间共享

### 长期收益
1. **可测试性**：更容易进行单元测试
2. **可维护性**：清晰的业务逻辑分离
3. **可扩展性**：新功能更容易添加
4. **架构一致性**：统一的数据访问模式

## 🔧 工具和辅助

### 代码检查规则
创建 ESLint 规则检查直接 Store 访问：

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'no-direct-store-access': {
      'warn',
      'Direct store access detected. Consider using Service Composables instead.'
    }
  }
};
```

### 迁移辅助脚本
```bash
# 查找直接使用 Store 的组件
grep -r "useGameStore\|usePlayerStore\|useMarketStore" src/ui/components/

# 统计迁移进度
find src/ui/components -name "*.vue" | wc -l  # 总组件数
grep -l "useMarketService\|usePlayerService" src/ui/components/**/*.vue | wc -l  # 已迁移数量
```

## ✅ 验收标准

### 组件级别
- [ ] 不再直接导入和使用 Store
- [ ] 使用 Service Composables 获取数据
- [ ] 实现适当的错误处理
- [ ] 保持原有功能完整性

### 架构级别
- [ ] 所有业务组件使用 Service 层
- [ ] Store 只用于状态管理，不包含业务逻辑
- [ ] Service 层成为唯一的业务逻辑入口

### 质量级别
- [ ] 代码覆盖率 > 80%
- [ ] TypeScript 类型覆盖率 > 95%
- [ ] 无直接 Store 访问的 ESLint 警告

---

**注意**：迁移过程中要保持向后兼容性，确保现有功能不受影响。建议逐步迁移，每完成一个组件就进行充分测试。