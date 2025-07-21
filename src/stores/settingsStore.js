import { defineStore } from 'pinia';
import { handleError, ErrorType, ErrorSeverity } from '@/infrastructure/utils/errorHandler';

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    // 游戏设置
    difficulty: 'normal', // easy, normal, hard
    tutorialEnabled: true,
    autoSave: true,
    autoSaveInterval: 5, // 分钟
    
    // 音频设置
    soundEnabled: true,
    soundVolume: 0.7, // 0-1
    musicEnabled: true,
    musicVolume: 0.5, // 0-1
    
    // UI设置
    language: 'zh-CN',
    theme: 'light', // light, dark
    uiScale: 1.0, // 0.8-1.2
    animationsEnabled: true,
    
    // 性能设置
    graphicsQuality: 'medium', // low, medium, high
    
    // 当前场景（用于背景音乐）
    currentScene: 'menu' // menu, game
  }),
  
  actions: {
    // 更新单个设置
    updateSetting(key, value) {
      if (key in this.$state) {
        this[key] = value;
        this.saveSettings();
      }
    },
    
    // 更新多个设置
    updateSettings(settings) {
      Object.entries(settings).forEach(([key, value]) => {
        if (key in this.$state) {
          this[key] = value;
        }
      });
      this.saveSettings();
    },
    
    // 重置所有设置为默认值
    resetSettings() {
      this.$reset();
      this.saveSettings();
    },
    
    // 保存设置到本地存储
    saveSettings() {
      try {
        const settingsData = JSON.stringify(this.$state);
        localStorage.setItem('house-journey-settings', settingsData);
      } catch (error) {
        handleError(error, 'SettingsStore', ErrorType.STORAGE, ErrorSeverity.WARNING);
        console.error('保存设置失败:', error);
      }
    },
    
    // 从本地存储加载设置
    loadSettings() {
      try {
        const settingsData = localStorage.getItem('house-journey-settings');
        if (settingsData) {
          const settings = JSON.parse(settingsData);
          this.updateSettings(settings);
        }
      } catch (error) {
        handleError(error, 'SettingsStore', ErrorType.STORAGE, ErrorSeverity.WARNING);
        console.error('加载设置失败:', error);
      }
    },
    
    // 设置当前场景并更新背景音乐
    setCurrentScene(scene) {
      this.currentScene = scene;
      
      // 如果有全局音频管理器，播放对应场景的背景音乐
      if (window.gameAudio && this.musicEnabled) {
        window.gameAudio.playBGM(scene);
      }
    }
  }
}); 