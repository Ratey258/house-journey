# 工具函数库使用指南

## 概述

本工具函数库提供了《买房记》游戏中常用的工具函数，旨在减少代码重复，提高可维护性。通过集中管理这些函数，我们可以确保在整个应用中使用一致的格式化和处理逻辑。

## 主要工具函数

### 格式化工具 (`formatUtils.js`)

提供各种数据格式化函数：

- `formatNumber(num)`: 格式化数字为千分位显示
- `formatCurrency(amount, currency)`: 格式化货币金额
- `formatPercentChange(percent)`: 格式化百分比变化（带正负号）
- `formatDate(date, format)`: 格式化日期时间
- `getPriceChangeClass(percent)`: 获取价格变化的CSS类名
- `formatGameWeek(week, totalWeeks)`: 格式化游戏周数显示
- `formatGameTime(minutes)`: 格式化游戏时间

### 错误处理工具 (`errorHandler.js`)

提供统一的错误处理机制：

- `handleError(error, context, type, severity)`: 处理错误并记录日志
- `withErrorHandling(asyncFn, context, type, severity)`: 异步错误处理包装器
- `withGameErrorHandling(asyncFn, context)`: 游戏核心错误处理

### 错误类型定义 (`errorTypes.js`)

定义错误类型和严重程度：

- `ErrorType`: 错误类型枚举
- `ErrorSeverity`: 错误严重程度枚举
- `createError(message, type, severity, metadata)`: 创建增强的错误对象

## 使用方法

### 导入工具函数

```javascript
// 导入单个工具函数
import { formatNumber } from '@/infrastructure/utils';

// 导入多个工具函数
import { formatNumber, formatCurrency, formatDate } from '@/infrastructure/utils';
```

### 在组件中使用

```javascript
// 在Vue组件中使用
const formattedPrice = formatCurrency(product.price);
const formattedDate = formatDate(order.date);
```

## 优化建议

1. **统一使用工具函数**：避免在组件中重复实现相同功能的函数
2. **扩展而非重写**：如需特殊格式化逻辑，请扩展现有工具函数而非重写
3. **保持向后兼容**：修改工具函数时确保不破坏现有功能
4. **添加单元测试**：为工具函数编写测试，确保其正确性

## 重构指南

如果您发现代码中仍存在重复实现的格式化函数或工具函数，请按照以下步骤进行重构：

1. 检查 `infrastructure/utils` 中是否已有相同功能的函数
2. 如果已存在，直接使用现有函数替换重复代码
3. 如果不存在但是通用功能，将其添加到相应的工具文件中
4. **更新组件代码，导入并使用新的工具函数**

## 错误处理最佳实践

### 统一错误处理

项目中应统一使用`errorHandler.js`提供的错误处理机制，避免自定义try/catch逻辑。

#### 推荐用法：

1. **使用withErrorHandling包装器**

```javascript
import { withErrorHandling } from '@/infrastructure/utils/errorHandler';

// 推荐：使用withErrorHandling包装异步函数
async function saveUserData() {
  return withErrorHandling(async () => {
    // 业务逻辑
    const result = await apiCall();
    return result;
  }, 'UserDataService', ErrorType.STORAGE);
}
```

2. **游戏核心逻辑错误处理**

```javascript
import { withGameErrorHandling } from '@/infrastructure/utils/errorHandler';

// 游戏核心逻辑应使用withGameErrorHandling
async function processTurn() {
  return withGameErrorHandling(async () => {
    // 游戏逻辑
  }, 'GameLoopService');
}
```

3. **组件级错误捕获**

```javascript
import { handleError, ErrorType } from '@/infrastructure/utils/errorHandler';

try {
  // 复杂操作
} catch (error) {
  handleError(error, '组件名称', ErrorType.COMPONENT);
  // 可以继续提供降级UI或功能
}
```

#### 错误类型和严重程度

根据错误的性质选择合适的错误类型和严重程度：

| 错误类型 | 适用场景 |
|---------|---------|
| VALIDATION | 用户输入验证错误 |
| NETWORK | API请求和网络连接错误 |
| STORAGE | 本地存储和文件操作错误 |
| GAME_LOGIC | 游戏规则和状态错误 |
| SYSTEM | 系统级错误 |
| UNKNOWN | 未分类错误 |

| 严重程度 | 处理方式 |
|---------|---------|
| FATAL | 致命错误，会显示对话框并可能中断游戏 |
| ERROR | 严重错误，显示对话框但尝试继续 |
| WARNING | 警告级别，显示Toast不中断游戏 |
| INFO | 信息级别，仅记录日志 |

#### 避免的做法

1. **不要使用开发文档中过时的错误处理API**
2. **不要使用裸露的try/catch而不调用handleError**
3. **不要忽略异步函数中的错误（总是使用withErrorHandling）**
4. **不要在错误处理后继续执行可能依赖失败操作的代码**

### 错误恢复机制

当发生严重错误时，系统会自动创建游戏状态快照并尝试恢复：

1. **状态快照**: 定期自动保存的游戏状态
2. **紧急快照**: 在检测到可能的错误前自动创建
3. **恢复对话框**: 当检测到异常退出时显示恢复选项

## 注意事项

- 工具函数应保持纯函数特性，不依赖外部状态
- 确保函数有适当的参数验证和默认值
- 添加清晰的JSDoc注释，说明函数用途、参数和返回值 