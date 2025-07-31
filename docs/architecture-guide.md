# 《买房记》项目架构改进指南

## 1. 架构概览

《买房记》项目采用三层架构模式，将应用划分为以下三层：

```
UI层 (Presentation)
  │
  ▼
应用层 (Application)
  │
  ▼
领域层 (Domain/Core)
  │
  ▼
基础设施层 (Infrastructure)
```

## 2. 层次职责明确化

### 2.1 UI层 (src/ui)

**职责**：
- 处理用户界面渲染和交互
- 调用应用层服务执行业务操作
- 展示数据和状态

**组成部分**：
- Vue组件
- 视图模型（View Models）
- UI状态管理（部分Pinia store）
- 路由配置

**注意事项**：
- UI层不应直接与领域层或基础设施层通信
- 应通过应用层服务获取数据
- 界面组件应专注于渲染和用户交互，不包含业务逻辑

### 2.2 应用层 (src/application)

**职责**：
- 协调业务流程
- 调用领域服务执行业务规则
- 转换领域对象为视图模型
- 处理事务和操作结果

**组成部分**：
- 应用服务（Application Services）
- 命令处理器（Command Handlers）
- 数据传输对象（DTOs）
- 事件处理器

**注意事项**：
- 应用层是UI层与领域层之间的桥梁
- 不应包含复杂业务规则，而是协调领域层的服务和实体
- 负责事务边界和业务流程的编排

### 2.3 领域层 (src/core)

**职责**：
- 实现核心业务规则和逻辑
- 定义领域模型和实体
- 提供领域服务

**组成部分**：
- 实体（Entities）
- 值对象（Value Objects）
- 聚合（Aggregates）
- 领域服务（Domain Services）
- 领域事件（Domain Events）

**注意事项**：
- 领域层应独立于技术实现细节
- 领域模型应反映业务概念和规则
- 领域层不应依赖于应用层或基础设施层

### 2.4 基础设施层 (src/infrastructure)

**职责**：
- 提供技术实现细节
- 实现数据持久化
- 提供与外部系统的集成
- 提供跨层次的通用功能

**组成部分**：
- 仓储实现（Repository Implementations）
- 数据访问对象（DAOs）
- 外部服务适配器
- 日志、错误处理、安全等基础功能

**注意事项**：
- 基础设施层应为其他层提供技术支持
- 通过依赖倒置原则与领域层交互
- 实现领域层定义的仓储接口

## 3. 依赖管理和注入

### 3.1 依赖流向

依赖应该总是从外层流向内层：

```
UI层 → 应用层 → 领域层 ← 基础设施层
```

### 3.2 依赖注入容器改进

目前的依赖注入容器功能较为基础，建议改进：

1. **增加生命周期管理**：支持单例、瞬态等不同生命周期
2. **支持接口注册**：通过接口注册实现，增强可测试性
3. **自动依赖解析**：减少手动依赖配置
4. **异步服务支持**：处理需要异步初始化的服务

### 3.3 依赖注册规范

```javascript
// 示例：改进的依赖注册方式
container.register('IPlayerRepository', PlayerRepository).asSingleton();
container.register('IProductService', ProductService).withDependencies(['IPlayerRepository']);
```

## 4. 仓储模式标准化

### 4.1 仓储接口规范

每个仓储应遵循统一的接口模式：

```javascript
// 示例：仓储接口
export interface IRepository<T, TId> {
  getById(id: TId): Promise<T>;
  getAll(): Promise<T[]>;
  save(entity: T): Promise<void>;
  delete(id: TId): Promise<boolean>;
}
```

### 4.2 仓储职责

- 仓储应关注数据的持久化和检索
- 不应包含业务逻辑
- 应返回领域实体或集合，而非数据传输对象
- 应处理数据映射（ORM）但不暴露底层存储细节

### 4.3 查询规范

- 简单查询直接包含在仓储方法中
- 复杂查询使用规范化的查询对象
- 考虑引入Repository+Specification模式

## 5. 状态管理优化

### 5.1 Store职责划分

Pinia stores应按照功能和领域概念划分：

- **UI状态Store**：管理UI相关状态（模态框、主题等）
- **领域Store**：映射领域概念（玩家、市场、产品等）
- **应用Store**：管理应用生命周期和全局状态

### 5.2 Store之间的依赖减少

- 避免stores之间的直接引用
- 使用事件总线或消息机制进行通信
- 采用组合式API，减少状态共享

### 5.3 状态持久化规范

- 明确定义哪些状态需要持久化
- 使用专门的状态快照服务处理持久化
- 考虑状态迁移和版本控制

## 6. 错误处理机制

### 6.1 错误分层处理

- **领域层**：使用领域异常表达业务规则违反
- **应用层**：处理和转换异常，不泄露领域异常到UI层
- **基础设施层**：捕获和记录技术异常

### 6.2 错误处理简化

当前的errorHandler.js过于复杂，建议简化为：

1. **领域错误**：表达业务规则违反（如资金不足、库存不足）
2. **应用错误**：表达应用流程问题（如操作未授权、流程中断）
3. **技术错误**：表达技术问题（如网络错误、存储失败）

## 7. 已实现的架构改进

项目已经实现了多项架构改进，提供了更清晰的分层结构和可维护性：

### 7.1 接口定义和规范

已创建以下接口定义文件：

- **领域接口**：`src/core/interfaces/repositories.js` 和 `src/core/interfaces/services.js`
- **应用层接口**：`src/application/interfaces/services.js`
- **基础设施接口**：`src/infrastructure/interfaces/services.js`

#### 使用示例

```javascript
// 导入接口
import { IPlayerRepository } from '../../core/interfaces/repositories';

// 实现接口
class PlayerRepositoryImpl extends IPlayerRepository {
  // 实现方法
}
```

### 7.2 增强版依赖注入容器

已实现增强版DI容器，支持生命周期管理、异步服务和接口注册：

- **容器实现**：`src/infrastructure/di/enhanced-container.js`
- **容器配置**：`src/infrastructure/di/container-setup.js`

#### 使用示例

```javascript
// 注册服务
container.register('IStorageService', storageService).asSingleton();

// 注册带依赖的工厂
container.registerFactory('IMarketService', (container) => {
  return new MarketService(
    container.resolve('IPlayerRepository'),
    container.resolve('IProductRepository'),
    container.resolve('IMarketRepository'),
    container.resolve('IEventEmitter')
  );
}).asSingleton();

// 使用装饰器定义依赖
@Inject(['IPlayerRepository', 'IProductRepository'])
class EnhancedService {
  constructor(playerRepository, productRepository) {
    // ...
  }
}
```

### 7.3 标准化仓储模式

已实现标准化的仓储基类和实例：

- **仓储基类**：`src/infrastructure/persistence/base-repository.js`
- **玩家仓储实现**：`src/infrastructure/persistence/player-repository-enhanced.js`
- **仓储工厂**：`src/infrastructure/persistence/repository-factory.js`

#### 使用示例

```javascript
// 创建仓储子类
class ProductRepositoryEnhanced extends BaseRepository {
  constructor(storageService) {
    super(storageService, 'products');
  }
  
  getEntityId(entity) {
    return entity.id;
  }
  
  mapToEntity(dto) {
    // DTO到实体的转换
    return { ...dto };
  }
  
  mapToDTO(entity) {
    // 实体到DTO的转换
    return { ...entity };
  }
}

// 通过工厂获取仓储
const playerRepo = repositoryFactory.getPlayerRepository();
await playerRepo.initialize();
```

### 7.4 事件驱动的状态管理

已实现事件总线和事件驱动的状态管理：

- **事件总线**：`src/infrastructure/state/event-bus.js`
- **市场状态**：`src/stores/market/market-store-enhanced.js`
- **玩家状态**：`src/stores/player/player-store-enhanced.js`

#### 使用示例

```javascript
// 注册事件监听
const cleanup = eventBus.on('PLAYER_MONEY_CHANGED', (amount) => {
  updateUI(amount);
});

// 发布事件
eventBus.emit('TRADE_COMPLETED', { 
  productId, 
  quantity, 
  price 
});

// 在组件销毁时清理
onUnmounted(() => {
  cleanup();
});
```

## 8. 后续实现路线图

虽然已完成了主要的架构改进，但以下方面还可以进一步优化：

### 8.1 领域事件系统完善

1. 定义领域事件接口和基类
2. 实现领域事件发布和订阅机制
3. 与应用事件的集成

### 8.2 错误处理系统重构

1. 简化错误处理器
2. 实现分层错误模型
3. 标准化错误处理模式

### 8.3 命令和查询分离(CQRS)

1. 引入命令模式处理写操作
2. 实现查询对象处理复杂读操作
3. 优化数据流向

## 9. 实施建议

### 9.1 渐进式过渡策略

针对现有代码的迁移，建议采取以下渐进式策略：

1. **并行维护新旧结构**：新代码使用新架构，旧代码保持原有结构
2. **功能模块迁移**：按功能模块逐步迁移，如先迁移市场系统，再迁移玩家系统
3. **适配层模式**：创建适配层连接新旧代码，减少破坏性变更
4. **测试覆盖保障**：为迁移的代码添加测试，确保功能一致性

### 9.2 具体迁移步骤

1. 首先迁移仓储层实现，使用新的BaseRepository
2. 其次迁移应用服务，引入接口定义
3. 更新UI组件以使用新的服务接口
4. 最后迁移状态管理，引入事件驱动模型

### 9.3 注意事项

- 避免过度工程化，保持架构与项目规模匹配
- 渐进式重构，确保每个步骤都不破坏现有功能
- 保持核心业务逻辑的清晰和可测试
- 优先重构高价值、高风险的组件
- 注重文档维护，确保团队理解新架构

## 10. 应用场景示例

以下是《买房记》游戏中几个主要功能的架构实现示例：

### 10.1 交易商品流程

```
UI层: TradePanel.vue
   ↓ 调用应用服务
应用层: MarketService.tradeProduct()
   ↓ 协调业务流程
领域层: 处理交易、价格计算
   ↓ 使用仓储接口
基础设施层: PlayerRepository, MarketRepository
```

具体代码示例：

```javascript
// UI层调用
async function handleTrade() {
  try {
    const result = await marketService.tradeProduct(productId, quantity, isBuying);
    if (result.success) {
      showToast('交易成功');
    } else {
      showError(result.message);
    }
  } catch (error) {
    handleError(error);
  }
}

// 应用层服务实现
async tradeProduct(productId, quantity, isBuying) {
  return withErrorHandling(async () => {
    // 获取数据
    const player = await this.playerRepository.getPlayer();
    const product = await this.productRepository.getProductById(productId);
    const currentPrice = await this.marketRepository.getCurrentPrice(productId);
    
    // 执行业务逻辑
    if (isBuying) {
      // 购买逻辑
      // ...
    } else {
      // 销售逻辑
      // ...
    }
    
    // 保存状态
    await this.playerRepository.savePlayer(player);
    
    // 发布领域事件
    this.eventEmitter.emit('TRADE_COMPLETED', { /*...*/ });
    
    return { success: true };
  });
}
```

### 10.2 价格更新流程

```
事件触发: 周期变更
   ↓ 发布事件
事件总线: eventBus.emit('WEEK_CHANGED')
   ↓ 监听器响应
应用层: MarketService.updatePrices()
   ↓ 调用领域服务
领域层: PriceSystem.batchUpdatePrices()
   ↓ 更新存储
基础设施层: MarketRepository.updatePrices()
   ↓ 通知UI更新
事件总线: eventBus.emit('PRICES_UPDATED')
```

## 11. 常见问题解答

### 11.1 架构迁移相关

**Q: 需要一次性完成所有架构改进吗？**  
A: 不需要。建议渐进式迁移，可以按功能模块逐步实施，保持系统稳定性。

**Q: 如何处理旧代码与新架构的兼容性？**  
A: 可以创建适配层，或使用装饰器模式包装旧的实现，使其符合新的接口规范。

**Q: 改进架构会影响游戏性能吗？**  
A: 短期可能有轻微影响，但长期来看，通过缓存优化和更合理的职责划分，性能会得到提升。

### 11.2 技术实现相关

**Q: 为什么不使用TypeScript实现接口和类型检查？**  
A: 当前项目基于JavaScript，但未来可以考虑引入TypeScript增强类型安全性。可以先使用JSDoc提供类型提示。

**Q: 如何处理状态管理与UI框架的集成？**  
A: Pinia store应作为应用服务的消费者，通过依赖注入获取服务实例，再将结果同步到响应式状态。

**Q: 单元测试如何适应新架构？**  
A: 新架构更利于测试，可以使用依赖注入容器轻松模拟依赖，建议从领域层和应用层服务开始编写单元测试。

## 12. 参考资源

- **DDD (领域驱动设计) 模式**：https://martinfowler.com/tags/domain%20driven%20design.html
- **洋葱架构 (Onion Architecture)**：https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/
- **干净架构 (Clean Architecture)**：https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
- **SOLID设计原则**：https://en.wikipedia.org/wiki/SOLID
- **事件驱动架构**：https://martinfowler.com/articles/201701-event-driven.html
