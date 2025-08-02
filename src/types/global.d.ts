/**
 * 《买房记》全局类型定义
 * Vue 3.5 + TypeScript 现代化类型系统
 * 提供应用范围内的类型安全保障
 */

// 导入现有类型定义
import type { ErrorInfo } from '../infrastructure/utils/errorTypes';
import type { SystemInfo, NetworkStatus } from '../ui/composables/useDesktopExperience';

// ===== 应用程序核心类型 =====

declare global {
  // 应用程序版本信息
  const __APP_VERSION__: string;
  const __APP_NAME__: string;
  const __APP_DESCRIPTION__: string;
  const __APP_AUTHOR__: string;

  // Electron API增强类型 - 避免重复声明
  var electronAPI: ElectronAPI | undefined;
  var gameAudio: GameAudio | undefined;

  // Vite环境变量增强
  interface ImportMetaEnv {
    readonly VITE_APP_TITLE: string;
    readonly VITE_APP_VERSION: string;
    readonly VITE_BUILD_TIME: string;
    readonly VITE_GIT_COMMIT: string;
  }
}

// ===== 游戏核心类型 =====

/** 游戏难度等级 */
export type GameDifficulty = 'easy' | 'normal' | 'hard' | 'expert';

/** 游戏模式 */
export type GameMode = 'story' | 'sandbox' | 'challenge' | 'tutorial';

/** 游戏状态 */
export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameOver' | 'loading';

/** 玩家操作类型 */
export type PlayerAction = 'buy' | 'sell' | 'move' | 'upgrade' | 'research';

/** 市场状态类型 */
export type MarketStatus = 'normal' | 'boom' | 'recession' | 'crash' | 'recovery';

// ===== UI组件类型 =====

/** 主题类型 */
export type ThemeMode = 'light' | 'dark' | 'auto' | 'system';

/** 组件尺寸 */
export type ComponentSize = 'small' | 'medium' | 'large';

/** 通知类型 */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

/** 对话框类型 */
export type DialogType = 'confirm' | 'alert' | 'input' | 'custom';

/** 加载状态 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// ===== 错误处理类型 =====

/** 错误严重程度 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  FATAL = 'fatal'
}

/** 错误类型分类 */
export enum ErrorType {
  SYSTEM = 'system',
  NETWORK = 'network',
  VALIDATION = 'validation',
  BUSINESS = 'business',
  UNKNOWN = 'unknown'
}

// ===== 性能监控类型 =====

/** 性能等级 */
export type PerformanceLevel = 'high' | 'medium' | 'low' | 'critical';

/** 设备类型 - 桌面端专用 */
export type DeviceType = 'desktop' | 'electron';

/** 网络状态 */
export type NetworkType = 'wifi' | 'cellular' | 'ethernet' | 'offline';

// ===== Electron API类型增强 =====

interface ElectronAPI {
  // 系统信息
  getSystemInfo(): Promise<SystemApiResponse>;
  getNetworkStatus(): Promise<NetworkApiResponse>;

  // 窗口控制
  minimize(): Promise<WindowApiResponse>;
  maximize(): Promise<WindowApiResponse>;
  close(): Promise<WindowApiResponse>;
  isMaximized(): Promise<WindowStateResponse>;
  toggleFullscreen(): Promise<WindowApiResponse>;

  // 通知系统
  showNotification(title: string, body: string, options?: NotificationOptions): Promise<NotificationResponse>;
  setAppBadge(count: number): Promise<ApiResponse>;
  clearAppBadge(): Promise<ApiResponse>;

  // 错误日志
  logError(errorInfo: ErrorInfo): void;
  exportErrorLogs(logs: ErrorInfo[]): Promise<ApiResponse>;

  // 事件监听
  onNetworkStatusChange(callback: (status: NetworkStatus) => void): () => void;
  onPerformanceHint(callback: (hint: string) => void): () => void;
}

interface GameAudio {
  play(soundName: string): void;
  stop(soundName: string): void;
  setVolume(volume: number): void;
  mute(): void;
  unmute(): void;
}

// ===== API响应类型 =====

interface ApiResponse {
  success: boolean;
  error?: string;
}

interface SystemApiResponse extends ApiResponse {
  data?: SystemInfo;
}

interface NetworkApiResponse extends ApiResponse {
  data?: NetworkStatus;
}

interface WindowApiResponse extends ApiResponse {
  data?: unknown;
}

interface WindowStateResponse extends ApiResponse {
  data?: boolean;
}

interface NotificationResponse extends ApiResponse {
  id?: string;
}

// ===== 工具类型 =====

/** 深度只读类型 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/** 可选字段类型 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** 排除空值类型 */
export type NonNullable<T> = Exclude<T, null | undefined>;

/** 函数参数类型提取 */
export type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;

/** 函数返回值类型提取 */
export type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;

// ===== Vue组件类型增强 =====

/** Vue组件Props类型 */
export type ComponentProps<T> = T extends { $props: infer P } ? P : never;

/** Vue组件实例类型 */
export type ComponentInstance<T> = T extends { new (): infer I } ? I : never;

/** Vue组件Ref类型 */
export type ComponentRef<T> = T | null;

// ===== Store状态类型 =====

/** Store状态基类 */
export interface BaseStoreState {
  initialized: boolean;
  loading: boolean;
  error: string | null;
  lastUpdated: number;
}

/** Store操作结果 */
export interface StoreOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

// ===== 国际化类型 =====

/** 语言代码 */
export type LanguageCode = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR';

/** 翻译键路径 */
export type TranslationKey = string;

/** 翻译参数 */
export interface TranslationParams {
  [key: string]: string | number;
}

// ===== 导出所有类型 =====
export {};
