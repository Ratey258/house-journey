/**
 * 格式化器工具函数
 * 提供各种数据格式化功能
 */

// === 数字格式化 ===

/**
 * 货币格式化器配置
 */
export interface CurrencyOptions {
  currency: string;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  style?: 'symbol' | 'code' | 'name';
}

/**
 * 格式化货币
 */
export function formatCurrency(
  amount: number, 
  options: CurrencyOptions = { currency: 'CNY' }
): string {
  const {
    currency,
    locale = 'zh-CN',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    style = 'symbol'
  } = options;
  
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: style,
    minimumFractionDigits,
    maximumFractionDigits
  });
  
  return formatter.format(amount);
}

/**
 * 格式化数字（添加千分位分隔符）
 */
export function formatNumber(
  num: number,
  options: {
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    useGrouping?: boolean;
  } = {}
): string {
  const {
    locale = 'zh-CN',
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    useGrouping = true
  } = options;
  
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping
  });
  
  return formatter.format(num);
}

/**
 * 格式化百分比
 */
export function formatPercentage(
  num: number,
  options: {
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string {
  const {
    locale = 'zh-CN',
    minimumFractionDigits = 0,
    maximumFractionDigits = 2
  } = options;
  
  const formatter = new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits
  });
  
  return formatter.format(num);
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * 格式化大数字（K, M, B, T）
 */
export function formatLargeNumber(num: number, decimals: number = 1): string {
  if (num < 1000) return num.toString();
  
  const units = ['', 'K', 'M', 'B', 'T'];
  const unitIndex = Math.floor(Math.log10(Math.abs(num)) / 3);
  const scaledNum = num / Math.pow(1000, unitIndex);
  
  if (unitIndex >= units.length) {
    return num.toExponential(decimals);
  }
  
  return `${scaledNum.toFixed(decimals)}${units[unitIndex]}`;
}

/**
 * 格式化电话号码
 */
export function formatPhoneNumber(phone: string, format: 'masked' | 'formatted' = 'formatted'): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (format === 'masked') {
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}****${cleaned.slice(7)}`;
    }
    return phone;
  }
  
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone;
}

/**
 * 格式化身份证号（脱敏）
 */
export function formatIdCard(idCard: string, masked: boolean = true): string {
  if (!masked) return idCard;
  
  if (idCard.length === 18) {
    return `${idCard.slice(0, 6)}********${idCard.slice(14)}`;
  }
  
  return idCard;
}

/**
 * 格式化银行卡号
 */
export function formatBankCard(cardNumber: string, masked: boolean = false): string {
  const cleaned = cardNumber.replace(/\D/g, '');
  
  if (masked && cleaned.length > 8) {
    const start = cleaned.slice(0, 4);
    const end = cleaned.slice(-4);
    const middle = '*'.repeat(cleaned.length - 8);
    return `${start} ${middle} ${end}`;
  }
  
  // 格式化为每4位一组
  return cleaned.replace(/(.{4})/g, '$1 ').trim();
}

// === 日期时间格式化 ===

/**
 * 日期格式化选项
 */
export interface DateFormatOptions {
  locale?: string;
  year?: 'numeric' | '2-digit';
  month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
  day?: 'numeric' | '2-digit';
  hour?: 'numeric' | '2-digit';
  minute?: 'numeric' | '2-digit';
  second?: 'numeric' | '2-digit';
  weekday?: 'long' | 'short' | 'narrow';
  timeZone?: string;
  hour12?: boolean;
}

/**
 * 格式化日期
 */
export function formatDate(date: Date, options: DateFormatOptions = {}): string {
  const defaultOptions: DateFormatOptions = {
    locale: 'zh-CN',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  const { locale, ...formatOptions } = mergedOptions;
  
  const formatter = new Intl.DateTimeFormat(locale, formatOptions);
  return formatter.format(date);
}

/**
 * 格式化时间
 */
export function formatTime(date: Date, options: DateFormatOptions = {}): string {
  const defaultOptions: DateFormatOptions = {
    locale: 'zh-CN',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  const { locale, ...formatOptions } = mergedOptions;
  
  const formatter = new Intl.DateTimeFormat(locale, formatOptions);
  return formatter.format(date);
}

/**
 * 格式化日期时间
 */
export function formatDateTime(date: Date, options: DateFormatOptions = {}): string {
  const defaultOptions: DateFormatOptions = {
    locale: 'zh-CN',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  const { locale, ...formatOptions } = mergedOptions;
  
  const formatter = new Intl.DateTimeFormat(locale, formatOptions);
  return formatter.format(date);
}

/**
 * 相对时间格式化
 */
export function formatRelativeTime(date: Date, baseDate: Date = new Date()): string {
  const rtf = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' });
  const diffInSeconds = (date.getTime() - baseDate.getTime()) / 1000;
  
  const units: Array<[string, number]> = [
    ['year', 365 * 24 * 60 * 60],
    ['month', 30 * 24 * 60 * 60],
    ['day', 24 * 60 * 60],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1]
  ];
  
  for (const [unit, secondsInUnit] of units) {
    const diff = diffInSeconds / secondsInUnit;
    
    if (Math.abs(diff) >= 1) {
      return rtf.format(Math.round(diff), unit as Intl.RelativeTimeFormatUnit);
    }
  }
  
  return rtf.format(0, 'second');
}

/**
 * 格式化持续时间
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
    .toString()
    .padStart(2, '0')}`;
}

// === 字符串格式化 ===

/**
 * 格式化用户名（脱敏）
 */
export function formatUsername(username: string, maskLength: number = 2): string {
  if (username.length <= maskLength * 2) {
    return username;
  }
  
  const start = username.slice(0, maskLength);
  const end = username.slice(-maskLength);
  const middle = '*'.repeat(username.length - maskLength * 2);
  
  return `${start}${middle}${end}`;
}

/**
 * 格式化邮箱（脱敏）
 */
export function formatEmail(email: string, masked: boolean = true): string {
  if (!masked) return email;
  
  const [localPart, domain] = email.split('@');
  
  if (localPart.length <= 2) {
    return email;
  }
  
  const maskedLocal = `${localPart[0]}***${localPart.slice(-1)}`;
  return `${maskedLocal}@${domain}`;
}

/**
 * 格式化地址（省略中间部分）
 */
export function formatAddress(address: string, maxLength: number = 30): string {
  if (address.length <= maxLength) {
    return address;
  }
  
  const start = address.slice(0, Math.floor(maxLength / 2) - 2);
  const end = address.slice(-(Math.floor(maxLength / 2) - 2));
  
  return `${start}...${end}`;
}

/**
 * 高亮关键字
 */
export function highlightKeywords(
  text: string,
  keywords: string[],
  className: string = 'highlight'
): string {
  if (!keywords.length) return text;
  
  const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
  return text.replace(regex, `<span class="${className}">$1</span>`);
}

/**
 * 截断文本
 */
export function truncateText(
  text: string,
  maxLength: number,
  suffix: string = '...'
): string {
  if (text.length <= maxLength) return text;
  
  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * 首字母大写
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * 标题格式化（每个单词首字母大写）
 */
export function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * 驼峰转短横线
 */
export function camelToKebab(text: string): string {
  return text.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}

/**
 * 短横线转驼峰
 */
export function kebabToCamel(text: string): string {
  return text.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * 下划线转驼峰
 */
export function snakeToCamel(text: string): string {
  return text.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * 驼峰转下划线
 */
export function camelToSnake(text: string): string {
  return text.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// === 游戏特定格式化 ===

/**
 * 格式化价格变化
 */
export function formatPriceChange(change: number, percentage: number): string {
  const symbol = change >= 0 ? '+' : '';
  const changeStr = `${symbol}${formatCurrency(change)}`;
  const percentageStr = `${symbol}${formatPercentage(percentage / 100)}`;
  
  return `${changeStr} (${percentageStr})`;
}

/**
 * 格式化游戏时间
 */
export function formatGameTime(week: number, year: number): string {
  const seasons = ['春', '夏', '秋', '冬'];
  const season = seasons[Math.floor((week - 1) / 13) % 4];
  const weekInSeason = ((week - 1) % 13) + 1;
  
  return `第${year}年 ${season}季 第${weekInSeason}周`;
}

/**
 * 格式化经验值
 */
export function formatExperience(current: number, total: number): string {
  const percentage = Math.round((current / total) * 100);
  return `${formatNumber(current)}/${formatNumber(total)} (${percentage}%)`;
}

/**
 * 格式化等级
 */
export function formatLevel(level: number): string {
  if (level < 10) return `Lv.0${level}`;
  return `Lv.${level}`;
}

/**
 * 格式化排名
 */
export function formatRank(rank: number): string {
  if (rank === 1) return '1st';
  if (rank === 2) return '2nd';
  if (rank === 3) return '3rd';
  return `${rank}th`;
}

// === 状态格式化 ===

/**
 * 格式化状态
 */
export function formatStatus(
  status: string,
  statusMap: Record<string, { label: string; color: string }> = {}
): { label: string; color: string } {
  return statusMap[status] || { label: status, color: 'gray' };
}

/**
 * 格式化布尔值
 */
export function formatBoolean(
  value: boolean,
  options: { trueLabel?: string; falseLabel?: string } = {}
): string {
  const { trueLabel = '是', falseLabel = '否' } = options;
  return value ? trueLabel : falseLabel;
}

// === 数据结构格式化 ===

/**
 * 格式化数组为字符串
 */
export function formatArray(
  items: any[],
  options: {
    separator?: string;
    formatter?: (item: any) => string;
    maxItems?: number;
    moreText?: string;
  } = {}
): string {
  const {
    separator = ', ',
    formatter = (item: any) => String(item),
    maxItems = Infinity,
    moreText = '...'
  } = options;
  
  const formattedItems = items.slice(0, maxItems).map(formatter);
  const result = formattedItems.join(separator);
  
  if (items.length > maxItems) {
    return `${result}${separator}${moreText}`;
  }
  
  return result;
}

/**
 * 格式化对象为字符串
 */
export function formatObject(
  obj: Record<string, any>,
  options: {
    keyValueSeparator?: string;
    itemSeparator?: string;
    formatter?: (key: string, value: any) => string;
  } = {}
): string {
  const {
    keyValueSeparator = ': ',
    itemSeparator = ', ',
    formatter = (key: string, value: any) => `${key}${keyValueSeparator}${value}`
  } = options;
  
  return Object.entries(obj)
    .map(([key, value]) => formatter(key, value))
    .join(itemSeparator);
}