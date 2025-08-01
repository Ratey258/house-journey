/**
 * 格式化工具函数集合 - TypeScript版本
 * 提供统一的格式化函数，避免在各组件中重复实现
 */
import i18n from '../../i18n';

// ==================== 类型定义 ====================

/**
 * 日期格式化类型
 */
export type DateFormatType = 'date' | 'time' | 'datetime';

/**
 * 价格变化CSS类名类型
 */
export type PriceChangeClass = 
  | 'change-up-strong' 
  | 'change-up' 
  | 'change-neutral' 
  | 'change-down' 
  | 'change-down-strong';

/**
 * i18n格式化函数接口
 */
interface I18nFormatFunctions {
  formatNumber?: (num: number) => string;
  formatCurrency?: (amount: number) => string;
  formatDate?: (date: Date, format: DateFormatType) => string;
}

/**
 * i18n实例接口
 */
interface I18nInstance {
  global?: I18nFormatFunctions;
}

// ==================== 格式化函数 ====================

/**
 * 格式化数字为千分位显示
 * @param num 要格式化的数字
 * @param locale 区域设置，默认为中文
 * @returns 格式化后的数字字符串
 */
export function formatNumber(num: number | null | undefined, locale: string = 'zh-CN'): string {
  if (num === undefined || num === null) return '0';
  
  // 优先使用i18n的格式化函数
  const i18nInstance = i18n as I18nInstance;
  if (i18nInstance?.global?.formatNumber && typeof i18nInstance.global.formatNumber === 'function') {
    return i18nInstance.global.formatNumber(num);
  }
  
  // 回退到原生方法
  return num.toLocaleString(locale);
}

/**
 * 格式化货币金额
 * @param amount 金额
 * @param currency 货币符号，默认为¥
 * @returns 格式化后的货币字符串
 */
export function formatCurrency(amount: number | null | undefined, currency: string = '¥'): string {
  if (amount === undefined || amount === null) return `${currency}0`;
  
  // 优先使用i18n的格式化函数
  const i18nInstance = i18n as I18nInstance;
  if (i18nInstance?.global?.formatCurrency && typeof i18nInstance.global.formatCurrency === 'function') {
    return i18nInstance.global.formatCurrency(amount);
  }
  
  // 回退到原生方法
  return `${currency}${formatNumber(amount)}`;
}

/**
 * 格式化价格变化百分比
 * @param percent 百分比值
 * @returns 格式化后的百分比字符串，包含正负号
 */
export function formatPercentChange(percent: number | null | undefined): string {
  if (percent === undefined || percent === null) return '0.0%';
  
  const sign = percent > 0 ? '+' : '';
  return `${sign}${percent.toFixed(1)}%`;
}

/**
 * 格式化日期时间
 * @param date 日期对象、时间戳或日期字符串
 * @param format 格式化类型
 * @returns 格式化后的日期字符串
 */
export function formatDate(
  date: Date | string | number | null | undefined,
  format: DateFormatType = 'datetime'
): string {
  if (!date) return '';
  
  // 优先使用i18n的格式化函数
  const i18nInstance = i18n as I18nInstance;
  if (i18nInstance?.global?.formatDate && typeof i18nInstance.global.formatDate === 'function') {
    return i18nInstance.global.formatDate(new Date(date), format);
  }
  
  // 回退到原生方法
  const dateObj = new Date(date);
  
  switch (format) {
    case 'date':
      return dateObj.toLocaleDateString('zh-CN');
    case 'time':
      return dateObj.toLocaleTimeString('zh-CN');
    case 'datetime':
    default:
      return dateObj.toLocaleString('zh-CN');
  }
}

/**
 * 获取价格变化的CSS类名
 * @param percent 变化百分比
 * @returns 对应的CSS类名
 */
export function getPriceChangeClass(percent: number | null | undefined): PriceChangeClass {
  if (percent === undefined || percent === null) return 'change-neutral';
  if (percent > 3) return 'change-up-strong';
  if (percent > 0) return 'change-up';
  if (percent < -3) return 'change-down-strong';
  if (percent < 0) return 'change-down';
  return 'change-neutral';
}

/**
 * 格式化游戏周数显示
 * @param week 周数
 * @param totalWeeks 总周数
 * @returns 格式化后的周数字符串
 */
export function formatGameWeek(week: number, totalWeeks: number): string {
  // 判断是否为无尽模式（总周数大于52表示无尽模式）
  if (totalWeeks > 52) {
    return `${week}`;
  }
  return `${week} / ${totalWeeks}`;
}

/**
 * 格式化游戏时间
 * @param minutes 游戏时间（分钟）
 * @returns 格式化后的时间字符串
 */
export function formatGameTime(minutes: number | null | undefined): string {
  if (!minutes && minutes !== 0) return '0分钟';
  
  const hours = Math.floor(minutes! / 60);
  const mins = Math.floor(minutes! % 60);
  
  if (hours > 0) {
    return `${hours}小时${mins > 0 ? ` ${mins}分钟` : ''}`;
  }
  return `${mins}分钟`;
}

// ==================== 导出类型定义 ====================
export type {
  I18nFormatFunctions,
  I18nInstance
}; 