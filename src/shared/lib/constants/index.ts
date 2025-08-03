/**
 * 应用常量定义
 * 定义全局使用的常量
 */

// === 应用基础常量 ===
export const APP_CONFIG = {
  NAME: '买房记',
  VERSION: '1.0.0',
  DESCRIPTION: '房地产投资模拟游戏',
  AUTHOR: '春卷',
  HOMEPAGE: 'https://github.com/Ratey258/house-journey',
  
  // 开发环境配置
  DEV: {
    API_BASE_URL: 'http://localhost:3000/api',
    WS_URL: 'ws://localhost:3001',
    LOG_LEVEL: 'debug'
  },
  
  // 生产环境配置
  PROD: {
    API_BASE_URL: '/api',
    WS_URL: '',
    LOG_LEVEL: 'warn'
  }
} as const;

// === HTTP相关常量 ===
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
} as const;

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS'
} as const;

// === 存储相关常量 ===
export const STORAGE_KEYS = {
  // 应用设置
  APP_SETTINGS: 'house-journey:settings',
  THEME: 'house-journey:theme',
  LANGUAGE: 'house-journey:language',
  
  // 用户数据
  USER_PROFILE: 'house-journey:user',
  GAME_SAVE: 'house-journey:save',
  PLAYER_STATS: 'house-journey:stats',
  
  // 游戏状态
  GAME_STATE: 'house-journey:game-state',
  MARKET_DATA: 'house-journey:market-data',
  PRICE_HISTORY: 'house-journey:price-history',
  
  // 缓存
  API_CACHE: 'house-journey:api-cache',
  RESOURCE_CACHE: 'house-journey:resources',
  
  // 临时数据
  TEMP_DATA: 'house-journey:temp',
  SESSION_DATA: 'house-journey:session',
  
  // 错误日志
  ERROR_LOGS: 'house-journey:errors',
  PERFORMANCE_LOGS: 'house-journey:performance'
} as const;

// === 时间相关常量 ===
export const TIME_CONSTANTS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000
} as const;

export const DATE_FORMATS = {
  DATE_ONLY: 'YYYY-MM-DD',
  TIME_ONLY: 'HH:mm:ss',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  DATETIME_SHORT: 'YYYY-MM-DD HH:mm',
  TIMESTAMP: 'YYYY-MM-DD HH:mm:ss.SSS',
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  READABLE: 'YYYY年MM月DD日 HH:mm',
  GAME_TIME: 'YYYY年 季节 第W周'
} as const;

// === UI相关常量 ===
export const UI_CONSTANTS = {
  // 断点
  BREAKPOINTS: {
    XS: 0,
    SM: 576,
    MD: 768,
    LG: 992,
    XL: 1200,
    XXL: 1600
  },
  
  // 桌面端断点（游戏专用）
  DESKTOP_BREAKPOINTS: {
    COMPACT: 1280,
    STANDARD: 1920,
    WIDE: 2560,
    ULTRA: 3840
  },
  
  // Z-Index层级
  Z_INDEX: {
    DROPDOWN: 1000,
    STICKY: 1020,
    FIXED: 1030,
    MODAL_BACKDROP: 1040,
    MODAL: 1050,
    POPOVER: 1060,
    TOOLTIP: 1070,
    TOAST: 1080,
    LOADING: 1090
  },
  
  // 动画时长
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
    VERY_SLOW: 1000
  },
  
  // 颜色主题
  THEME_COLORS: {
    PRIMARY: '#1890ff',
    SUCCESS: '#52c41a',
    WARNING: '#faad14',
    ERROR: '#f5222d',
    INFO: '#1890ff',
    
    // 游戏专用颜色
    PROFIT: '#52c41a',
    LOSS: '#f5222d',
    NEUTRAL: '#8c8c8c',
    GOLD: '#ffd700',
    SILVER: '#c0c0c0',
    BRONZE: '#cd7f32'
  }
} as const;

// === 游戏相关常量 ===
export const GAME_CONSTANTS = {
  // 游戏时间
  WEEKS_PER_SEASON: 13,
  SEASONS_PER_YEAR: 4,
  WEEKS_PER_YEAR: 52,
  
  // 季节
  SEASONS: ['spring', 'summer', 'autumn', 'winter'] as const,
  SEASON_NAMES: ['春', '夏', '秋', '冬'] as const,
  
  // 难度等级
  DIFFICULTY_LEVELS: {
    EASY: 'easy',
    NORMAL: 'normal',
    HARD: 'hard'
  } as const,
  
  DIFFICULTY_NAMES: {
    easy: '简单',
    normal: '普通',
    hard: '困难'
  } as const,
  
  // 玩家等级
  MAX_LEVEL: 100,
  EXP_PER_LEVEL: 1000,
  
  // 货币
  CURRENCIES: {
    CNY: '¥',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥'
  } as const,
  
  // 房屋类型
  HOUSE_TYPES: {
    APARTMENT: 'apartment',
    VILLA: 'villa',
    TOWNHOUSE: 'townhouse',
    COMMERCIAL: 'commercial'
  } as const,
  
  HOUSE_TYPE_NAMES: {
    apartment: '公寓',
    villa: '别墅',
    townhouse: '联排别墅',
    commercial: '商业地产'
  } as const,
  
  // 市场状态
  MARKET_STATUS: {
    BULL: 'bull',
    BEAR: 'bear',
    SIDEWAYS: 'sideways'
  } as const,
  
  MARKET_STATUS_NAMES: {
    bull: '牛市',
    bear: '熊市',
    sideways: '震荡'
  } as const,
  
  // 交易类型
  TRADE_TYPES: {
    BUY: 'buy',
    SELL: 'sell'
  } as const,
  
  TRADE_TYPE_NAMES: {
    buy: '购买',
    sell: '出售'
  } as const,
  
  // 成就类型
  ACHIEVEMENT_TYPES: {
    WEALTH: 'wealth',
    PROFIT: 'profit',
    TRANSACTION: 'transaction',
    LEVEL: 'level',
    SPECIAL: 'special'
  } as const
} as const;

// === 表单验证常量 ===
export const VALIDATION_RULES = {
  // 用户名
  USERNAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 20,
    PATTERN: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/
  },
  
  // 密码
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: true
  },
  
  // 邮箱
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  
  // 手机号（中国大陆）
  PHONE: {
    PATTERN: /^1[3-9]\d{9}$/
  },
  
  // 身份证号（中国大陆）
  ID_CARD: {
    PATTERN: /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/
  }
} as const;

// === 文件上传常量 ===
export const FILE_UPLOAD = {
  // 文件大小限制（字节）
  MAX_SIZE: {
    IMAGE: 5 * 1024 * 1024, // 5MB
    DOCUMENT: 10 * 1024 * 1024, // 10MB
    VIDEO: 100 * 1024 * 1024, // 100MB
    AUDIO: 50 * 1024 * 1024 // 50MB
  },
  
  // 支持的文件类型
  ALLOWED_TYPES: {
    IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    VIDEO: ['video/mp4', 'video/webm', 'video/ogg'],
    AUDIO: ['audio/mp3', 'audio/wav', 'audio/ogg']
  },
  
  // 文件扩展名
  EXTENSIONS: {
    IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    DOCUMENT: ['.pdf', '.doc', '.docx'],
    VIDEO: ['.mp4', '.webm', '.ogv'],
    AUDIO: ['.mp3', '.wav', '.ogg']
  }
} as const;

// === API相关常量 ===
export const API_CONSTANTS = {
  // 请求超时时间
  TIMEOUT: 10000, // 10秒
  
  // 重试配置
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000, // 1秒
    BACKOFF_FACTOR: 2
  },
  
  // 缓存配置
  CACHE: {
    DEFAULT_TTL: 5 * 60 * 1000, // 5分钟
    MAX_SIZE: 100, // 最大缓存条目数
    STORAGE_KEY: 'api-cache'
  },
  
  // 分页配置
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
  }
} as const;

// === 错误代码常量 ===
export const ERROR_CODES = {
  // 通用错误
  UNKNOWN: 'UNKNOWN',
  NETWORK: 'NETWORK',
  TIMEOUT: 'TIMEOUT',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  
  // 验证错误
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  
  // 认证错误
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // 业务错误
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
  
  // 系统错误
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  MAINTENANCE_MODE: 'MAINTENANCE_MODE'
} as const;

// === 本地化常量 ===
export const LOCALE_CONSTANTS = {
  // 支持的语言
  SUPPORTED_LOCALES: ['zh-CN', 'en-US'] as const,
  DEFAULT_LOCALE: 'zh-CN' as const,
  
  // 语言名称
  LOCALE_NAMES: {
    'zh-CN': '简体中文',
    'en-US': 'English'
  } as const,
  
  // 时区
  TIMEZONE: 'Asia/Shanghai',
  
  // 数字格式
  NUMBER_FORMAT: {
    'zh-CN': {
      decimal: '.',
      thousands: ',',
      currency: '¥'
    },
    'en-US': {
      decimal: '.',
      thousands: ',',
      currency: '$'
    }
  } as const
} as const;

// === 性能监控常量 ===
export const PERFORMANCE_CONSTANTS = {
  // 性能阈值
  THRESHOLDS: {
    FCP: 1800, // First Contentful Paint
    LCP: 2500, // Largest Contentful Paint
    FID: 100,  // First Input Delay
    CLS: 0.1,  // Cumulative Layout Shift
    TTFB: 600  // Time to First Byte
  },
  
  // 监控采样率
  SAMPLE_RATE: 0.1, // 10%
  
  // 上报配置
  REPORT_INTERVAL: 30000, // 30秒
  MAX_BUFFER_SIZE: 100
} as const;

// === 导出所有常量的类型 ===
export type AppConfig = typeof APP_CONFIG;
export type HttpStatus = typeof HTTP_STATUS;
export type HttpMethods = typeof HTTP_METHODS;
export type StorageKeys = typeof STORAGE_KEYS;
export type TimeConstants = typeof TIME_CONSTANTS;
export type DateFormats = typeof DATE_FORMATS;
export type UIConstants = typeof UI_CONSTANTS;
export type GameConstants = typeof GAME_CONSTANTS;
export type ValidationRules = typeof VALIDATION_RULES;
export type FileUpload = typeof FILE_UPLOAD;
export type ApiConstants = typeof API_CONSTANTS;
export type ErrorCodes = typeof ERROR_CODES;
export type LocaleConstants = typeof LOCALE_CONSTANTS;
export type PerformanceConstants = typeof PERFORMANCE_CONSTANTS;