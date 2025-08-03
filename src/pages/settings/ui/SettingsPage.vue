<!--
  设置页面
  游戏设置和偏好配置页面
-->
<template>
  <div class="settings-page">
    <!-- 页面头部 -->
    <header class="page-header">
      <div class="header-content">
        <button @click="backToGame" class="back-button">
          ← 返回游戏
        </button>
        
        <div class="page-title">
          <h1>游戏设置</h1>
          <p>自定义游戏体验和偏好设置</p>
        </div>

        <div class="header-actions">
          <button 
            @click="saveSettings" 
            :disabled="state.isSaving"
            class="save-button"
          >
            {{ state.isSaving ? '保存中...' : '保存设置' }}
          </button>
          
          <button @click="resetToDefaults" class="reset-button">
            恢复默认
          </button>
        </div>
      </div>
    </header>

    <!-- 页面内容 -->
    <main class="page-content">
      <!-- 设置类别导航 -->
      <nav class="category-nav">
        <button
          v-for="category in categories"
          :key="category.id"
          :class="['category-item', { active: state.activeCategory === category.id }]"
          @click="setActiveCategory(category.id)"
        >
          <span class="category-icon">{{ category.icon }}</span>
          <div class="category-info">
            <span class="category-name">{{ category.name }}</span>
            <span class="category-desc">{{ category.description }}</span>
          </div>
        </button>
      </nav>

      <!-- 设置内容区域 -->
      <div class="settings-content">
        <!-- 游戏设置 -->
        <div v-if="state.activeCategory === 'game'" class="settings-panel">
          <h2>游戏设置</h2>
          
          <div class="setting-group">
            <div class="setting-item">
              <label class="setting-label">
                自动保存
                <input 
                  type="checkbox" 
                  v-model="gameSettings.autoSave"
                  class="setting-checkbox"
                />
              </label>
              <p class="setting-desc">自动保存游戏进度</p>
            </div>

            <div class="setting-item">
              <label class="setting-label">
                保存间隔 (分钟)
                <input 
                  type="number" 
                  v-model.number="gameSettings.saveInterval"
                  :min="1"
                  :max="60"
                  class="setting-input"
                />
              </label>
              <p class="setting-desc">自动保存的时间间隔</p>
            </div>

            <div class="setting-item">
              <label class="setting-label">
                显示新手教程
                <input 
                  type="checkbox" 
                  v-model="gameSettings.showTutorial"
                  class="setting-checkbox"
                />
              </label>
              <p class="setting-desc">为新玩家显示游戏指导</p>
            </div>

            <div class="setting-item">
              <label class="setting-label">
                危险操作确认
                <input 
                  type="checkbox" 
                  v-model="gameSettings.confirmDangerousActions"
                  class="setting-checkbox"
                />
              </label>
              <p class="setting-desc">在执行重要操作前询问确认</p>
            </div>

            <div class="setting-item">
              <label class="setting-label">
                快速交易模式
                <input 
                  type="checkbox" 
                  v-model="gameSettings.quickTradeMode"
                  class="setting-checkbox"
                />
              </label>
              <p class="setting-desc">简化交易确认流程</p>
            </div>
          </div>
        </div>

        <!-- 显示设置 -->
        <div v-else-if="state.activeCategory === 'display'" class="settings-panel">
          <h2>显示设置</h2>
          
          <div class="setting-group">
            <div class="setting-item">
              <label class="setting-label">
                主题
                <select v-model="displaySettings.theme" class="setting-select">
                  <option value="auto">跟随系统</option>
                  <option value="light">浅色</option>
                  <option value="dark">深色</option>
                </select>
              </label>
              <p class="setting-desc">选择界面主题风格</p>
            </div>

            <div class="setting-item">
              <label class="setting-label">
                语言
                <select v-model="displaySettings.language" class="setting-select">
                  <option value="zh-CN">简体中文</option>
                  <option value="zh-TW">繁体中文</option>
                  <option value="en-US">English</option>
                </select>
              </label>
              <p class="setting-desc">界面显示语言</p>
            </div>

            <div class="setting-item">
              <label class="setting-label">
                显示动画
                <input 
                  type="checkbox" 
                  v-model="displaySettings.showAnimations"
                  class="setting-checkbox"
                />
              </label>
              <p class="setting-desc">启用界面过渡动画</p>
            </div>

            <div class="setting-item">
              <label class="setting-label">
                显示工具提示
                <input 
                  type="checkbox" 
                  v-model="displaySettings.showTooltips"
                  class="setting-checkbox"
                />
              </label>
              <p class="setting-desc">鼠标悬停时显示帮助信息</p>
            </div>

            <div class="setting-item">
              <label class="setting-label">
                紧凑模式
                <input 
                  type="checkbox" 
                  v-model="displaySettings.compactMode"
                  class="setting-checkbox"
                />
              </label>
              <p class="setting-desc">使用更紧凑的界面布局</p>
            </div>
          </div>
        </div>

        <!-- 音频设置 -->
        <div v-else-if="state.activeCategory === 'audio'" class="settings-panel">
          <h2>音频设置</h2>
          
          <div class="setting-group">
            <div class="setting-item">
              <label class="setting-label">
                启用音效
                <input 
                  type="checkbox" 
                  v-model="audioSettings.soundEnabled"
                  class="setting-checkbox"
                />
              </label>
              <p class="setting-desc">播放游戏音效</p>
            </div>

            <div class="setting-item">
              <label class="setting-label">
                启用音乐
                <input 
                  type="checkbox" 
                  v-model="audioSettings.musicEnabled"
                  class="setting-checkbox"
                />
              </label>
              <p class="setting-desc">播放背景音乐</p>
            </div>

            <div class="setting-item">
              <label class="setting-label">
                音效音量: {{ audioSettings.soundVolume }}%
                <input 
                  type="range" 
                  v-model.number="audioSettings.soundVolume"
                  :min="0"
                  :max="100"
                  class="setting-range"
                />
              </label>
              <p class="setting-desc">调整音效音量大小</p>
            </div>

            <div class="setting-item">
              <label class="setting-label">
                音乐音量: {{ audioSettings.musicVolume }}%
                <input 
                  type="range" 
                  v-model.number="audioSettings.musicVolume"
                  :min="0"
                  :max="100"
                  class="setting-range"
                />
              </label>
              <p class="setting-desc">调整背景音乐音量大小</p>
            </div>

            <div class="setting-item">
              <label class="setting-label">
                点击音效
                <input 
                  type="checkbox" 
                  v-model="audioSettings.clickSounds"
                  class="setting-checkbox"
                />
              </label>
              <p class="setting-desc">按钮点击时播放音效</p>
            </div>
          </div>
        </div>

        <!-- 高级设置 -->
        <div v-else-if="state.activeCategory === 'advanced'" class="settings-panel">
          <h2>高级设置</h2>
          
          <div class="setting-group">
            <div class="setting-item">
              <label class="setting-label">
                开发者模式
                <input 
                  type="checkbox" 
                  v-model="advancedSettings.developerMode"
                  class="setting-checkbox"
                />
              </label>
              <p class="setting-desc">显示开发者工具和调试信息</p>
            </div>

            <div class="setting-item">
              <label class="setting-label">
                调试模式
                <input 
                  type="checkbox" 
                  v-model="advancedSettings.debugMode"
                  class="setting-checkbox"
                />
              </label>
              <p class="setting-desc">在控制台输出详细调试信息</p>
            </div>

            <div class="setting-item">
              <label class="setting-label">
                性能模式
                <input 
                  type="checkbox" 
                  v-model="advancedSettings.performanceMode"
                  class="setting-checkbox"
                />
              </label>
              <p class="setting-desc">优化性能，可能影响视觉效果</p>
            </div>

            <div class="setting-item">
              <label class="setting-label">
                实验性功能
                <input 
                  type="checkbox" 
                  v-model="advancedSettings.experimentalFeatures"
                  class="setting-checkbox"
                />
              </label>
              <p class="setting-desc">启用可能不稳定的新功能</p>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 错误信息 -->
    <div v-if="state.error" class="error-message">
      <span class="error-icon">⚠️</span>
      <span>{{ state.error }}</span>
      <button @click="state.error = null" class="close-error">✕</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useSettingsPage } from '../model/useSettingsPage';

// 页面逻辑
const {
  state,
  gameSettings,
  displaySettings,
  audioSettings,
  advancedSettings,
  categories,
  setActiveCategory,
  saveSettings,
  resetToDefaults,
  backToGame
} = useSettingsPage();

// 监听页面标题变化
watch(() => '《买房记》- 游戏设置', (newTitle) => {
  document.title = newTitle;
}, { immediate: true });

// 页面元信息
defineOptions({
  name: 'SettingsPage'
});
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-primary);
}

/* 页面头部 */
.page-header {
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1400px;
  margin: 0 auto;
}

.back-button {
  padding: 0.5rem 1rem;
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.back-button:hover {
  background: var(--color-bg-hover);
}

.page-title h1 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 1.5rem;
}

.page-title p {
  margin: 0.25rem 0 0 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.save-button {
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.save-button:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.save-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.reset-button {
  padding: 0.5rem 1rem;
  background: var(--color-warning);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.reset-button:hover {
  background: var(--color-warning-dark);
}

/* 页面内容 */
.page-content {
  flex: 1;
  display: grid;
  grid-template-columns: 300px 1fr;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

/* 类别导航 */
.category-nav {
  background: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border);
  padding: 2rem 0;
  display: flex;
  flex-direction: column;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 2rem;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.category-item:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.category-item.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-right: 3px solid var(--color-primary);
}

.category-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.category-info {
  display: flex;
  flex-direction: column;
}

.category-name {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.category-desc {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

/* 设置内容 */
.settings-content {
  padding: 2rem;
  overflow-y: auto;
}

.settings-panel {
  background: var(--color-bg-secondary);
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.settings-panel h2 {
  margin: 0 0 2rem 0;
  color: var(--color-text-primary);
  font-size: 1.3rem;
  border-bottom: 2px solid var(--color-primary);
  padding-bottom: 0.5rem;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.setting-item {
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 1rem;
}

.setting-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.setting-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

.setting-desc {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

/* 设置控件 */
.setting-checkbox {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
}

.setting-input,
.setting-select {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  width: 120px;
}

.setting-range {
  width: 200px;
  accent-color: var(--color-primary);
}

/* 错误信息 */
.error-message {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--color-error-light);
  color: var(--color-error-dark);
  border-radius: 6px;
  border: 1px solid var(--color-error);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.close-error {
  margin-left: auto;
  background: none;
  border: none;
  color: var(--color-error-dark);
  cursor: pointer;
  font-size: 1.2rem;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .page-content {
    grid-template-columns: 250px 1fr;
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .header-actions {
    justify-content: center;
  }

  .page-content {
    grid-template-columns: 1fr;
  }
  
  .category-nav {
    flex-direction: row;
    padding: 1rem;
    overflow-x: auto;
  }
  
  .category-item {
    flex-shrink: 0;
    flex-direction: column;
    padding: 1rem;
    border-radius: 6px;
    border-right: none;
    min-width: 120px;
    text-align: center;
  }
  
  .category-item.active {
    background: var(--color-primary);
    color: white;
    border-right: none;
  }

  .category-icon {
    font-size: 2rem;
  }

  .category-desc {
    display: none;
  }
}
</style>