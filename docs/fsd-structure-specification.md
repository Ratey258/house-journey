# Feature-Sliced Design 文件结构规范

## 📋 **概览**

基于2025年Feature-Sliced Design最新标准，为《买房记》项目设计的完整文件结构规范。

**架构模式**: FSD (Feature-Sliced Design) + Clean Architecture内部分层
**支持框架**: Vue 3.5 + TypeScript 5.4+ + Vite 6.0
**设计原则**: 按业务特性分层，单向依赖，高内聚低耦合

---

## 🏗️ **FSD层级结构**

```typescript
src/
├── 📱 app/                       # 应用层 - 应用配置和初始化
├── 📄 pages/                     # 页面层 - 路由页面组件
├── 🧩 widgets/                   # 组件层 - 复合业务组件
├── ⚡ features/                  # 特性层 - 核心业务特性
├── 🎯 entities/                  # 实体层 - 业务实体和数据
├── 🔧 shared/                    # 共享层 - 通用资源和工具
└── 🔄 processes/                 # 流程层 - 复杂业务流程 (可选)
```

---

## 📱 **App层 - 应用配置**

应用级别的配置、Provider和初始化逻辑。

```typescript
src/app/
├── providers/                    # 全局Provider配置
│   ├── DependencyInjectionProvider.vue    # DI容器Provider
│   ├── RouterProvider.vue                 # 路由Provider
│   ├── I18nProvider.vue                   # 国际化Provider
│   ├── ThemeProvider.vue                  # 主题Provider
│   ├── ErrorBoundaryProvider.vue          # 错误边界Provider
│   └── index.ts                           # Provider统一导出
├── router/                       # 路由配置
│   ├── index.ts                           # 主路由配置
│   ├── guards.ts                          # 路由守卫
│   ├── lazy-routes.ts                     # 懒加载路由
│   └── route-types.ts                     # 路由类型定义
├── store/                        # 全局状态
│   ├── index.ts                           # 全局Store配置
│   ├── global-state.ts                    # 全局状态
│   └── store-types.ts                     # Store类型定义
├── config/                       # 应用配置
│   ├── app-config.ts                      # 应用配置
│   ├── performance-config.ts              # 性能配置
│   ├── feature-flags.ts                   # 特性开关
│   └── environment.ts                     # 环境配置
├── di/                          # 依赖注入容器
│   ├── container.ts                       # DI容器实现
│   ├── bindings.ts                        # 依赖绑定配置
│   └── types.ts                           # DI类型定义
└── main.ts                      # 应用入口点
```

---

## 📄 **Pages层 - 路由页面**

应用的主要页面，对应路由组件。

```typescript
src/pages/
├── game/                         # 游戏主页面
│   ├── GameMainPage.vue                   # 游戏主页组件
│   ├── game-page.types.ts                # 页面类型定义
│   └── index.ts                           # 页面导出
├── market/                       # 市场页面
│   ├── MarketPage.vue                     # 市场页面组件
│   ├── MarketAnalysisPage.vue             # 市场分析页面
│   ├── market-page.types.ts               # 页面类型定义
│   └── index.ts                           # 页面导出
├── player/                       # 玩家页面
│   ├── PlayerDashboard.vue                # 玩家仪表板
│   ├── PlayerProfilePage.vue              # 玩家档案页面
│   ├── PlayerStatisticsPage.vue           # 玩家统计页面
│   ├── player-page.types.ts               # 页面类型定义
│   └── index.ts                           # 页面导出
├── settings/                     # 设置页面
│   ├── SettingsPage.vue                   # 设置页面
│   ├── PreferencesPage.vue                # 偏好设置页面
│   ├── settings-page.types.ts             # 页面类型定义
│   └── index.ts                           # 页面导出
├── auth/                         # 认证页面
│   ├── LoginPage.vue                      # 登录页面
│   ├── RegisterPage.vue                   # 注册页面
│   ├── auth-page.types.ts                 # 页面类型定义
│   └── index.ts                           # 页面导出
└── index.ts                      # 所有页面统一导出
```

---

## 🧩 **Widgets层 - 复合组件**

大型复合业务组件，通常跨越多个Feature。

```typescript
src/widgets/
├── game-header/                  # 游戏头部组件
│   ├── ui/
│   │   ├── GameHeader.vue                 # 主组件
│   │   ├── GameStats.vue                  # 游戏统计
│   │   ├── GameMenu.vue                   # 游戏菜单
│   │   └── index.ts                       # UI组件导出
│   ├── model/
│   │   ├── game-header-store.ts           # 组件状态
│   │   ├── types.ts                       # 类型定义
│   │   └── index.ts                       # 模型导出
│   ├── lib/
│   │   ├── header-utils.ts                # 工具函数
│   │   └── index.ts                       # 工具导出
│   └── index.ts                           # Widget统一导出
├── market-panel/                 # 市场面板
│   ├── ui/
│   │   ├── MarketPanel.vue                # 主组件
│   │   ├── MarketOverview.vue             # 市场概览
│   │   ├── PriceTrends.vue                # 价格趋势
│   │   └── index.ts                       # UI组件导出
│   ├── model/
│   │   ├── market-panel-store.ts          # 组件状态
│   │   ├── types.ts                       # 类型定义
│   │   └── index.ts                       # 模型导出
│   └── index.ts                           # Widget统一导出
├── player-dashboard/             # 玩家仪表板
│   ├── ui/
│   │   ├── PlayerDashboard.vue            # 主组件
│   │   ├── PlayerStats.vue                # 玩家统计
│   │   ├── PlayerInventory.vue            # 玩家库存
│   │   └── index.ts                       # UI组件导出
│   ├── model/
│   │   ├── dashboard-store.ts             # 仪表板状态
│   │   ├── types.ts                       # 类型定义
│   │   └── index.ts                       # 模型导出
│   └── index.ts                           # Widget统一导出
├── price-chart/                  # 价格图表组件
│   ├── ui/
│   │   ├── PriceChart.vue                 # 主图表组件
│   │   ├── ChartControls.vue              # 图表控制器
│   │   ├── ChartLegend.vue                # 图表图例
│   │   └── index.ts                       # UI组件导出
│   ├── model/
│   │   ├── chart-store.ts                 # 图表状态
│   │   ├── chart-config.ts                # 图表配置
│   │   ├── types.ts                       # 类型定义
│   │   └── index.ts                       # 模型导出
│   ├── lib/
│   │   ├── chart-utils.ts                 # 图表工具
│   │   ├── data-formatter.ts              # 数据格式化
│   │   └── index.ts                       # 工具导出
│   └── index.ts                           # Widget统一导出
└── index.ts                      # 所有Widget统一导出
```

---

## ⚡ **Features层 - 业务特性**

核心业务特性，每个Feature采用Clean Architecture四层结构。

```typescript
src/features/
├── market-trading/               # 市场交易特性
│   ├── domain/                            # 领域层
│   │   ├── entities/
│   │   │   ├── Trade.ts                   # 交易实体
│   │   │   ├── MarketOrder.ts             # 市场订单实体
│   │   │   └── index.ts                   # 实体导出
│   │   ├── value-objects/
│   │   │   ├── Price.ts                   # 价格值对象
│   │   │   ├── Quantity.ts                # 数量值对象
│   │   │   ├── TradeId.ts                 # 交易ID值对象
│   │   │   └── index.ts                   # 值对象导出
│   │   ├── use-cases/
│   │   │   ├── ExecuteTradeUseCase.ts     # 执行交易用例
│   │   │   ├── CalculateProfitUseCase.ts  # 计算利润用例
│   │   │   ├── ValidateTradeUseCase.ts    # 验证交易用例
│   │   │   └── index.ts                   # 用例导出
│   │   ├── repositories/
│   │   │   ├── ITradingRepository.ts      # 交易仓储接口
│   │   │   └── index.ts                   # 仓储接口导出
│   │   └── index.ts                       # 领域层导出
│   ├── application/                       # 应用层
│   │   ├── services/
│   │   │   ├── TradingApplicationService.ts # 交易应用服务
│   │   │   ├── TradingValidationService.ts  # 交易验证服务
│   │   │   └── index.ts                   # 服务导出
│   │   ├── composables/
│   │   │   ├── useTradingService.ts       # 交易服务组合函数
│   │   │   ├── useMarketData.ts           # 市场数据组合函数
│   │   │   ├── useTradingValidation.ts    # 交易验证组合函数
│   │   │   └── index.ts                   # 组合函数导出
│   │   ├── dto/
│   │   │   ├── TradingDto.ts              # 交易DTO
│   │   │   └── index.ts                   # DTO导出
│   │   └── index.ts                       # 应用层导出
│   ├── infrastructure/                    # 基础设施层
│   │   ├── api/
│   │   │   ├── TradingApiService.ts       # 交易API服务
│   │   │   ├── MarketDataApiService.ts    # 市场数据API服务
│   │   │   └── index.ts                   # API服务导出
│   │   ├── repositories/
│   │   │   ├── TradingRepository.ts       # 交易仓储实现
│   │   │   └── index.ts                   # 仓储实现导出
│   │   ├── mappers/
│   │   │   ├── TradingMapper.ts           # 交易映射器
│   │   │   └── index.ts                   # 映射器导出
│   │   └── index.ts                       # 基础设施层导出
│   ├── presentation/                      # 表现层
│   │   ├── components/
│   │   │   ├── TradingPanel.vue           # 交易面板
│   │   │   ├── OrderForm.vue              # 订单表单
│   │   │   ├── TradeHistory.vue           # 交易历史
│   │   │   ├── TradingChart.vue           # 交易图表
│   │   │   └── index.ts                   # 组件导出
│   │   ├── stores/
│   │   │   ├── trading-store.ts           # 交易状态管理
│   │   │   └── index.ts                   # 状态导出
│   │   ├── types/
│   │   │   ├── component-types.ts         # 组件类型
│   │   │   └── index.ts                   # 类型导出
│   │   └── index.ts                       # 表现层导出
│   ├── model/                             # 模型聚合层
│   │   ├── index.ts                       # 统一导出所有层
│   │   └── types.ts                       # 特性类型定义
│   └── index.ts                           # Feature统一导出
├── player-management/            # 玩家管理特性
│   ├── domain/                            # 领域层
│   │   ├── entities/
│   │   │   ├── Player.ts                  # 玩家实体
│   │   │   ├── PlayerProfile.ts           # 玩家档案
│   │   │   ├── PlayerAchievement.ts       # 玩家成就
│   │   │   └── index.ts                   # 实体导出
│   │   ├── value-objects/
│   │   │   ├── PlayerId.ts                # 玩家ID
│   │   │   ├── PlayerName.ts              # 玩家姓名
│   │   │   ├── PlayerLevel.ts             # 玩家等级
│   │   │   └── index.ts                   # 值对象导出
│   │   ├── use-cases/
│   │   │   ├── CreatePlayerUseCase.ts     # 创建玩家用例
│   │   │   ├── UpdatePlayerUseCase.ts     # 更新玩家用例
│   │   │   ├── CalculateStatsUseCase.ts   # 计算统计用例
│   │   │   └── index.ts                   # 用例导出
│   │   ├── repositories/
│   │   │   ├── IPlayerRepository.ts       # 玩家仓储接口
│   │   │   └── index.ts                   # 仓储接口导出
│   │   └── index.ts                       # 领域层导出
│   └── [类似结构的application/infrastructure/presentation层]
├── price-system/                 # 价格系统特性
│   ├── domain/                            # 领域层
│   │   ├── entities/
│   │   │   ├── PriceHistory.ts            # 价格历史实体
│   │   │   ├── PricePolicy.ts             # 价格策略实体
│   │   │   └── index.ts                   # 实体导出
│   │   ├── value-objects/
│   │   │   ├── Price.ts                   # 价格值对象
│   │   │   ├── PriceRange.ts              # 价格范围
│   │   │   └── index.ts                   # 值对象导出
│   │   ├── use-cases/
│   │   │   ├── CalculatePriceUseCase.ts   # 计算价格用例
│   │   │   ├── UpdatePriceUseCase.ts      # 更新价格用例
│   │   │   └── index.ts                   # 用例导出
│   │   └── index.ts                       # 领域层导出
│   └── [类似结构的application/infrastructure/presentation层]
├── game-events/                  # 游戏事件特性
│   ├── domain/                            # 领域层
│   │   ├── entities/
│   │   │   ├── GameEvent.ts               # 游戏事件实体
│   │   │   ├── EventTrigger.ts            # 事件触发器
│   │   │   └── index.ts                   # 实体导出
│   │   ├── use-cases/
│   │   │   ├── TriggerEventUseCase.ts     # 触发事件用例
│   │   │   ├── ProcessEventUseCase.ts     # 处理事件用例
│   │   │   └── index.ts                   # 用例导出
│   │   └── index.ts                       # 领域层导出
│   └── [类似结构的application/infrastructure/presentation层]
├── authentication/               # 认证特性
│   ├── domain/                            # 领域层
│   │   ├── entities/
│   │   │   ├── User.ts                    # 用户实体
│   │   │   ├── Session.ts                 # 会话实体
│   │   │   └── index.ts                   # 实体导出
│   │   ├── use-cases/
│   │   │   ├── AuthenticateUseCase.ts     # 认证用例
│   │   │   ├── LogoutUseCase.ts           # 登出用例
│   │   │   └── index.ts                   # 用例导出
│   │   └── index.ts                       # 领域层导出
│   └── [类似结构的application/infrastructure/presentation层]
└── index.ts                      # 所有特性统一导出
```

---

## 🎯 **Entities层 - 业务实体**

跨特性的核心业务实体。

```typescript
src/entities/
├── player/                       # 玩家实体
│   ├── model/
│   │   ├── Player.ts                      # 玩家核心实体
│   │   ├── PlayerStatistics.ts            # 玩家统计
│   │   ├── PlayerInventory.ts             # 玩家库存
│   │   ├── PlayerSettings.ts              # 玩家设置
│   │   ├── types.ts                       # 玩家相关类型
│   │   └── index.ts                       # 模型导出
│   ├── api/
│   │   ├── player-api.ts                  # 玩家API
│   │   └── index.ts                       # API导出
│   ├── composables/
│   │   ├── usePlayer.ts                   # 玩家组合函数
│   │   ├── usePlayerStats.ts              # 玩家统计组合函数
│   │   └── index.ts                       # 组合函数导出
│   ├── lib/
│   │   ├── player-utils.ts                # 玩家工具函数
│   │   ├── player-validators.ts           # 玩家验证器
│   │   └── index.ts                       # 工具导出
│   └── index.ts                           # 玩家实体统一导出
├── product/                      # 产品实体
│   ├── model/
│   │   ├── Product.ts                     # 产品核心实体
│   │   ├── ProductCategory.ts             # 产品分类
│   │   ├── ProductAttribute.ts            # 产品属性
│   │   ├── types.ts                       # 产品相关类型
│   │   └── index.ts                       # 模型导出
│   ├── api/
│   │   ├── product-api.ts                 # 产品API
│   │   └── index.ts                       # API导出
│   ├── composables/
│   │   ├── useProduct.ts                  # 产品组合函数
│   │   └── index.ts                       # 组合函数导出
│   └── index.ts                           # 产品实体统一导出
├── house/                        # 房屋实体
│   ├── model/
│   │   ├── House.ts                       # 房屋核心实体
│   │   ├── HouseProperty.ts               # 房屋属性
│   │   ├── types.ts                       # 房屋相关类型
│   │   └── index.ts                       # 模型导出
│   ├── api/
│   │   ├── house-api.ts                   # 房屋API
│   │   └── index.ts                       # API导出
│   ├── composables/
│   │   ├── useHouse.ts                    # 房屋组合函数
│   │   └── index.ts                       # 组合函数导出
│   └── index.ts                           # 房屋实体统一导出
├── market/                       # 市场实体
│   ├── model/
│   │   ├── Market.ts                      # 市场核心实体
│   │   ├── MarketData.ts                  # 市场数据
│   │   ├── MarketCondition.ts             # 市场状况
│   │   ├── types.ts                       # 市场相关类型
│   │   └── index.ts                       # 模型导出
│   ├── api/
│   │   ├── market-api.ts                  # 市场API
│   │   └── index.ts                       # API导出
│   ├── composables/
│   │   ├── useMarket.ts                   # 市场组合函数
│   │   └── index.ts                       # 组合函数导出
│   └── index.ts                           # 市场实体统一导出
└── index.ts                      # 所有实体统一导出
```

---

## 🔧 **Shared层 - 共享资源**

项目中的通用资源、工具和组件。

```typescript
src/shared/
├── ui/                           # UI组件库 (Atomic Design)
│   ├── atoms/                             # 原子组件
│   │   ├── Button/
│   │   │   ├── Button.vue                 # 按钮组件
│   │   │   ├── Button.types.ts            # 按钮类型
│   │   │   ├── Button.stories.ts          # Storybook故事
│   │   │   ├── Button.test.ts             # 单元测试
│   │   │   └── index.ts                   # 按钮导出
│   │   ├── Input/
│   │   │   ├── Input.vue                  # 输入框组件
│   │   │   ├── Input.types.ts             # 输入框类型
│   │   │   ├── Input.stories.ts           # Storybook故事
│   │   │   ├── Input.test.ts              # 单元测试
│   │   │   └── index.ts                   # 输入框导出
│   │   ├── Icon/
│   │   │   ├── Icon.vue                   # 图标组件
│   │   │   ├── Icon.types.ts              # 图标类型
│   │   │   ├── icons/                     # 图标资源
│   │   │   │   ├── arrow.svg
│   │   │   │   ├── user.svg
│   │   │   │   └── index.ts               # 图标索引
│   │   │   └── index.ts                   # 图标导出
│   │   ├── Typography/
│   │   │   ├── Text.vue                   # 文本组件
│   │   │   ├── Heading.vue                # 标题组件
│   │   │   ├── Typography.types.ts        # 排版类型
│   │   │   └── index.ts                   # 排版导出
│   │   └── index.ts                       # 原子组件导出
│   ├── molecules/                         # 分子组件
│   │   ├── SearchBox/
│   │   │   ├── SearchBox.vue              # 搜索框组件
│   │   │   ├── SearchBox.types.ts         # 搜索框类型
│   │   │   ├── SearchBox.test.ts          # 单元测试
│   │   │   └── index.ts                   # 搜索框导出
│   │   ├── FormField/
│   │   │   ├── FormField.vue              # 表单字段组件
│   │   │   ├── FormField.types.ts         # 表单字段类型
│   │   │   └── index.ts                   # 表单字段导出
│   │   ├── Card/
│   │   │   ├── Card.vue                   # 卡片组件
│   │   │   ├── CardHeader.vue             # 卡片头部
│   │   │   ├── CardBody.vue               # 卡片主体
│   │   │   ├── CardFooter.vue             # 卡片底部
│   │   │   ├── Card.types.ts              # 卡片类型
│   │   │   └── index.ts                   # 卡片导出
│   │   ├── Dropdown/
│   │   │   ├── Dropdown.vue               # 下拉菜单组件
│   │   │   ├── DropdownItem.vue           # 下拉菜单项
│   │   │   ├── Dropdown.types.ts          # 下拉菜单类型
│   │   │   └── index.ts                   # 下拉菜单导出
│   │   └── index.ts                       # 分子组件导出
│   ├── organisms/                         # 有机体组件
│   │   ├── DataTable/
│   │   │   ├── DataTable.vue              # 数据表格组件
│   │   │   ├── TableHeader.vue            # 表格头部
│   │   │   ├── TableRow.vue               # 表格行
│   │   │   ├── TableCell.vue              # 表格单元格
│   │   │   ├── TablePagination.vue        # 表格分页
│   │   │   ├── DataTable.types.ts         # 数据表格类型
│   │   │   ├── DataTable.composables.ts   # 数据表格组合函数
│   │   │   └── index.ts                   # 数据表格导出
│   │   ├── Modal/
│   │   │   ├── Modal.vue                  # 模态框组件
│   │   │   ├── ModalHeader.vue            # 模态框头部
│   │   │   ├── ModalBody.vue              # 模态框主体
│   │   │   ├── ModalFooter.vue            # 模态框底部
│   │   │   ├── Modal.types.ts             # 模态框类型
│   │   │   ├── useModal.ts                # 模态框组合函数
│   │   │   └── index.ts                   # 模态框导出
│   │   ├── NavigationBar/
│   │   │   ├── NavigationBar.vue          # 导航栏组件
│   │   │   ├── NavItem.vue                # 导航项
│   │   │   ├── NavDropdown.vue            # 导航下拉菜单
│   │   │   ├── NavigationBar.types.ts     # 导航栏类型
│   │   │   └── index.ts                   # 导航栏导出
│   │   ├── Form/
│   │   │   ├── Form.vue                   # 表单组件
│   │   │   ├── FormGroup.vue              # 表单组
│   │   │   ├── FormActions.vue            # 表单操作
│   │   │   ├── Form.types.ts              # 表单类型
│   │   │   ├── useForm.ts                 # 表单组合函数
│   │   │   └── index.ts                   # 表单导出
│   │   └── index.ts                       # 有机体组件导出
│   ├── templates/                         # 模板组件
│   │   ├── PageLayout/
│   │   │   ├── PageLayout.vue             # 页面布局模板
│   │   │   ├── PageLayout.types.ts        # 页面布局类型
│   │   │   └── index.ts                   # 页面布局导出
│   │   ├── DashboardLayout/
│   │   │   ├── DashboardLayout.vue        # 仪表板布局模板
│   │   │   ├── DashboardLayout.types.ts   # 仪表板布局类型
│   │   │   └── index.ts                   # 仪表板布局导出
│   │   └── index.ts                       # 模板组件导出
│   ├── tokens/                            # 设计令牌
│   │   ├── colors.ts                      # 颜色令牌
│   │   ├── typography.ts                  # 排版令牌
│   │   ├── spacing.ts                     # 间距令牌
│   │   ├── shadows.ts                     # 阴影令牌
│   │   └── index.ts                       # 设计令牌导出
│   └── index.ts                           # UI组件库导出
├── lib/                          # 工具库
│   ├── utils/                             # 通用工具
│   │   ├── common-utils.ts                # 通用工具函数
│   │   ├── date-utils.ts                  # 日期工具
│   │   ├── number-utils.ts                # 数字工具
│   │   ├── string-utils.ts                # 字符串工具
│   │   ├── array-utils.ts                 # 数组工具
│   │   ├── object-utils.ts                # 对象工具
│   │   └── index.ts                       # 工具导出
│   ├── validators/                        # 验证器
│   │   ├── common-validators.ts           # 通用验证器
│   │   ├── email-validator.ts             # 邮箱验证器
│   │   ├── password-validator.ts          # 密码验证器
│   │   ├── number-validator.ts            # 数字验证器
│   │   └── index.ts                       # 验证器导出
│   ├── formatters/                        # 格式化器
│   │   ├── currency-formatter.ts          # 货币格式化器
│   │   ├── date-formatter.ts              # 日期格式化器
│   │   ├── number-formatter.ts            # 数字格式化器
│   │   └── index.ts                       # 格式化器导出
│   ├── constants/                         # 常量
│   │   ├── app-constants.ts               # 应用常量
│   │   ├── api-constants.ts               # API常量
│   │   ├── ui-constants.ts                # UI常量
│   │   └── index.ts                       # 常量导出
│   ├── composables/                       # 通用组合函数
│   │   ├── useLocalStorage.ts             # 本地存储组合函数
│   │   ├── useSessionStorage.ts           # 会话存储组合函数
│   │   ├── useAsync.ts                    # 异步组合函数
│   │   ├── useDebounce.ts                 # 防抖组合函数
│   │   ├── useThrottle.ts                 # 节流组合函数
│   │   ├── useEventListener.ts            # 事件监听器组合函数
│   │   └── index.ts                       # 组合函数导出
│   ├── hooks/                             # 自定义钩子
│   │   ├── useWindowSize.ts               # 窗口大小钩子
│   │   ├── useMediaQuery.ts               # 媒体查询钩子
│   │   ├── useClickOutside.ts             # 点击外部钩子
│   │   ├── useIntersectionObserver.ts     # 交叉观察器钩子
│   │   └── index.ts                       # 钩子导出
│   └── index.ts                           # 工具库导出
├── api/                          # 通用API
│   ├── base-api.ts                        # 基础API类
│   ├── http-client.ts                     # HTTP客户端
│   ├── interceptors.ts                    # 请求拦截器
│   ├── error-handler.ts                   # API错误处理
│   ├── types.ts                           # API类型定义
│   └── index.ts                           # API导出
├── types/                        # 通用类型
│   ├── api.ts                             # API类型
│   ├── common.ts                          # 通用类型
│   ├── entities.ts                        # 实体类型
│   ├── utility-types.ts                   # 工具类型
│   ├── vue-types.ts                       # Vue类型扩展
│   └── index.ts                           # 类型导出
├── config/                       # 配置
│   ├── app-constants.ts                   # 应用常量
│   ├── environment.ts                     # 环境配置
│   ├── feature-flags.ts                   # 特性开关
│   └── index.ts                           # 配置导出
├── styles/                       # 全局样式
│   ├── global.css                         # 全局CSS
│   ├── variables.css                      # CSS变量
│   ├── themes/                            # 主题
│   │   ├── light-theme.css                # 浅色主题
│   │   ├── dark-theme.css                 # 深色主题
│   │   └── index.ts                       # 主题导出
│   └── index.ts                           # 样式导出
└── index.ts                      # 共享层统一导出
```

---

## 🔄 **Processes层 - 业务流程** (可选)

复杂的跨特性业务流程。

```typescript
src/processes/
├── game-flow/                    # 游戏流程
│   ├── model/
│   │   ├── GameFlowState.ts               # 游戏流程状态
│   │   ├── GameFlowMachine.ts             # 游戏流程状态机
│   │   └── index.ts                       # 模型导出
│   ├── lib/
│   │   ├── game-flow-utils.ts             # 游戏流程工具
│   │   └── index.ts                       # 工具导出
│   └── index.ts                           # 游戏流程导出
├── trading-flow/                 # 交易流程
│   ├── model/
│   │   ├── TradingFlowState.ts            # 交易流程状态
│   │   ├── TradingFlowMachine.ts          # 交易流程状态机
│   │   └── index.ts                       # 模型导出
│   ├── lib/
│   │   ├── trading-flow-utils.ts          # 交易流程工具
│   │   └── index.ts                       # 工具导出
│   └── index.ts                           # 交易流程导出
└── index.ts                      # 所有流程统一导出
```

---

## 📋 **依赖关系规则**

### 🔗 **FSD层级依赖规则**

```
App ← Pages ← Widgets ← Features ← Entities ← Shared
     ↖       ↖         ↖          ↖         ↖
       Processes ←——————————————————————————→
```

**允许的依赖关系**：
- `App` 可以依赖所有层
- `Pages` 可以依赖 `Widgets`, `Features`, `Entities`, `Shared`, `Processes`
- `Widgets` 可以依赖 `Features`, `Entities`, `Shared`
- `Features` 可以依赖 `Entities`, `Shared`
- `Entities` 可以依赖 `Shared`
- `Shared` 不能依赖任何其他层
- `Processes` 可以依赖 `Features`, `Entities`, `Shared`

### 🏛️ **Clean Architecture内部依赖规则**

在每个Feature内部：
```
Presentation → Application → Domain ← Infrastructure
```

**依赖规则**：
- `Presentation` 依赖 `Application`
- `Application` 依赖 `Domain`
- `Infrastructure` 依赖 `Domain`
- `Domain` 不依赖任何其他层

---

## 🛠️ **开发工具配置**

### 📦 **package.json脚本**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "lint": "eslint . --ext .vue,.js,.ts --fix",
    "type-check": "vue-tsc --noEmit",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "analyze": "vite-bundle-analyzer"
  }
}
```

### 🔧 **ESLint配置**

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    '@vue/eslint-config-typescript',
    'plugin:fsd/all' // FSD规则插件
  ],
  rules: {
    'fsd/layer-imports': 'error',
    'fsd/public-api': 'error',
    'fsd/no-cross-layer': 'error'
  }
}
```

### 📁 **VS Code配置**

```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "vue.inlayHints.missingProps": true,
  "vue.inlayHints.optionsWrapper": true,
  "eslint.workingDirectories": ["src"],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

---

## 📚 **最佳实践指南**

### ✅ **DO - 推荐做法**

1. **按业务特性组织代码**，而不是按技术类型
2. **每个层都有明确的公共API**，通过index.ts导出
3. **使用TypeScript严格模式**，确保类型安全
4. **遵循FSD依赖规则**，避免循环依赖
5. **使用barrel exports**，简化导入路径
6. **编写单元测试**，确保代码质量
7. **使用Storybook**，文档化UI组件

### ❌ **DON'T - 避免做法**

1. **不要跨层直接依赖**，遵循依赖规则
2. **不要在Shared层引用业务逻辑**
3. **不要在Domain层依赖外部框架**
4. **不要在一个文件中混合多个职责**
5. **不要使用绝对路径导入同层文件**
6. **不要忽略TypeScript类型检查**
7. **不要在组件中直接调用API**

---

**📅 文档版本**: v1.0  
**🎯 更新日期**: 2025年8月3日  
**📊 架构标准**: Feature-Sliced Design + Clean Architecture + Vue 3.5  
**🏆 目标**: 成为2025年Vue.js企业级应用开发的标准模板！