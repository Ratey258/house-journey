/**
 * common 模块索引文件
 *
 * 该文件导出 ui/components/common 目录下的所有模块
 */

// 导出所有通用组件
import ErrorBoundary from './ErrorBoundary.vue';
import ErrorDialog from './ErrorDialog.vue';
// ErrorLogViewer 已删除 - 未使用的开发工具组件
import ErrorRecoveryDialog from './ErrorRecoveryDialog.vue';
import EventModal from './EventModal.vue';
import Toast from './Toast.vue';
import TutorialSystem from './TutorialSystem.vue';
import TransitionWrapper from './TransitionWrapper.vue';
import LanguageSelector from './LanguageSelector.vue';
import GameDialog from './GameDialog.vue';
import ThemeToggle from './ThemeToggle.vue';
import DesktopStatusIndicator from './DesktopStatusIndicator.vue';
// PerformanceDashboard 已删除 - 未使用的性能监控组件
import DesktopLayoutPanel from './DesktopLayoutPanel.vue';
// MemoryManagerPanel 已删除 - 未使用的内存管理组件

export {
  ErrorBoundary,
  ErrorDialog,
  // ErrorLogViewer, - 已删除
  ErrorRecoveryDialog,
  EventModal,
  GameDialog,
  Toast,
  TutorialSystem,
  TransitionWrapper,
  LanguageSelector,
  ThemeToggle,
  DesktopStatusIndicator,
  // PerformanceDashboard, - 已删除
  DesktopLayoutPanel,
  // MemoryManagerPanel - 已删除
};

