import { defineStore } from 'pinia';
import { ref, computed, readonly, type Ref } from 'vue';
import { handleError, ErrorType, ErrorSeverity } from '@/infrastructure/utils/errorHandler';

// Settings interfaces
export interface GameSettings {
  difficulty: 'easy' | 'normal' | 'hard';
  tutorialEnabled: boolean;
  autoSave: boolean;
  autoSaveInterval: number; // 分钟
}

export interface AudioSettings {
  soundEnabled: boolean;
  soundVolume: number; // 0-1
  musicEnabled: boolean;
  musicVolume: number; // 0-1
}

export interface UISettings {
  language: string;
  theme: 'light' | 'dark';
  uiScale: number; // 0.8-1.2
  animationsEnabled: boolean;
}

export interface PerformanceSettings {
  graphicsQuality: 'low' | 'medium' | 'high';
}

export interface Settings extends GameSettings, AudioSettings, UISettings, PerformanceSettings {
  currentScene: 'menu' | 'game';
}

// Default settings
const defaultSettings: Settings = {
  // 游戏设置
  difficulty: 'normal',
  tutorialEnabled: true,
  autoSave: true,
  autoSaveInterval: 5,
  
  // 音频设置
  soundEnabled: true,
  soundVolume: 0.7,
  musicEnabled: true,
  musicVolume: 0.5,
  
  // UI设置
  language: 'zh-CN',
  theme: 'light',
  uiScale: 1.0,
  animationsEnabled: true,
  
  // 性能设置
  graphicsQuality: 'medium',
  
  // 当前场景
  currentScene: 'menu'
};

// Global audio interface (for window.gameAudio)
interface GameAudio {
  playBGM(scene: string): void;
}

declare global {
  interface Window {
    gameAudio?: GameAudio;
  }
}

export const useSettingsStore = defineStore('settings', () => {
  // State - 使用reactive refs
  const difficulty: Ref<Settings['difficulty']> = ref(defaultSettings.difficulty);
  const tutorialEnabled = ref(defaultSettings.tutorialEnabled);
  const autoSave = ref(defaultSettings.autoSave);
  const autoSaveInterval = ref(defaultSettings.autoSaveInterval);
  
  const soundEnabled = ref(defaultSettings.soundEnabled);
  const soundVolume = ref(defaultSettings.soundVolume);
  const musicEnabled = ref(defaultSettings.musicEnabled);
  const musicVolume = ref(defaultSettings.musicVolume);
  
  const language = ref(defaultSettings.language);
  const theme: Ref<Settings['theme']> = ref(defaultSettings.theme);
  const uiScale = ref(defaultSettings.uiScale);
  const animationsEnabled = ref(defaultSettings.animationsEnabled);
  
  const graphicsQuality: Ref<Settings['graphicsQuality']> = ref(defaultSettings.graphicsQuality);
  const currentScene: Ref<Settings['currentScene']> = ref(defaultSettings.currentScene);

  // Computed - 获取当前所有设置
  const allSettings = computed((): Settings => ({
    difficulty: difficulty.value,
    tutorialEnabled: tutorialEnabled.value,
    autoSave: autoSave.value,
    autoSaveInterval: autoSaveInterval.value,
    soundEnabled: soundEnabled.value,
    soundVolume: soundVolume.value,
    musicEnabled: musicEnabled.value,
    musicVolume: musicVolume.value,
    language: language.value,
    theme: theme.value,
    uiScale: uiScale.value,
    animationsEnabled: animationsEnabled.value,
    graphicsQuality: graphicsQuality.value,
    currentScene: currentScene.value
  }));

  // Actions
  
  /**
   * 更新单个设置
   */
  function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
    switch (key) {
      case 'difficulty':
        difficulty.value = value as Settings['difficulty'];
        break;
      case 'tutorialEnabled':
        tutorialEnabled.value = value as boolean;
        break;
      case 'autoSave':
        autoSave.value = value as boolean;
        break;
      case 'autoSaveInterval':
        autoSaveInterval.value = value as number;
        break;
      case 'soundEnabled':
        soundEnabled.value = value as boolean;
        break;
      case 'soundVolume':
        soundVolume.value = value as number;
        break;
      case 'musicEnabled':
        musicEnabled.value = value as boolean;
        break;
      case 'musicVolume':
        musicVolume.value = value as number;
        break;
      case 'language':
        language.value = value as string;
        break;
      case 'theme':
        theme.value = value as Settings['theme'];
        break;
      case 'uiScale':
        uiScale.value = value as number;
        break;
      case 'animationsEnabled':
        animationsEnabled.value = value as boolean;
        break;
      case 'graphicsQuality':
        graphicsQuality.value = value as Settings['graphicsQuality'];
        break;
      case 'currentScene':
        currentScene.value = value as Settings['currentScene'];
        break;
    }
    saveSettings();
  }

  /**
   * 更新多个设置
   */
  function updateSettings(settings: Partial<Settings>): void {
    Object.entries(settings).forEach(([key, value]) => {
      updateSetting(key as keyof Settings, value as any);
    });
  }

  /**
   * 重置所有设置为默认值
   */
  function resetSettings(): void {
    difficulty.value = defaultSettings.difficulty;
    tutorialEnabled.value = defaultSettings.tutorialEnabled;
    autoSave.value = defaultSettings.autoSave;
    autoSaveInterval.value = defaultSettings.autoSaveInterval;
    soundEnabled.value = defaultSettings.soundEnabled;
    soundVolume.value = defaultSettings.soundVolume;
    musicEnabled.value = defaultSettings.musicEnabled;
    musicVolume.value = defaultSettings.musicVolume;
    language.value = defaultSettings.language;
    theme.value = defaultSettings.theme;
    uiScale.value = defaultSettings.uiScale;
    animationsEnabled.value = defaultSettings.animationsEnabled;
    graphicsQuality.value = defaultSettings.graphicsQuality;
    currentScene.value = defaultSettings.currentScene;
    
    saveSettings();
  }

  /**
   * 保存设置到本地存储
   */
  function saveSettings(): void {
    try {
      const settingsData = JSON.stringify(allSettings.value);
      localStorage.setItem('house-journey-settings', settingsData);
    } catch (error) {
      handleError(
        error instanceof Error ? error : new Error('Unknown error'),
        'SettingsStore.saveSettings',
        ErrorType.STORAGE,
        ErrorSeverity.WARNING
      );
    }
  }

  /**
   * 从本地存储加载设置
   */
  function loadSettings(): void {
    try {
      const settingsData = localStorage.getItem('house-journey-settings');
      if (settingsData) {
        const settings: Partial<Settings> = JSON.parse(settingsData);
        updateSettings(settings);
      }
    } catch (error) {
      handleError(
        error instanceof Error ? error : new Error('Unknown error'),
        'SettingsStore.loadSettings',
        ErrorType.STORAGE,
        ErrorSeverity.WARNING
      );
    }
  }

  /**
   * 设置当前场景并更新背景音乐
   */
  function setCurrentScene(scene: Settings['currentScene']): void {
    currentScene.value = scene;
    
    // 如果有全局音频管理器，播放对应场景的背景音乐
    if (window.gameAudio && musicEnabled.value) {
      window.gameAudio.playBGM(scene);
    }
  }

  return {
    // State
    difficulty: readonly(difficulty),
    tutorialEnabled: readonly(tutorialEnabled),
    autoSave: readonly(autoSave),
    autoSaveInterval: readonly(autoSaveInterval),
    soundEnabled: readonly(soundEnabled),
    soundVolume: readonly(soundVolume),
    musicEnabled: readonly(musicEnabled),
    musicVolume: readonly(musicVolume),
    language: readonly(language),
    theme: readonly(theme),
    uiScale: readonly(uiScale),
    animationsEnabled: readonly(animationsEnabled),
    graphicsQuality: readonly(graphicsQuality),
    currentScene: readonly(currentScene),
    allSettings: readonly(allSettings),

    // Actions
    updateSetting,
    updateSettings,
    resetSettings,
    saveSettings,
    loadSettings,
    setCurrentScene
  };
});

export type SettingsStore = ReturnType<typeof useSettingsStore>;