/**
 * 格式化工具函数集合
 * 提供统一的格式化函数，避免在各组件中重复实现
 */
import i18n from '../../i18n';

/**
 * 格式化数字为千分位显示
 * @param {number} num - 要格式化的数字
 * @param {string} locale - 区域设置，默认为中文
 * @returns {string} 格式化后的数字字符串
 */
export function formatNumber(num) {
  if (num === undefined || num === null) return '0';
  
  // 优先使用i18n的格式化函数
  if (i18n && i18n.global && typeof i18n.global.formatNumber === 'function') {
    return i18n.global.formatNumber(num);
  }
  
  // 回退到原生方法
  return num.toLocaleString('zh-CN');
}

/**
 * 格式化货币金额
 * @param {number} amount - 金额
 * @param {string} currency - 货币符号，默认为¥
 * @returns {string} 格式化后的货币字符串
 */
export function formatCurrency(amount, currency = '¥') {
  if (amount === undefined || amount === null) return `${currency}0`;
  
  // 优先使用i18n的格式化函数
  if (i18n && i18n.global && typeof i18n.global.formatCurrency === 'function') {
    return i18n.global.formatCurrency(amount);
  }
  
  // 回退到原生方法
  return `${currency}${formatNumber(amount)}`;
}

/**
 * 格式化价格变化百分比
 * @param {number} percent - 百分比值
 * @returns {string} 格式化后的百分比字符串，包含正负号
 */
export function formatPercentChange(percent) {
  if (percent === undefined || percent === null) return '0.0%';
  
  const sign = percent > 0 ? '+' : '';
  return `${sign}${percent.toFixed(1)}%`;
}

/**
 * 格式化日期时间
 * @param {Date|string|number} date - 日期对象、时间戳或日期字符串
 * @param {string} format - 格式化类型，可选值：'date', 'time', 'datetime'
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = 'datetime') {
  if (!date) return '';
  
  // 优先使用i18n的格式化函数
  if (i18n && i18n.global && typeof i18n.global.formatDate === 'function') {
    return i18n.global.formatDate(new Date(date), format);
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
 * @param {number} percent - 变化百分比
 * @returns {string} 对应的CSS类名
 */
export function getPriceChangeClass(percent) {
  if (percent === undefined || percent === null) return 'change-neutral';
  if (percent > 3) return 'change-up-strong';
  if (percent > 0) return 'change-up';
  if (percent < -3) return 'change-down-strong';
  if (percent < 0) return 'change-down';
  return 'change-neutral';
}

/**
 * 格式化游戏周数显示
 * @param {number} week - 周数
 * @param {number} totalWeeks - 总周数
 * @returns {string} 格式化后的周数字符串
 */
export function formatGameWeek(week, totalWeeks) {
  return `${week} / ${totalWeeks}`;
}

/**
 * 格式化游戏时间
 * @param {number} minutes - 游戏时间（分钟）
 * @returns {string} 格式化后的时间字符串
 */
export function formatGameTime(minutes) {
  if (!minutes && minutes !== 0) return '0分钟';
  
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  
  if (hours > 0) {
    return `${hours}小时${mins > 0 ? ` ${mins}分钟` : ''}`;
  }
  return `${mins}分钟`;
} 