/**
 * 验证器工具函数
 * 提供常用的数据验证功能
 */

import type { ValidationResult, ValidationError } from '../../types';

// === 基础验证函数 ===

/**
 * 验证必填
 */
export function required(value: any, message: string = '此字段为必填项'): ValidationResult {
  const isValid = value !== null && value !== undefined && value !== '';
  
  return {
    valid: isValid,
    errors: isValid ? [] : [{ field: '', message, code: 'required' }]
  };
}

/**
 * 验证最小长度
 */
export function minLength(value: string, min: number, message?: string): ValidationResult {
  const isValid = value && value.length >= min;
  const defaultMessage = `最少需要${min}个字符`;
  
  return {
    valid: isValid,
    errors: isValid ? [] : [{ field: '', message: message || defaultMessage, code: 'minLength' }]
  };
}

/**
 * 验证最大长度
 */
export function maxLength(value: string, max: number, message?: string): ValidationResult {
  const isValid = !value || value.length <= max;
  const defaultMessage = `最多允许${max}个字符`;
  
  return {
    valid: isValid,
    errors: isValid ? [] : [{ field: '', message: message || defaultMessage, code: 'maxLength' }]
  };
}

/**
 * 验证长度范围
 */
export function lengthRange(value: string, min: number, max: number, message?: string): ValidationResult {
  if (!value) return { valid: true, errors: [] };
  
  const isValid = value.length >= min && value.length <= max;
  const defaultMessage = `长度必须在${min}-${max}个字符之间`;
  
  return {
    valid: isValid,
    errors: isValid ? [] : [{ field: '', message: message || defaultMessage, code: 'lengthRange' }]
  };
}

/**
 * 验证最小值
 */
export function minValue(value: number, min: number, message?: string): ValidationResult {
  const isValid = value >= min;
  const defaultMessage = `值不能小于${min}`;
  
  return {
    valid: isValid,
    errors: isValid ? [] : [{ field: '', message: message || defaultMessage, code: 'minValue' }]
  };
}

/**
 * 验证最大值
 */
export function maxValue(value: number, max: number, message?: string): ValidationResult {
  const isValid = value <= max;
  const defaultMessage = `值不能大于${max}`;
  
  return {
    valid: isValid,
    errors: isValid ? [] : [{ field: '', message: message || defaultMessage, code: 'maxValue' }]
  };
}

/**
 * 验证数值范围
 */
export function valueRange(value: number, min: number, max: number, message?: string): ValidationResult {
  const isValid = value >= min && value <= max;
  const defaultMessage = `值必须在${min}-${max}之间`;
  
  return {
    valid: isValid,
    errors: isValid ? [] : [{ field: '', message: message || defaultMessage, code: 'valueRange' }]
  };
}

/**
 * 验证正则表达式
 */
export function pattern(value: string, regex: RegExp, message: string = '格式不正确'): ValidationResult {
  const isValid = !value || regex.test(value);
  
  return {
    valid: isValid,
    errors: isValid ? [] : [{ field: '', message, code: 'pattern' }]
  };
}

// === 特定类型验证函数 ===

/**
 * 验证邮箱
 */
export function email(value: string, message: string = '邮箱格式不正确'): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern(value, emailRegex, message);
}

/**
 * 验证手机号（中国大陆）
 */
export function phone(value: string, message: string = '手机号格式不正确'): ValidationResult {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return pattern(value, phoneRegex, message);
}

/**
 * 验证身份证号（中国大陆）
 */
export function idCard(value: string, message: string = '身份证号格式不正确'): ValidationResult {
  const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
  
  if (!value || !idCardRegex.test(value)) {
    return {
      valid: false,
      errors: [{ field: '', message, code: 'idCard' }]
    };
  }
  
  // 验证校验码
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
  
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(value[i]) * weights[i];
  }
  
  const checkCode = checkCodes[sum % 11];
  const isValid = value[17].toUpperCase() === checkCode;
  
  return {
    valid: isValid,
    errors: isValid ? [] : [{ field: '', message, code: 'idCard' }]
  };
}

/**
 * 验证URL
 */
export function url(value: string, message: string = 'URL格式不正确'): ValidationResult {
  if (!value) return { valid: true, errors: [] };
  
  try {
    new URL(value);
    return { valid: true, errors: [] };
  } catch {
    return {
      valid: false,
      errors: [{ field: '', message, code: 'url' }]
    };
  }
}

/**
 * 验证IP地址
 */
export function ip(value: string, message: string = 'IP地址格式不正确'): ValidationResult {
  const ipRegex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return pattern(value, ipRegex, message);
}

/**
 * 验证密码强度
 */
export function strongPassword(value: string, message?: string): ValidationResult {
  if (!value) return { valid: true, errors: [] };
  
  const errors: ValidationError[] = [];
  
  if (value.length < 8) {
    errors.push({ field: '', message: '密码长度至少8位', code: 'passwordLength' });
  }
  
  if (!/[a-z]/.test(value)) {
    errors.push({ field: '', message: '密码必须包含小写字母', code: 'passwordLowercase' });
  }
  
  if (!/[A-Z]/.test(value)) {
    errors.push({ field: '', message: '密码必须包含大写字母', code: 'passwordUppercase' });
  }
  
  if (!/\d/.test(value)) {
    errors.push({ field: '', message: '密码必须包含数字', code: 'passwordNumber' });
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
    errors.push({ field: '', message: '密码必须包含特殊字符', code: 'passwordSpecial' });
  }
  
  const isValid = errors.length === 0;
  
  if (!isValid && message) {
    return {
      valid: false,
      errors: [{ field: '', message, code: 'strongPassword' }]
    };
  }
  
  return { valid: isValid, errors };
}

/**
 * 验证日期
 */
export function date(value: string, message: string = '日期格式不正确'): ValidationResult {
  if (!value) return { valid: true, errors: [] };
  
  const dateObj = new Date(value);
  const isValid = !isNaN(dateObj.getTime());
  
  return {
    valid: isValid,
    errors: isValid ? [] : [{ field: '', message, code: 'date' }]
  };
}

/**
 * 验证数字
 */
export function numeric(value: string, message: string = '必须是数字'): ValidationResult {
  if (!value) return { valid: true, errors: [] };
  
  const isValid = !isNaN(Number(value));
  
  return {
    valid: isValid,
    errors: isValid ? [] : [{ field: '', message, code: 'numeric' }]
  };
}

/**
 * 验证整数
 */
export function integer(value: string, message: string = '必须是整数'): ValidationResult {
  if (!value) return { valid: true, errors: [] };
  
  const num = Number(value);
  const isValid = !isNaN(num) && Number.isInteger(num);
  
  return {
    valid: isValid,
    errors: isValid ? [] : [{ field: '', message, code: 'integer' }]
  };
}

/**
 * 验证正数
 */
export function positive(value: number, message: string = '必须是正数'): ValidationResult {
  const isValid = value > 0;
  
  return {
    valid: isValid,
    errors: isValid ? [] : [{ field: '', message, code: 'positive' }]
  };
}

/**
 * 验证非负数
 */
export function nonNegative(value: number, message: string = '不能是负数'): ValidationResult {
  const isValid = value >= 0;
  
  return {
    valid: isValid,
    errors: isValid ? [] : [{ field: '', message, code: 'nonNegative' }]
  };
}

// === 组合验证器 ===

/**
 * 验证器组合函数
 */
export function combine(...validators: ((value: any) => ValidationResult)[]): (value: any) => ValidationResult {
  return (value: any) => {
    const allErrors: ValidationError[] = [];
    
    for (const validator of validators) {
      const result = validator(value);
      if (!result.valid) {
        allErrors.push(...result.errors);
      }
    }
    
    return {
      valid: allErrors.length === 0,
      errors: allErrors
    };
  };
}

/**
 * 创建自定义验证器
 */
export function custom(
  predicate: (value: any) => boolean,
  message: string,
  code: string = 'custom'
): (value: any) => ValidationResult {
  return (value: any) => {
    const isValid = predicate(value);
    
    return {
      valid: isValid,
      errors: isValid ? [] : [{ field: '', message, code }]
    };
  };
}

/**
 * 条件验证器
 */
export function when(
  condition: (value: any) => boolean,
  validator: (value: any) => ValidationResult
): (value: any) => ValidationResult {
  return (value: any) => {
    if (!condition(value)) {
      return { valid: true, errors: [] };
    }
    
    return validator(value);
  };
}

// === 表单验证器 ===

/**
 * 验证表单对象
 */
export function validateForm<T extends Record<string, any>>(
  data: T,
  rules: Record<keyof T, ((value: any) => ValidationResult)[]>
): ValidationResult<T> {
  const errors: ValidationError[] = [];
  
  for (const [field, validators] of Object.entries(rules)) {
    const value = data[field];
    
    for (const validator of validators) {
      const result = validator(value);
      
      if (!result.valid) {
        errors.push(...result.errors.map(error => ({
          ...error,
          field: field as string
        })));
        break; // 一个字段遇到错误就停止验证该字段
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? data : undefined
  };
}

// === 异步验证器 ===

/**
 * 异步验证函数类型
 */
export type AsyncValidator = (value: any) => Promise<ValidationResult>;

/**
 * 异步验证组合
 */
export async function combineAsync(...validators: AsyncValidator[]): Promise<AsyncValidator> {
  return async (value: any) => {
    const allErrors: ValidationError[] = [];
    
    for (const validator of validators) {
      const result = await validator(value);
      if (!result.valid) {
        allErrors.push(...result.errors);
      }
    }
    
    return {
      valid: allErrors.length === 0,
      errors: allErrors
    };
  };
}

/**
 * 创建防抖验证器
 */
export function debounceValidator(
  validator: AsyncValidator,
  delay: number = 300
): AsyncValidator {
  let timeoutId: NodeJS.Timeout;
  
  return (value: any) => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(async () => {
        const result = await validator(value);
        resolve(result);
      }, delay);
    });
  };
}