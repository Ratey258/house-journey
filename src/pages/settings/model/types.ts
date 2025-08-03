/**
 * 设置页面相关类型定义
 */

export interface SettingsPageState {
  activeCategory: 'game' | 'display' | 'audio' | 'advanced';
  isSaving: boolean;
  error: string | null;
}

export interface GameSettings {
  autoSave: boolean;
  saveInterval: number; // 分钟
  showTutorial: boolean;
  confirmDangerousActions: boolean;
  quickTradeMode: boolean;
}

export interface DisplaySettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  showAnimations: boolean;
  showTooltips: boolean;
  compactMode: boolean;
}

export interface AudioSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  soundVolume: number; // 0-100
  musicVolume: number; // 0-100
  clickSounds: boolean;
}

export interface AdvancedSettings {
  developerMode: boolean;
  debugMode: boolean;
  performanceMode: boolean;
  experimentalFeatures: boolean;
}