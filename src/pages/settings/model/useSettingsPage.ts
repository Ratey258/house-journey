/**
 * 设置页面组合函数
 */

import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { 
  SettingsPageState, 
  GameSettings, 
  DisplaySettings, 
  AudioSettings, 
  AdvancedSettings 
} from './types';

export function useSettingsPage() {
  const router = useRouter();

  // 页面状态
  const state = ref<SettingsPageState>({
    activeCategory: 'game',
    isSaving: false,
    error: null
  });

  // 游戏设置
  const gameSettings = ref<GameSettings>({
    autoSave: true,
    saveInterval: 5,
    showTutorial: false,
    confirmDangerousActions: true,
    quickTradeMode: false
  });

  // 显示设置
  const displaySettings = ref<DisplaySettings>({
    theme: 'auto',
    language: 'zh-CN',
    showAnimations: true,
    showTooltips: true,
    compactMode: false
  });

  // 音频设置
  const audioSettings = ref<AudioSettings>({
    soundEnabled: true,
    musicEnabled: true,
    soundVolume: 70,
    musicVolume: 50,
    clickSounds: true
  });

  // 高级设置
  const advancedSettings = ref<AdvancedSettings>({
    developerMode: false,
    debugMode: false,
    performanceMode: false,
    experimentalFeatures: false
  });

  // 计算属性
  const hasUnsavedChanges = computed(() => {
    // 这里应该比较当前设置与保存的设置
    return false; // 简化实现
  });

  // 设置类别
  const categories = computed(() => [
    {
      id: 'game' as const,
      name: '游戏设置',
      icon: '🎮',
      description: '游戏玩法和行为设置'
    },
    {
      id: 'display' as const,
      name: '显示设置',
      icon: '🎨',
      description: '主题、语言和界面设置'
    },
    {
      id: 'audio' as const,
      name: '音频设置',
      icon: '🔊',
      description: '声音和音乐设置'
    },
    {
      id: 'advanced' as const,
      name: '高级设置',
      icon: '⚙️',
      description: '开发者和实验性功能'
    }
  ]);

  // 方法
  const setActiveCategory = (category: SettingsPageState['activeCategory']) => {
    state.value.activeCategory = category;
  };

  const saveSettings = async () => {
    state.value.isSaving = true;
    state.value.error = null;

    try {
      // 保存到本地存储
      localStorage.setItem('game-settings', JSON.stringify(gameSettings.value));
      localStorage.setItem('display-settings', JSON.stringify(displaySettings.value));
      localStorage.setItem('audio-settings', JSON.stringify(audioSettings.value));
      localStorage.setItem('advanced-settings', JSON.stringify(advancedSettings.value));

      // 模拟保存延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 这里可以触发成功提示
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : '保存设置失败';
    } finally {
      state.value.isSaving = false;
    }
  };

  const loadSettings = () => {
    try {
      const savedGameSettings = localStorage.getItem('game-settings');
      const savedDisplaySettings = localStorage.getItem('display-settings');
      const savedAudioSettings = localStorage.getItem('audio-settings');
      const savedAdvancedSettings = localStorage.getItem('advanced-settings');

      if (savedGameSettings) {
        gameSettings.value = { ...gameSettings.value, ...JSON.parse(savedGameSettings) };
      }
      if (savedDisplaySettings) {
        displaySettings.value = { ...displaySettings.value, ...JSON.parse(savedDisplaySettings) };
      }
      if (savedAudioSettings) {
        audioSettings.value = { ...audioSettings.value, ...JSON.parse(savedAudioSettings) };
      }
      if (savedAdvancedSettings) {
        advancedSettings.value = { ...advancedSettings.value, ...JSON.parse(savedAdvancedSettings) };
      }
    } catch (error) {
      console.warn('Failed to load settings:', error);
    }
  };

  const resetToDefaults = () => {
    gameSettings.value = {
      autoSave: true,
      saveInterval: 5,
      showTutorial: false,
      confirmDangerousActions: true,
      quickTradeMode: false
    };

    displaySettings.value = {
      theme: 'auto',
      language: 'zh-CN',
      showAnimations: true,
      showTooltips: true,
      compactMode: false
    };

    audioSettings.value = {
      soundEnabled: true,
      musicEnabled: true,
      soundVolume: 70,
      musicVolume: 50,
      clickSounds: true
    };

    advancedSettings.value = {
      developerMode: false,
      debugMode: false,
      performanceMode: false,
      experimentalFeatures: false
    };
  };

  const backToGame = () => {
    router.push('/game');
  };

  // 初始化
  loadSettings();

  // 监听设置变化，自动保存
  watch([gameSettings, displaySettings, audioSettings, advancedSettings], () => {
    if (gameSettings.value.autoSave) {
      saveSettings();
    }
  }, { deep: true });

  return {
    // 状态
    state: computed(() => state.value),
    gameSettings,
    displaySettings,
    audioSettings,
    advancedSettings,
    hasUnsavedChanges,
    categories,

    // 方法
    setActiveCategory,
    saveSettings,
    loadSettings,
    resetToDefaults,
    backToGame
  };
}