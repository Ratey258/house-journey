# Vite 6 升级指南

## 已完成的升级

1. 升级核心包版本：
   - `vite` 从 `~5.1.4` 升级到 `^6.5.0`
   - `@vitejs/plugin-vue` 从 `~5.0.4` 升级到 `^6.0.0`
   - `vitest` 从 `~1.2.1` 升级到 `^2.0.0`

2. 更新配置文件
   - 在 `vite.config.js` 中添加明确的浏览器目标：`build.target: ['chrome92', 'safari14', 'edge88', 'firefox90']`

## Node.js 兼容性

项目当前使用 Node.js v22.17.0，满足 Vite 6 要求的 18.0+ 版本。

## 重要变更说明

### 浏览器兼容性目标

Vite 6 的默认浏览器目标是 `modules`，支持原生 ES 模块的浏览器，通常包括：

- Chrome 87+
- Edge 88+
- Firefox 78+
- Safari 14+

我们已经在配置中明确指定了目标浏览器，以确保更好的兼容性。

### 移除的功能

1. Sass 旧版 API 支持已移除，只支持现代 API
2. `splitVendorChunkPlugin` 已移除 (在 v5.2.7 中被弃用)
3. `transformIndexHtml` 的钩子级别 `enforce` / `transform` 已移除 (在 v4.0.0 中被弃用)

### 其它改变

1. `optimizeDeps.entries` 现在总是接收 glob 模式，而不是字面量路径
2. 某些中间件现在会在 `configureServer` / `configurePreviewServer` 钩子之前应用

## 需要注意的潜在问题

1. **CSS 预处理器**：如果项目使用 Sass，请确保您没有使用旧版 API。

2. **依赖项优化**：如果您使用了 `optimizeDeps.entries`，请确保它们已更改为 glob 模式。

3. **HTML 转换插件**：如果您有自定义插件使用 `transformIndexHtml`，请确保使用 `order` 代替 `enforce`，以及 `handler` 代替 `transform`。

4. **SSR 配置**：如果项目使用服务器端渲染，可能需要检查 SSR 相关配置是否与 Vite 7 兼容。

## 下一步操作

1. 安装更新的依赖：
   ```bash
   npm install
   ```

2. 测试开发服务器：
   ```bash
   npm run dev
   ```

3. 测试构建:
   ```bash
   npm run build
   ```

4. 如果您使用 Vitest 进行测试，请确保测试能够通过：
   ```bash
   npm run test
   ```

5. 如果出现任何问题，请查阅 [Vite 官方迁移指南](https://vite.dev/guide/migration)
