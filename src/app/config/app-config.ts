/**
 * 应用配置
 */

export interface AppConfig {
  // 应用信息
  name: string;
  version: string;
  description: string;
  
  // 环境配置
  env: 'development' | 'production' | 'test';
  debug: boolean;
  
  // 功能开关
  features: {
    enableDevTools: boolean;
    enableAutoSave: boolean;
    enableAnimations: boolean;
    enableSounds: boolean;
  };
  
  // 性能配置
  performance: {
    enableLazyLoading: boolean;
    enableCodeSplitting: boolean;
    chunkSize: number;
  };
  
  // 存储配置
  storage: {
    prefix: string;
    ttl: number; // Time to live in milliseconds
  };
}

/**
 * 默认应用配置
 */
export const defaultAppConfig: AppConfig = {
  name: '《买房记》',
  version: '2.0.0',
  description: '经典房地产交易游戏 - FSD架构重构版',
  
  env: import.meta.env.MODE as 'development' | 'production' | 'test',
  debug: import.meta.env.DEV,
  
  features: {
    enableDevTools: import.meta.env.DEV,
    enableAutoSave: true,
    enableAnimations: true,
    enableSounds: true
  },
  
  performance: {
    enableLazyLoading: true,
    enableCodeSplitting: true,
    chunkSize: 500 * 1024 // 500KB
  },
  
  storage: {
    prefix: 'house-journey-v2',
    ttl: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
};

/**
 * 获取应用配置
 */
export function getAppConfig(): AppConfig {
  return { ...defaultAppConfig };
}

/**
 * 验证应用配置
 */
export function validateAppConfig(config: Partial<AppConfig>): boolean {
  try {
    // 基本验证
    if (!config.name || !config.version) {
      console.error('应用名称和版本是必需的');
      return false;
    }
    
    // 环境验证
    if (config.env && !['development', 'production', 'test'].includes(config.env)) {
      console.error('无效的环境配置');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('配置验证失败:', error);
    return false;
  }
}