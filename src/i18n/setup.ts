/**
 * 国际化设置模块 - TypeScript版本
 * 配置和创建vue-i18n实例
 */

import { createI18n, type I18n } from 'vue-i18n';
import zhCN from './langs/zh-CN';
import { handleError, ErrorType, ErrorSeverity } from '@/infrastructure/utils/errorHandler';
// 预留英文导入
// import enUS from './langs/en-US';

// ==================== 类型定义 ====================

/**
 * 支持的语言类型
 */
export type SupportedLocale = 'zh-CN' | 'en-US';

/**
 * 语言信息接口
 */
export interface LanguageInfo {
  code: SupportedLocale;
  name: string;
  flag: string;
}

/**
 * 格式化器类型
 */
export type FormatType = 'currency' | 'decimal' | 'percent' | 'short' | 'long';

// ==================== 语言检测函数 ====================

/**
 * 检测用户首选语言
 * @returns 检测到的语言代码
 */
function getBrowserLanguage(): SupportedLocale {
  const browserLang: string = (navigator as any).language || (navigator as any).userLanguage || '';
  const supportedLangs: SupportedLocale[] = ['zh-CN']; // 暂只支持中文
  
  // 未来增加更多语言时取消注释
  // if (browserLang.startsWith('en')) return 'en-US';
  if (browserLang.startsWith('zh')) return 'zh-CN';
  
  return 'zh-CN'; // 默认中文
}

/**
 * 尝试从本地存储加载用户语言设置
 * @returns 用户设置的语言或检测到的浏览器语言
 */
function getUserLanguage(): SupportedLocale {
  try {
    const savedLang = localStorage.getItem('userLanguage') as SupportedLocale | null;
    if (savedLang && ['zh-CN', 'en-US'].includes(savedLang)) {
      return savedLang;
    }
  } catch (e) {
    handleError(e as Error, 'i18n.getUserLanguage', ErrorType.STORAGE, ErrorSeverity.INFO);
    console.warn('无法从本地存储读取语言设置:', e);
  }
  
  return getBrowserLanguage();
}

// ==================== i18n实例创建函数 ====================

/**
 * 创建并配置i18n实例
 * @returns 配置好的i18n实例
 */
export function setupI18n(): I18n {
  const i18n = createI18n({
    legacy: false, // 使用Vue 3 Composition API
    locale: getUserLanguage(),
    fallbackLocale: 'zh-CN' as SupportedLocale,
    messages: {
      'zh-CN': zhCN,
      // 'en-US': enUS, // 预留
    },
    // 启用日期本地化
    datetimeFormats: {
      'zh-CN': {
        short: {
          year: 'numeric' as const,
          month: '2-digit' as const,
          day: '2-digit' as const
        },
        long: {
          year: 'numeric' as const,
          month: 'long' as const,
          day: 'numeric' as const,
          hour: 'numeric' as const,
          minute: 'numeric' as const
        }
      }
    },
    // 启用数字本地化
    numberFormats: {
      'zh-CN': {
        currency: {
          style: 'currency' as const,
          currency: 'CNY',
          notation: 'standard' as const
        },
        decimal: {
          style: 'decimal' as const,
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        },
        percent: {
          style: 'percent' as const,
          useGrouping: false
        }
      }
    }
  });
  
  // ==================== 扩展i18n实例方法 ====================
  
  // 添加语言切换方法
  (i18n.global as any).setLanguage = (lang: SupportedLocale): void => {
    if (!i18n.global.availableLocales.includes(lang)) {
      console.warn(`语言 ${lang} 不可用，使用默认语言`);
      lang = i18n.global.fallbackLocale.value as SupportedLocale;
    }
    
    i18n.global.locale.value = lang;
    
    // 同步设置日期和数字格式
    const htmlElement = document.querySelector('html');
    if (htmlElement) {
      htmlElement.setAttribute('lang', lang);
    }
    
    // 保存用户语言偏好
    try {
      localStorage.setItem('userLanguage', lang);
    } catch (e) {
      handleError(e as Error, 'i18n.setLanguage', ErrorType.STORAGE, ErrorSeverity.INFO);
      console.warn('无法保存语言设置到本地存储:', e);
    }
  };
  
  // 添加获取支持语言列表的方法
  (i18n.global as any).getSupportedLanguages = (): LanguageInfo[] => {
    return [
      { code: 'zh-CN' as SupportedLocale, name: '简体中文', flag: '🇨🇳' }
      // { code: 'en-US' as SupportedLocale, name: 'English', flag: '🇺🇸' } // 预留
    ];
  };
  
  // 添加格式化器助手
  (i18n.global as any).formatCurrency = (amount: number): string => {
    return i18n.global.n(amount, 'currency');
  };
  
  (i18n.global as any).formatDate = (date: Date, format: FormatType = 'long'): string => {
    return i18n.global.d(date, format);
  };
  
  (i18n.global as any).formatNumber = (number: number): string => {
    return i18n.global.n(number, 'decimal');
  };
  
  (i18n.global as any).formatPercent = (number: number): string => {
    return i18n.global.n(number, 'percent');
  };
  
  return i18n;
} 