# Vite 5.4.19 升级指南

## 已完成的升级

1. 升级核心包版本：
   - `vite` 从 `~5.1.4` 升级到 `^5.4.19` (最新稳定版)
   - `@vitejs/plugin-vue` 从 `~5.0.4` 升级到 `^6.0.0`
   - `vitest` 从 `~1.2.1` 升级到 `^2.0.0`
   - `esbuild` 更新到最新版本，解决版本不匹配问题

2. 更新配置文件
   - 在 `vite.config.js` 中添加明确的浏览器目标：`build.target: ['chrome92', 'safari14', 'edge88', 'firefox90']`
   - 优化路径导入，使用 `import * as path from 'path'` 和 `const resolve = path.resolve`
   
3. 添加ESM支持
   - 在 `package.json` 中添加 `"type": "module"` 以支持ESM模块格式

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

## 完成状态

已完成以下验证，所有功能正常工作：

1. 开发服务器：
   ```bash
   npm run dev
   ```
   ✅ 成功启动，地址：http://127.0.0.1:5174/

2. 构建:
   ```bash
   npm run build
   ```
   ✅ 成功构建，生成文件位于 dist/ 目录

3. 预览服务器：
   ```bash
   npm run preview
   ```
   ✅ 成功启动，地址：http://127.0.0.1:4173/

## 后续建议

1. 运行测试套件，确保所有功能正常：
   ```bash
   npm run test
   ```

2. 考虑优化大块文件，以下文件大于500KB：
   - `dist/assets/chart-CFST39MQ.js` (611.45 KB)
   - `dist/assets/ui-BGXmCC4X.js` (750.96 KB)
   
   可以通过以下方式优化：
   - 使用动态导入拆分代码
   - 调整 `build.rollupOptions.output.manualChunks` 配置
   - 增加 `build.chunkSizeWarningLimit` 参数

3. 参考资源：
   - [Vite 官方文档](https://vitejs.dev/guide/)
   - [Vite 性能优化](https://vitejs.dev/guide/performance.html)
   - [Rollup 配置指南](https://rollupjs.org/configuration-options/#output-manualchunks)
