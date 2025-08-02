/**
 * 数据验证工具集 - TypeScript版本
 * 提供完整的输入参数验证和边界检查功能
 */

/**
 * 验证结果接口
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * 验证规则接口
 */
export interface ValidationRule<T = any> {
  validate: (value: T) => boolean;
  message: string;
  severity?: 'error' | 'warning';
}

/**
 * 基础验证器类
 */
export class Validator<T = any> {
  private rules: ValidationRule<T>[] = [];

  /**
   * 添加验证规则
   */
  addRule(rule: ValidationRule<T>): this {
    this.rules.push(rule);
    return this;
  }

  /**
   * 执行验证
   */
  validate(value: T): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const rule of this.rules) {
      if (!rule.validate(value)) {
        if (rule.severity === 'warning') {
          warnings.push(rule.message);
        } else {
          errors.push(rule.message);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }
}

/**
 * 创建验证器的工厂函数
 */
export function createValidator<T = any>(): Validator<T> {
  return new Validator<T>();
}

// ==================== 常用验证规则 ====================

/**
 * 必填验证
 */
export const required = (message: string = '此字段为必填项'): ValidationRule => ({
  validate: (value: any) => value !== null && value !== undefined && (typeof value !== 'string' || value.trim() !== ''),
  message
});

/**
 * 数字验证
 */
export const isNumber = (message: string = '必须是有效数字'): ValidationRule => ({
  validate: (value: any) => typeof value === 'number' && !isNaN(value) && isFinite(value),
  message
});

/**
 * 正数验证
 */
export const isPositive = (message: string = '必须是正数'): ValidationRule => ({
  validate: (value: any) => typeof value === 'number' && value > 0,
  message
});

/**
 * 非负数验证
 */
export const isNonNegative = (message: string = '不能为负数'): ValidationRule => ({
  validate: (value: any) => typeof value === 'number' && value >= 0,
  message
});

/**
 * 整数验证
 */
export const isInteger = (message: string = '必须是整数'): ValidationRule => ({
  validate: (value: any) => typeof value === 'number' && Number.isInteger(value),
  message
});

/**
 * 范围验证
 */
export const inRange = (min: number, max: number, message?: string): ValidationRule => ({
  validate: (value: any) => typeof value === 'number' && value >= min && value <= max,
  message: message || `值必须在${min}到${max}之间`
});

/**
 * 字符串长度验证
 */
export const hasLength = (min: number, max?: number, message?: string): ValidationRule => ({
  validate: (value: any) => {
    if (typeof value !== 'string') return false;
    const length = value.length;
    return length >= min && (max === undefined || length <= max);
  },
  message: message || (max ? `长度必须在${min}到${max}个字符之间` : `长度不能少于${min}个字符`)
});

/**
 * 正则表达式验证
 */
export const matchesPattern = (pattern: RegExp, message: string): ValidationRule => ({
  validate: (value: any) => typeof value === 'string' && pattern.test(value),
  message
});

/**
 * 数组验证
 */
export const isArray = (message: string = '必须是数组'): ValidationRule => ({
  validate: (value: any) => Array.isArray(value),
  message
});

/**
 * 数组长度验证
 */
export const arrayLength = (min: number, max?: number, message?: string): ValidationRule => ({
  validate: (value: any) => {
    if (!Array.isArray(value)) return false;
    const length = value.length;
    return length >= min && (max === undefined || length <= max);
  },
  message: message || (max ? `数组长度必须在${min}到${max}之间` : `数组长度不能少于${min}`)
});

/**
 * 枚举值验证
 */
export const isOneOf = <T>(allowedValues: T[], message?: string): ValidationRule => ({
  validate: (value: any) => allowedValues.includes(value),
  message: message || `值必须是以下之一: ${allowedValues.join(', ')}`
});

// ==================== 业务特定验证规则 ====================

/**
 * 商品ID验证
 */
export const validProductId = (): ValidationRule => ({
  validate: (value: any) => {
    if (typeof value === 'string' || typeof value === 'number') {
      const str = String(value);
      return str.length > 0 && str !== '0' && str !== 'undefined' && str !== 'null';
    }
    return false;
  },
  message: '商品ID无效'
});

/**
 * 金额验证
 */
export const validAmount = (maxAmount?: number): ValidationRule => ({
  validate: (value: any) => {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) return false;
    if (value < 0) return false;
    if (maxAmount !== undefined && value > maxAmount) return false;
    return true;
  },
  message: maxAmount ? `金额必须在0到${maxAmount}之间` : '金额必须大于等于0'
});

/**
 * 游戏周次验证
 */
export const validWeek = (maxWeeks: number = 52): ValidationRule => ({
  validate: (value: any) => {
    return typeof value === 'number' && 
           Number.isInteger(value) && 
           value >= 1 && 
           value <= maxWeeks;
  },
  message: `周次必须在1到${maxWeeks}之间`
});

/**
 * 玩家名称验证
 */
export const validPlayerName = (): ValidationRule => ({
  validate: (value: any) => {
    if (typeof value !== 'string') return false;
    const trimmed = value.trim();
    return trimmed.length >= 2 && 
           trimmed.length <= 20 && 
           /^[\u4e00-\u9fa5a-zA-Z0-9_\-\s]+$/.test(trimmed);
  },
  message: '玩家名称必须是2-20个字符，只能包含中文、英文、数字、下划线、连字符和空格'
});

// ==================== 组合验证器 ====================

/**
 * 商品购买参数验证器
 */
export const createProductPurchaseValidator = () => {
  return {
    productId: createValidator()
      .addRule(required('商品ID不能为空'))
      .addRule(validProductId()),
    
    quantity: createValidator()
      .addRule(required('数量不能为空'))
      .addRule(isNumber('数量必须是数字'))
      .addRule(isInteger('数量必须是整数'))
      .addRule(isPositive('数量必须大于0'))
      .addRule(inRange(1, 999, '数量必须在1到999之间'))
  };
};

/**
 * 房屋购买参数验证器
 */
export const createHousePurchaseValidator = () => {
  return {
    houseId: createValidator()
      .addRule(required('房屋ID不能为空'))
      .addRule(validProductId()),
    
    playerMoney: createValidator()
      .addRule(required('玩家资金不能为空'))
      .addRule(isNumber('玩家资金必须是数字'))
      .addRule(isNonNegative('玩家资金不能为负数'))
  };
};

/**
 * 债务偿还参数验证器
 */
export const createDebtRepaymentValidator = () => {
  return {
    amount: createValidator()
      .addRule(required('偿还金额不能为空'))
      .addRule(isNumber('偿还金额必须是数字'))
      .addRule(isPositive('偿还金额必须大于0')),
    
    playerMoney: createValidator()
      .addRule(required('玩家资金不能为空'))
      .addRule(isNumber('玩家资金必须是数字'))
      .addRule(isNonNegative('玩家资金不能为负数')),
    
    currentDebt: createValidator()
      .addRule(required('当前债务不能为空'))
      .addRule(isNumber('当前债务必须是数字'))
      .addRule(isNonNegative('当前债务不能为负数'))
  };
};

/**
 * 游戏状态验证器
 */
export const createGameStateValidator = () => {
  return {
    playerName: createValidator()
      .addRule(required('玩家名称不能为空'))
      .addRule(validPlayerName()),
    
    currentWeek: createValidator()
      .addRule(required('当前周次不能为空'))
      .addRule(isNumber('当前周次必须是数字'))
      .addRule(validWeek()),
    
    maxWeeks: createValidator()
      .addRule(required('最大周次不能为空'))
      .addRule(isNumber('最大周次必须是数字'))
      .addRule(inRange(1, 999, '最大周次必须在1到999之间'))
  };
};

// ==================== 验证工具函数 ====================

/**
 * 快速验证函数
 */
export function validate(value: any, ...rules: ValidationRule[]): ValidationResult {
  const validator = createValidator();
  rules.forEach(rule => validator.addRule(rule));
  return validator.validate(value);
}

/**
 * 验证对象的多个字段
 */
export function validateObject(
  obj: Record<string, any>, 
  validators: Record<string, Validator>
): Record<string, ValidationResult> {
  const results: Record<string, ValidationResult> = {};
  
  for (const [key, validator] of Object.entries(validators)) {
    results[key] = validator.validate(obj[key]);
  }
  
  return results;
}

/**
 * 检查验证结果是否全部通过
 */
export function isAllValid(results: Record<string, ValidationResult>): boolean {
  return Object.values(results).every(result => result.isValid);
}

/**
 * 收集所有验证错误
 */
export function collectErrors(results: Record<string, ValidationResult>): string[] {
  const errors: string[] = [];
  
  for (const [key, result] of Object.entries(results)) {
    if (!result.isValid) {
      errors.push(...result.errors.map(error => `${key}: ${error}`));
    }
  }
  
  return errors;
}