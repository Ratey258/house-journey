/**
 * 游戏页面相关类型定义
 */

export interface GamePageState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  currentView: 'game' | 'market' | 'inventory' | 'houses';
}

export interface GamePageConfig {
  autoSave: boolean;
  showTutorial: boolean;
  soundEnabled: boolean;
  theme: 'light' | 'dark' | 'auto';
}

export interface GamePageMeta {
  title: string;
  description: string;
  keywords: string[];
}