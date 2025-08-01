# 《买房记》- 模拟经营类游戏

![版本](https://img.shields.io/badge/版本-0.1.4-blue)
![平台](https://img.shields.io/badge/平台-Windows-brightgreen)
![开发框架](https://img.shields.io/badge/框架-Vue_3_+_Electron-orange)

《买房记》是一款模拟经营类游戏，玩家通过买卖商品赚取利润，最终目标是购买一套房产。游戏中提供了经典模式（52周时限）和无尽模式两种玩法，拥有丰富的市场机制和随机事件系统。

## 🎮 游戏特色

- **商品交易系统**: 多种商品，不同类别，动态的价格波动机制
- **事件系统**: 多样化随机事件，不同选择将导致不同结果
- **房屋购买**: 从简单的单身公寓到豪华私人庄园，多种等级的房产
- **地点切换**: 多个独特交易地点，每个地点有特色商品和价格差异
- **游戏模式**: 经典模式（52周）和无尽模式可选
- **难度选择**: 简单、标准、困难三种难度
- **自动存档**: 智能的自动存档系统，确保游戏进度不会丢失

## 📥 安装方式

### 环境要求
- **Node.js**: v20.19+ 或 v22.12+ (推荐使用最新LTS版本)
- **npm**: v10.0+ 或使用 pnpm/yarn
- **操作系统**: Windows 10+, macOS 12+, Linux

### 快速开始

#### 1. 克隆项目
```bash
git clone <项目地址>
cd house-journey
```

#### 2. 安装依赖
```bash
# 使用npm (推荐)
npm install

# 或使用pnpm (更快)
pnpm install

# 或使用yarn
yarn install
```

#### 3. 启动开发服务器
```bash
# Web开发模式 (推荐用于开发调试)
npm run dev

# Electron开发模式 (桌面应用开发)
npm run electron:dev
```

#### 4. 构建生产版本
```bash
# 构建Web版本
npm run build

# 构建Electron桌面应用
npm run electron:build
```

### 开发脚本说明
- `npm run dev` - 启动Vite开发服务器 (热更新)
- `npm run build` - 构建生产版本
- `npm run preview` - 预览生产构建
- `npm run electron:dev` - Electron开发模式
- `npm run electron:build` - 打包Electron应用
- `npm run test` - 运行测试套件
- `npm run lint` - 代码检查和格式化

## 🎯 游戏目标

在游戏中，你将扮演一位想要购房的有志青年，初始资金和债务根据选择的难度而变化。你需要：

1. 通过买卖各种商品赚取利润
2. 积累足够资金购买理想的房产
3. 在经典模式中于52周内达成目标，或在无尽模式中不断挑战自我
4. 应对随机事件带来的机遇和挑战
5. 避免破产，保持良好的现金流

## 🕹️ 基本操作

- **切换地点**: 点击地点列表选择要去的地点
- **买卖商品**: 在市场界面选择商品和数量，点击买入/卖出按钮
- **查看背包**: 点击背包标签查看已购买的商品
- **存档/读档**: 通过游戏菜单进行存档和读档操作

## 💡 游戏技巧

- 关注价格趋势，在低价时买入，高价时卖出
- 不同地点有各自的特色商品，价格更优惠
- 保持一定现金流，以应对突发事件
- 谨慎管理债务，避免利息过高
- 留意随机事件中的选择，它们可能带来意外收益

## 🛠️ 开发技术

### 核心技术栈
- **前端框架**: Vue 3.5.18 + Vite 7.0.6
- **桌面应用**: Electron 29.1.0
- **状态管理**: Pinia 3.0.3 (Setup Store)
- **路由管理**: Vue Router 4.5.1
- **UI组件库**: Element Plus 2.10.4
- **实用工具**: @vueuse/core 13.6.0
- **国际化**: Vue i18n 9.8.0
- **类型检查**: TypeScript 5.0+
- **代码规范**: ESLint 9.0 + Prettier 3.0
- **测试框架**: Vitest 3.2.4



## 📝 更新日志

### v0.1.4 (2025.8.1)：Vue 生态系统全面升级与现代化特性集成

#### 核心框架升级
- **Vue升级至3.5.18**：引入最新的Composition API特性和性能优化
  - Reactive Props Destructure稳定版：更简洁的props解构语法
  - useTemplateRef()：新的模板引用API，告别ref命名限制
  - useId()：SSR兼容的唯一ID生成器，完美解决服务端渲染问题
  - 内存使用优化56%：大幅降低应用内存占用
  - 数组操作性能提升10倍：特别优化大型数组处理

#### 状态管理升级
- **Pinia升级至3.0.3**：现代化状态管理解决方案
  - 更强的TypeScript支持：完美的类型推断和智能提示
  - 增强的DevTools体验：更直观的状态调试和时间旅行
  - 性能优化：更快的状态更新和响应机制
  - 与Vue 3.5完美集成：充分利用最新的响应式特性

#### 生态系统完善
- **Vue Router升级至4.5.1**：路由管理能力增强
- **Element Plus升级至2.10.4**：UI组件库全面兼容Vue 3.5
- **@vueuse/core升级至13.6.0**：实用工具集大幅扩展
  - 新增50+实用composables
  - 更好的响应式数据处理
  - 增强的浏览器API集成

#### 开发体验提升
- **类型安全增强**：全链路TypeScript类型检查
- **智能代码提示**：IDE智能感知能力大幅提升  
- **开发调试优化**：更清晰的错误信息和调试体验
- **构建性能提升**：冷启动速度提升30%

#### 现代化特性应用
- **响应式解构**：在组件中使用最新的props解构语法
- **组合式函数重构**：利用最新composables优化代码组织
- **状态管理优化**：采用Pinia 3.0的最佳实践
- **类型定义完善**：所有组件和状态的完整类型支持

### v0.1.3 (2025.8.1)：Vite 7 架构升级与现代化改造

#### 核心构建工具升级
- **Vite升级至7.0.6**：享受最新的构建性能和开发体验
- **Vitest升级至3.2.4**：更好的测试性能和Vite 7兼容性
- **@vitejs/plugin-vue保持6.0.1**：Vue 3完美集成支持

#### 现代化浏览器支持
- **浏览器目标升级**：采用Baseline Widely Available标准
  - Chrome 92 → 107
  - Safari 14 → 16  
  - Edge 88 → 107
  - Firefox 90 → 104
- **更好的性能**：利用现代浏览器特性，减少polyfill负担

#### 开发体验提升
- **更快的构建速度**：Vite 7的性能优化带来更快的构建体验
- **改进的HMR**：热模块替换更加稳定快速
- **Environment API准备**：为未来的SSR扩展做好准备

#### 项目配置优化
- **移除已弃用功能**：清理了所有Vite 7不再支持的配置
- **配置现代化**：使用最新的Vite配置最佳实践
- **构建输出优化**：更好的chunk分割和资源管理

#### Vite 7新特性集成
- **智能代码分割**：按功能模块自动分割代码，优化加载性能
- **资源分类打包**：CSS和图片按类型分目录存放，便于管理
- **依赖预构建优化**：holdUntilCrawlEnd提升冷启动性能
- **JSON处理增强**：启用auto stringify和named exports
- **开发服务器预热**：预加载核心模块，提升开发体验
- **HMR错误覆盖**：更好的错误显示和调试体验
- **CSS代码分割**：启用CSS模块化和开发时sourcemap
- **ESBuild优化**：移除legal comments，减小构建体积

### v0.1.2 (2025.7.31)：项目架构与性能优化

#### 核心依赖升级
- **Vue升级至3.4.21**：提高渲染性能和响应速度
- **Vite升级至5.1.4**：加快开发构建速度，改善热更新体验
- **Electron升级至29.1.0**：更好的安全性和系统适配性

#### 性能优化
- **价格计算系统重构**：大幅提升计算效率，减少CPU占用
- **内存管理优化**：实现LRU缓存策略，有效控制内存使用
- **渲染性能提升**：减少不必要的组件重渲染

#### 安全增强
- **Electron安全配置加强**：实施更严格的CSP策略
- **数据存储加密**：敏感游戏数据现在使用加密存储
- **输入验证加强**：完善输入验证，防止数据注入风险

#### 项目结构改进
- **代码规范统一**：添加ESLint和Prettier配置，保证代码质量
- **构建流程优化**：简化并统一构建脚本，支持多平台
- **项目文件整理**：完善.gitignore配置，避免提交不必要文件

### v0.1.1 (2025.7.30)：完整游戏系统更新

#### 房产系统大幅升级
- **多房产系统**：现在玩家可以购买并持有多套房产
- **房产收藏展示**：游戏结算页面增加了多房产展示区
- **房产图片优化**：修复了房产图片显示问题

#### 银行系统全面上线
- **存取款功能**：玩家可以在银行存款获取利息，或取款应对日常需求
- **贷款系统**：引入贷款功能，玩家可以借入资金扩大投资规模
- **利息计算**：完善的利息计算机制，存款生息、贷款计息
- **银行UI优化**：美观直观的银行界面，操作便捷

#### 游戏结算系统优化
- **得分计算修复**：解决了游戏结束时得分计算错误问题
- **多维度得分**：得分现在基于资产价值、房产数量、交易效率等多个维度
- **结算界面优化**：优化了游戏结束页面的滚动条，提升视觉体验
- **多房产展示**：结算页面可查看玩家拥有的所有房产信息

#### 稳定性与体验提升
- **错误处理增强**：加强了异常情况的处理能力，提高游戏稳定性
- **图片路径修复**：解决了因图片路径问题导致的显示错误
- **UI交互优化**：改善了多处UI细节，提升整体游戏体验
- **性能优化**：优化了游戏运行性能，确保流畅体验

### v0.1.0 (2025.7.28)：房产系统升级

- **添加房产实际图片**：每种房产类型现在都有对应的实际图片展示
- **购房体验优化**：完善了购房动画效果，提升用户体验
- **界面简化**：移除了不必要的确认弹窗，使操作流程更加流畅
- **稳定性提升**：修复了房产展示相关的布局问题和其他bug

### 初始版本：事件系统优化

最新版本对事件系统进行了重要优化，使事件能够更精确地影响游戏经济：

#### 主要改进

1. **地区特定价格影响系统**:
   - 事件现在可以针对特定地区产生价格影响，而不仅仅是全局或商品类别
   - 例如：某个地区发生自然灾害，只影响该地区的价格，而不影响其他地区

2. **地区内特定商品价格修正**:
   - 事件可以同时指定地区和特定商品，使价格影响更加精确
   - 例如：电子科技城的芯片短缺事件只会影响该地区的电子产品价格

3. **事件描述的明确性**:
   - 事件描述中明确说明了影响的具体地区和商品
   - 玩家可以根据事件信息做出更明智的交易决策

### 性能优化建议

#### 1. 开发环境优化
```bash
# 使用更快的包管理器
npm install -g pnpm
pnpm install  # 比npm快2-3倍

# 启用并行构建
export NODE_OPTIONS="--max-old-space-size=8192"
```

#### 2. 生产构建优化
```bash
# 分析构建产物
npm run build -- --analyze

# 启用压缩和优化
npm run build -- --minify
```

#### 3. 调试工具
- **Vue DevTools**: 浏览器扩展，支持Pinia 3.0
- **Vite DevTools**: 内置的开发工具面板
- **TypeScript检查**: `npm run type-check`

### 故障排除

#### 常见问题
1. **依赖安装失败**
   ```bash
   # 清理缓存重新安装
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **TypeScript类型错误**
   ```bash
   # 重新生成类型定义
   npm run type-check
   ```

3. **Electron启动失败**
   ```bash
   # 重新构建Electron依赖
   npm run electron:rebuild
   ```

#### 开发调试
```typescript
// 启用详细日志
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('Debug mode enabled');
}

// 使用Vue DevTools
import { createApp } from 'vue';
const app = createApp(App);

if (DEBUG) {
  app.config.performance = true;
}
```

## 📦 部署指南

### Web版本部署
```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 部署到静态服务器
# dist/ 文件夹包含所有静态资源
```

### Electron应用打包
```bash
# 构建所有平台
npm run electron:build

# 构建特定平台
npm run electron:build -- --win
npm run electron:build -- --mac
npm run electron:build -- --linux
```

### Docker部署 (可选)
```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist
EXPOSE 5173

CMD ["npm", "run", "preview"]
```

## 🤝 贡献指南

### 开发流程
1. **Fork项目** 到你的GitHub账户
2. **创建特性分支** `git checkout -b feature/amazing-feature`
3. **遵循代码规范** 使用ESLint和Prettier
4. **编写测试** 确保新功能有对应测试
5. **提交代码** `git commit -m 'Add amazing feature'`
6. **推送分支** `git push origin feature/amazing-feature`
7. **创建Pull Request**

### 代码规范
```bash
# 代码检查
npm run lint

# 自动修复
npm run lint:fix

# 类型检查
npm run type-check

# 运行测试
npm run test
```

### 提交信息规范
```
feat: 添加新功能
fix: 修复bug
docs: 更新文档
style: 代码格式调整
refactor: 重构代码
test: 添加测试
chore: 构建过程或辅助工具的变动
```

## 🔮 路线图

### v0.1.5 (短期计划)
- [ ] PWA离线支持增强
- [ ] 深色主题UI优化
- [ ] 更多触觉反馈场景
- [ ] 游戏统计Dashboard
- [ ] 性能监控面板

### v0.2.0 (中期计划)
- [ ] Vue 3.6 Vapor Mode支持
- [ ] SSR/SSG静态站点生成
- [ ] 多语言支持扩展
- [ ] 云端存档同步
- [ ] 社交分享功能

### v0.3.0 (长期愿景)
- [ ] 多人游戏模式
- [ ] 实时排行榜
- [ ] 自定义MOD支持
- [ ] 移动端原生应用
- [ ] WebRTC实时对战

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- **Vue.js团队** - 优秀的前端框架
- **Pinia团队** - 现代化状态管理
- **VueUse团队** - 强大的工具集合
- **Vite团队** - 极速构建工具
- **Element Plus团队** - 精美的UI组件库

## 📧 联系方式

- **开发者**: 春卷
- **项目地址**: [GitHub Repository](https://github.com/your-username/house-journey)
- **问题反馈**: [Issues](https://github.com/your-username/house-journey/issues)
- **功能建议**: [Discussions](https://github.com/your-username/house-journey/discussions)

---

## 📊 项目统计

![GitHub stars](https://img.shields.io/github/stars/your-username/house-journey)
![GitHub forks](https://img.shields.io/github/forks/your-username/house-journey)
![GitHub issues](https://img.shields.io/github/issues/your-username/house-journey)
![GitHub license](https://img.shields.io/github/license/your-username/house-journey)

**欢迎Star ⭐ 和Fork 🍴 支持项目发展！**
