# 基础设施工具

本目录包含项目的基础设施工具，为游戏的各个模块提供通用功能支持。

## 工具列表

### 错误处理 (errorHandler.js)

提供统一的错误处理机制，包括错误捕获、日志记录和恢复功能。

### 错误类型 (errorTypes.js)

定义系统中的各种错误类型和严重程度，用于错误分类和处理。

### 格式化工具 (formatUtils.js)

提供数字、货币、日期等格式化功能，确保UI展示的一致性。

### 状态管理工具

#### 状态日志中间件 (createStateLogger)

用于在开发环境中监控状态变更，便于调试和问题排查。

- 记录action调用和参数
- 记录状态变更前后的差异
- 支持过滤和折叠日志

#### 批量更新工具 (createBatchUpdater)

将多个状态更新合并为一次操作，减少重渲染次数，提高性能。

## 状态管理优化指南

### 1. 状态管理架构优化

我们对状态管理架构进行了以下优化：

#### 1.1 Store拆分

将大型Store拆分为更小、更专注的模块：

- `gameCore` -> `gameCore` + `gameProgress`：分离游戏进度和游戏核心逻辑
- `market` -> `market` + `priceSystem`：分离价格系统和市场管理

这种拆分有以下好处：
- 减少单个Store的复杂度
- 提高代码可维护性
- 减少不必要的组件重渲染
- 更清晰的状态边界

#### 1.2 兼容层优化

优化了`src/stores/index.js`中的兼容层：

- 使用getter/setter代替computed，减少响应式对象开销
- 直接引用方法而非创建包装函数
- 保持API兼容性的同时提高性能

#### 1.3 数据流规范化

- 严格执行单向数据流
- 通过actions修改状态，避免直接修改
- 使用批量更新减少重渲染

### 2. 性能优化工具

#### 2.1 状态日志中间件

用法示例：

```javascript
import { createStateLogger } from '../infrastructure/utils';

// 应用日志中间件
const store = useMyStore();
createStateLogger(store, {
  collapsed: true, // 折叠日志组
  logActions: true, // 记录action调用
  logMutations: true, // 记录状态变更
  actionNameFilter: name => ['importantAction'].includes(name) // 过滤特定action
});
```

#### 2.2 批量更新工具

用法示例：

```javascript
import { createBatchUpdater } from '../infrastructure/utils';

// 创建批量更新工具
const { batchUpdates } = createBatchUpdater();

// 批量执行多个状态更新
function handleMultipleUpdates() {
  batchUpdates(() => {
    store.updateValue1(newValue1);
    store.updateValue2(newValue2);
    store.updateValue3(newValue3);
  });
}
```

### 3. 最佳实践

#### 3.1 Store设计原则

- **单一职责**：每个Store只负责一个领域的状态
- **明确边界**：清晰定义Store之间的依赖关系
- **最小化状态**：避免存储可以从其他状态计算得出的数据
- **使用getters**：对于需要计算的派生状态，使用getters

#### 3.2 性能优化建议

- **选择性订阅**：组件只订阅需要的状态片段
- **避免深层嵌套**：扁平化状态结构，减少响应式开销
- **使用批量更新**：合并短时间内的多次状态更新
- **计算属性缓存**：合理使用计算属性的缓存机制

#### 3.3 调试技巧

- **使用状态日志中间件**：在开发环境监控状态变更
- **Vue Devtools**：利用Vue Devtools的Timeline和Pinia插件
- **性能分析**：使用Chrome Performance面板分析性能瓶颈 