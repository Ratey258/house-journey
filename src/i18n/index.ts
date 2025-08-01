/**
 * 国际化模块索引 - TypeScript版本
 * 创建并导出i18n实例和辅助函数
 */

import type { I18n } from 'vue-i18n';
import { setupI18n } from './setup';

// ==================== 类型定义 ====================

/**
 * 格式化函数类型定义
 */
export type FormatFunction = (value: number) => string;
export type DateFormatFunction = (date: Date, format?: string) => string;
export type TranslateFunction = (key: string, ...args: any[]) => string;
export type LocaleFunction = (value: any, ...args: any[]) => string;

// ==================== i18n实例创建 ====================

// 创建并配置i18n实例
const i18n: I18n = setupI18n();

export default i18n;

// ==================== 辅助函数导出 ====================
// 导出辅助函数，方便在组件外部使用

/**
 * 翻译函数 - 将国际化键转换为对应语言的文本
 */
export const t: TranslateFunction = i18n.global.t;

/**
 * 日期格式化函数
 */
export const d: LocaleFunction = i18n.global.d;

/**
 * 数字格式化函数
 */
export const n: LocaleFunction = i18n.global.n;

/**
 * 设置语言函数
 */
export const setLanguage: (locale: string) => void = i18n.global.setLanguage;

/**
 * 获取支持的语言列表
 */
export const getSupportedLanguages: () => string[] = i18n.global.getSupportedLanguages;

/**
 * 货币格式化函数
 */
export const formatCurrency: FormatFunction = i18n.global.formatCurrency;

/**
 * 日期格式化函数
 */
export const formatDate: DateFormatFunction = i18n.global.formatDate;

/**
 * 数字格式化函数
 */
export const formatNumber: FormatFunction = i18n.global.formatNumber;

/**
 * 百分比格式化函数
 */
export const formatPercent: FormatFunction = i18n.global.formatPercent; 