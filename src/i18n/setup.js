import { createI18n } from 'vue-i18n';
import zhCN from './langs/zh-CN';
import { handleError, ErrorType, ErrorSeverity } from '@/infrastructure/utils/errorHandler';
// 预留英文导入
// import enUS from './langs/en-US';

/**
 * 检测用户首选语言
 * @returns {string} 检测到的语言代码
 */
function getBrowserLanguage() {
  const browserLang = navigator.language || navigator.userLanguage;
  const supportedLangs = ['zh-CN']; // 暂只支持中文
  
  // 未来增加更多语言时取消注释
  // if (browserLang.startsWith('en')) return 'en-US';
  if (browserLang.startsWith('zh')) return 'zh-CN';
  
  return 'zh-CN'; // 默认中文
}

/**
 * 尝试从本地存储加载用户语言设置
 * @returns {string} 用户设置的语言或检测到的浏览器语言
 */
function getUserLanguage() {
  try {
    const savedLang = localStorage.getItem('userLanguage');
    if (savedLang) return savedLang;
  } catch (e) {
    handleError(e, 'i18n.getUserLanguage', ErrorType.STORAGE, ErrorSeverity.INFO);
    console.warn('无法从本地存储读取语言设置:', e);
  }
  
  return getBrowserLanguage();
}

/**
 * 创建并配置i18n实例
 * @returns {I18n} 配置好的i18n实例
 */
export function setupI18n() {
  const i18n = createI18n({
    legacy: false, // 使用Vue 3 Composition API
    locale: getUserLanguage(),
    fallbackLocale: 'zh-CN',
    messages: {
      'zh-CN': zhCN,
      // 'en-US': enUS, // 预留
    },
    // 启用日期本地化
    datetimeFormats: {
      'zh-CN': {
        short: {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        },
        long: {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric'
        }
      }
    },
    // 启用数字本地化
    numberFormats: {
      'zh-CN': {
        currency: {
          style: 'currency',
          currency: 'CNY',
          notation: 'standard'
        },
        decimal: {
          style: 'decimal',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        },
        percent: {
          style: 'percent',
          useGrouping: false
        }
      }
    }
  });
  
  // 添加语言切换方法
  i18n.global.setLanguage = (lang) => {
    if (!i18n.global.availableLocales.includes(lang)) {
      console.warn(`语言 ${lang} 不可用，使用默认语言`);
      lang = i18n.global.fallbackLocale.value;
    }
    
    i18n.global.locale.value = lang;
    
    // 同步设置日期和数字格式
    document.querySelector('html').setAttribute('lang', lang);
    
    // 保存用户语言偏好
    try {
      localStorage.setItem('userLanguage', lang);
    } catch (e) {
      handleError(e, 'i18n.setLanguage', ErrorType.STORAGE, ErrorSeverity.INFO);
      console.warn('无法保存语言设置到本地存储:', e);
    }
  };
  
  // 添加获取支持语言列表的方法
  i18n.global.getSupportedLanguages = () => {
    return [
      { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' }
      // { code: 'en-US', name: 'English', flag: '🇺🇸' } // 预留
    ];
  };
  
  // 添加格式化器助手
  i18n.global.formatCurrency = (amount) => {
    return i18n.global.n(amount, 'currency');
  };
  
  i18n.global.formatDate = (date, format = 'long') => {
    return i18n.global.d(date, format);
  };
  
  i18n.global.formatNumber = (number) => {
    return i18n.global.n(number, 'decimal');
  };
  
  i18n.global.formatPercent = (number) => {
    return i18n.global.n(number, 'percent');
  };
  
  return i18n;
} 