/**
 * 玩家页面相关类型定义
 */

export interface PlayerPageState {
  activeSection: 'overview' | 'inventory' | 'houses' | 'statistics';
  isLoading: boolean;
  error: string | null;
}

export interface PlayerPageMeta {
  title: string;
  description: string;
}