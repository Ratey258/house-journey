<template>
  <div class="settings-view">
    <h1>{{ $t('settings.title') }}</h1>
    
    <div class="settings-section">
      <!-- 已有的设置项 -->
      <div class="setting-group">
        <h2>游戏设置</h2>
        
        <div class="setting-item">
          <label for="difficulty">默认难度</label>
          <select id="difficulty" v-model="settings.difficulty" @change="updateSetting('difficulty')">
            <option value="easy">简单</option>
            <option value="standard">标准</option>
            <option value="hard">困难</option>
          </select>
        </div>
        
        <div class="setting-item">
          <label for="autoSaveInterval">自动保存频率</label>
          <select id="autoSaveInterval" v-model="settings.autoSaveInterval" @change="updateSetting('autoSaveInterval')">
            <option :value="0">关闭自动保存</option>
            <option :value="1">每1周（频繁）</option>
            <option :value="2">每2周</option>
            <option :value="5">每5周（推荐）</option>
            <option :value="10">每10周</option>
            <option :value="26">每26周（半年）</option>
          </select>
        </div>
        
        <div class="setting-item description" v-if="settings.autoSaveInterval > 0">
          <div class="setting-description">
            <p>
              当前设置：每{{ settings.autoSaveInterval }}周自动保存一次。自动存档将在周数变化、
              购买房产和退出游戏时触发。自动保存不会显示通知，最多保留5个最近的自动存档。
            </p>
          </div>
        </div>
        
        <div class="setting-item description" v-else>
          <div class="setting-description warning">
            <p>
              <strong>警告：</strong>自动保存已关闭。游戏进度将不会自动保存，
              请记得手动保存游戏以防止进度丢失。
            </p>
          </div>
        </div>
        
        <div class="setting-item">
          <label for="textSpeed">文本显示速度</label>
          <select id="textSpeed" v-model="settings.textSpeed" @change="updateSetting('textSpeed')">
            <option value="slow">慢速</option>
            <option value="normal">中速</option>
            <option value="fast">快速</option>
            <option value="instant">立即显示</option>
          </select>
        </div>
      </div>
      
      <!-- 添加语言设置部分 -->
      <div class="settings-item">
        <label for="language-select">{{ $t('settings.language') }}</label>
        <select 
          id="language-select" 
          v-model="settings.language"
          @change="updateLanguage"
        >
          <option 
            v-for="lang in supportedLanguages" 
            :key="lang.code" 
            :value="lang.code"
          >
            {{ lang.name }}
          </option>
        </select>
      </div>
      
      <!-- 其他设置项 -->
      <div class="setting-group">
        <h2>显示设置</h2>
        
        <div class="setting-item checkbox">
          <input type="checkbox" id="soundEnabled" v-model="settings.soundEnabled" @change="updateSetting('soundEnabled')">
          <label for="soundEnabled">启用音效</label>
        </div>
        
        <div class="setting-item checkbox">
          <input type="checkbox" id="fullScreen" v-model="settings.fullScreen" @change="toggleFullScreen">
          <label for="fullScreen">全屏模式</label>
        </div>
      </div>
    </div>
    
    <div class="settings-actions">
      <button @click="resetSettings" class="btn-secondary">
        {{ $t('settings.reset') }}
      </button>
      <button @click="goBack" class="btn-primary">
        {{ $t('common.back') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSettingsStore } from '../../stores/settingsStore';
import { getSupportedLanguages } from '../../i18n';
import { handleError, ErrorType, ErrorSeverity } from '../../infrastructure/utils/errorHandler';

const router = useRouter();
const settingsStore = useSettingsStore();

// 获取支持的语言列表
const supportedLanguages = getSupportedLanguages();

// 创建本地设置对象
const settings = reactive({
  difficulty: settingsStore.gameSettings.difficulty,
  autoSaveInterval: settingsStore.gameSettings.autoSaveInterval,
  soundEnabled: settingsStore.gameSettings.soundEnabled,
  fullScreen: settingsStore.gameSettings.fullScreen,
  textSpeed: settingsStore.gameSettings.textSpeed,
  language: settingsStore.gameSettings.language
});

// 监听设置变化并更新
const updateSetting = (key, value) => {
  settingsStore.updateSetting(key, value);
};

// 专门处理语言更新
const updateLanguage = async () => {
  try {
    // 更新语言设置
    await settingsStore.updateSetting('language', settings.language);
  } catch (error) {
    handleError(error, 'SettingsView (views)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
    console.error('Failed to update language:', error);
    // 恢复状态
    settings.language = settingsStore.gameSettings.language;
  }
}

// 切换全屏模式
const toggleFullScreen = async () => {
  try {
    const isFullScreen = await window.electronAPI.toggleFullscreen();
    settings.fullScreen = isFullScreen;
    await settingsStore.updateSetting('fullScreen', isFullScreen);
  } catch (error) {
    handleError(error, 'SettingsView (views)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
    console.error('Failed to toggle fullscreen:', error);
    // 恢复状态
    settings.fullScreen = settingsStore.gameSettings.fullScreen;
  }
}

// 重置设置
const resetSettings = async () => {
  await settingsStore.resetSettings();
  
  // 更新本地设置对象
  settings.difficulty = settingsStore.gameSettings.difficulty;
  settings.autoSaveInterval = settingsStore.gameSettings.autoSaveInterval;
  settings.soundEnabled = settingsStore.gameSettings.soundEnabled;
  settings.fullScreen = settingsStore.gameSettings.fullScreen;
  settings.textSpeed = settingsStore.gameSettings.textSpeed;
  settings.language = settingsStore.gameSettings.language;
};

// 返回上一页
const goBack = () => {
  router.back();
};

// 加载设置
onMounted(async () => {
  await settingsStore.loadSettings();
  
  // 更新本地设置对象
  settings.difficulty = settingsStore.gameSettings.difficulty;
  settings.autoSaveInterval = settingsStore.gameSettings.autoSaveInterval;
  settings.soundEnabled = settingsStore.gameSettings.soundEnabled;
  settings.fullScreen = settingsStore.gameSettings.fullScreen;
  settings.textSpeed = settingsStore.gameSettings.textSpeed;
  settings.language = settingsStore.gameSettings.language;
});
</script>

<style scoped>
.settings-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.settings-section {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.settings-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e0e0e0;
}

.settings-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.settings-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

select, input {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
  min-width: 150px;
}

.btn-primary, .btn-secondary {
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  border: none;
}

.btn-primary {
  background-color: #4caf50;
  color: white;
}

.btn-secondary {
  background-color: #f5f5f5;
  border: 1px solid #ccc;
}
</style> 