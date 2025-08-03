/**
 * 游戏布局相关类型定义
 */

export interface GameLayoutConfig {
  showSidebar: boolean;
  sidebarWidth: number;
  activeTab: 'market' | 'inventory' | 'houses';
  showDevTools: boolean;
  isFullscreen: boolean;
}

export interface GameLayoutState {
  config: GameLayoutConfig;
  isLoading: boolean;
  error: string | null;
}

export interface TabInfo {
  id: string;
  name: string;
  icon?: string;
  component: any;
}