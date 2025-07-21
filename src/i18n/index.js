import { setupI18n } from './setup';

// 创建并配置i18n实例
const i18n = setupI18n();

export default i18n;

// 导出辅助函数，方便在组件外部使用
export const t = i18n.global.t;
export const d = i18n.global.d;
export const n = i18n.global.n;
export const setLanguage = i18n.global.setLanguage;
export const getSupportedLanguages = i18n.global.getSupportedLanguages;
export const formatCurrency = i18n.global.formatCurrency;
export const formatDate = i18n.global.formatDate;
export const formatNumber = i18n.global.formatNumber;
export const formatPercent = i18n.global.formatPercent; 