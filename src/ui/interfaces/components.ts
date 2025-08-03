/**
 * UI组件接口定义
 * 定义UI层组件的标准接口和类型
 */

// ==================== 基础UI类型 ====================

/**
 * 组件大小枚举
 */
export enum ComponentSize {
  Small = 'small',
  Medium = 'medium',
  Large = 'large'
}

/**
 * 组件变体枚举
 */
export enum ComponentVariant {
  Primary = 'primary',
  Secondary = 'secondary',
  Success = 'success',
  Warning = 'warning',
  Error = 'error',
  Info = 'info'
}

/**
 * 加载状态接口
 */
export interface LoadingState {
  isLoading: boolean;
  loadingText?: string;
  progress?: number; // 0-100
}

/**
 * 错误状态接口
 */
export interface ErrorState {
  hasError: boolean;
  errorMessage?: string;
  errorCode?: string;
  canRetry?: boolean;
}

// ==================== 表单组件接口 ====================

/**
 * 表单字段接口
 */
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'password' | 'select' | 'checkbox' | 'radio';
  value: any;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  options?: FormFieldOption[];
  validation?: FormFieldValidation;
}

/**
 * 表单字段选项接口
 */
export interface FormFieldOption {
  label: string;
  value: any;
  disabled?: boolean;
}

/**
 * 表单字段验证接口
 */
export interface FormFieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => string | null;
}

/**
 * 表单状态接口
 */
export interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
}

// ==================== 表格组件接口 ====================

/**
 * 表格列接口
 */
export interface TableColumn {
  key: string;
  title: string;
  dataIndex: string;
  width?: string | number;
  fixed?: 'left' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, record: any, index: number) => any;
  align?: 'left' | 'center' | 'right';
}

/**
 * 表格排序接口
 */
export interface TableSort {
  column: string;
  direction: 'asc' | 'desc';
}

/**
 * 表格过滤接口
 */
export interface TableFilter {
  column: string;
  value: any;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
}

/**
 * 表格分页接口
 */
export interface TablePagination {
  page: number;
  pageSize: number;
  total: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
}

// ==================== 模态框组件接口 ====================

/**
 * 模态框配置接口
 */
export interface ModalConfig {
  title?: string;
  width?: string | number;
  height?: string | number;
  closable?: boolean;
  maskClosable?: boolean;
  keyboard?: boolean;
  centered?: boolean;
  destroyOnClose?: boolean;
}

/**
 * 确认对话框配置接口
 */
export interface ConfirmDialogConfig extends ModalConfig {
  content: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonType?: ComponentVariant;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

// ==================== 通知组件接口 ====================

/**
 * 通知类型枚举
 */
export enum NotificationType {
  Success = 'success',
  Info = 'info',
  Warning = 'warning',
  Error = 'error'
}

/**
 * 通知配置接口
 */
export interface NotificationConfig {
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number; // 毫秒，0表示不自动关闭
  closable?: boolean;
  showIcon?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  onClose?: () => void;
}

// ==================== 导航组件接口 ====================

/**
 * 菜单项接口
 */
export interface MenuItem {
  key: string;
  label: string;
  icon?: string;
  path?: string;
  children?: MenuItem[];
  disabled?: boolean;
  visible?: boolean;
  permissions?: string[];
}

/**
 * 面包屑项接口
 */
export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: string;
}

// ==================== 图表组件接口 ====================

/**
 * 图表数据点接口
 */
export interface ChartDataPoint {
  x: string | number | Date;
  y: number;
  label?: string;
  color?: string;
}

/**
 * 图表系列接口
 */
export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  type: 'line' | 'bar' | 'area' | 'pie' | 'scatter';
  color?: string;
}

/**
 * 图表配置接口
 */
export interface ChartConfig {
  title?: string;
  subtitle?: string;
  xAxis?: ChartAxisConfig;
  yAxis?: ChartAxisConfig;
  legend?: ChartLegendConfig;
  tooltip?: ChartTooltipConfig;
  responsive?: boolean;
  animation?: boolean;
}

/**
 * 图表轴配置接口
 */
export interface ChartAxisConfig {
  title?: string;
  type?: 'category' | 'linear' | 'logarithmic' | 'datetime';
  min?: number | Date;
  max?: number | Date;
  gridLines?: boolean;
  labels?: boolean;
}

/**
 * 图表图例配置接口
 */
export interface ChartLegendConfig {
  show?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
}

/**
 * 图表提示框配置接口
 */
export interface ChartTooltipConfig {
  show?: boolean;
  format?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
}

// ==================== 游戏UI组件接口 ====================

/**
 * 游戏状态显示接口
 */
export interface GameStatusDisplay {
  currentWeek: number;
  totalWeeks: number;
  gameMode: 'normal' | 'endless';
  isPaused: boolean;
  isLoading: boolean;
}

/**
 * 玩家信息显示接口
 */
export interface PlayerInfoDisplay {
  name: string;
  money: number;
  debt: number;
  bankDeposit?: number;
  capacity: number;
  inventoryUsed: number;
  currentLocation: string;
}

/**
 * 商品显示接口
 */
export interface ProductDisplay {
  id: string;
  name: string;
  category: string;
  currentPrice: number;
  basePrice: number;
  trend: 'rising' | 'falling' | 'stable';
  changePercent: number;
  isSpecial?: boolean;
  ownedQuantity?: number;
}

/**
 * 价格趋势显示接口
 */
export interface PriceTrendDisplay {
  trend: 'rising' | 'falling' | 'stable';
  percent: number;
  icon: string;
  color: string;
  description: string;
}

// ==================== 事件处理接口 ====================

/**
 * 组件事件处理器接口
 */
export interface ComponentEventHandlers {
  onClick?: (event: MouseEvent) => void;
  onDoubleClick?: (event: MouseEvent) => void;
  onMouseEnter?: (event: MouseEvent) => void;
  onMouseLeave?: (event: MouseEvent) => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onChange?: (value: any, event: Event) => void;
  onInput?: (value: any, event: InputEvent) => void;
  onSubmit?: (values: any, event: Event) => void;
  onReset?: (event: Event) => void;
}

/**
 * 拖拽事件接口
 */
export interface DragEventHandlers {
  onDragStart?: (event: DragEvent) => void;
  onDrag?: (event: DragEvent) => void;
  onDragEnd?: (event: DragEvent) => void;
  onDragEnter?: (event: DragEvent) => void;
  onDragOver?: (event: DragEvent) => void;
  onDragLeave?: (event: DragEvent) => void;
  onDrop?: (event: DragEvent) => void;
}

// ==================== 响应式设计接口 ====================

/**
 * 断点定义接口
 */
export interface Breakpoint {
  name: string;
  minWidth: number;
  maxWidth?: number;
}

/**
 * 响应式值接口
 */
export interface ResponsiveValue<T> {
  xs?: T;  // < 576px
  sm?: T;  // >= 576px
  md?: T;  // >= 768px
  lg?: T;  // >= 992px
  xl?: T;  // >= 1200px
  xxl?: T; // >= 1600px
}

// ==================== 主题和样式接口 ====================

/**
 * 主题配置接口
 */
export interface ThemeConfig {
  name: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  shadows: ThemeShadows;
  borderRadius: ThemeBorderRadius;
  zIndex: ThemeZIndex;
}

/**
 * 主题颜色接口
 */
export interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
  border: string;
}

/**
 * 主题排版接口
 */
export interface ThemeTypography {
  fontFamily: string;
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  fontWeight: {
    light: number;
    normal: number;
    medium: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

/**
 * 主题间距接口
 */
export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
}

/**
 * 主题阴影接口
 */
export interface ThemeShadows {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

/**
 * 主题圆角接口
 */
export interface ThemeBorderRadius {
  none: string;
  sm: string;
  md: string;
  lg: string;
  full: string;
}

/**
 * 主题层级接口
 */
export interface ThemeZIndex {
  dropdown: number;
  sticky: number;
  fixed: number;
  modal: number;
  popover: number;
  tooltip: number;
  notification: number;
}