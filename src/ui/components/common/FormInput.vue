<!-- 
  输入框组件
  遵循UI设计规范中的表单控件设计
-->
<template>
  <div class="input-wrapper">
    <label v-if="label" :for="id" class="input-label">{{ label }}</label>
    <div class="input-container" :class="{ 'input-focused': focused }">
      <i v-if="leftIcon" :class="['input-icon', 'left-icon', `icon-${leftIcon}`]"></i>
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :class="['form-input', { 'has-left-icon': leftIcon, 'has-right-icon': rightIcon, 'input-error': error }]"
        @input="$emit('update:modelValue', $event.target.value)"
        @focus="handleFocus"
        @blur="handleBlur"
        ref="inputRef"
      >
      <i 
        v-if="rightIcon || (clearable && modelValue)" 
        :class="['input-icon', 'right-icon', clearable && modelValue ? 'icon-close' : `icon-${rightIcon}`]"
        @click="clearInput"
      ></i>
    </div>
    <p v-if="error" class="input-error-message">{{ error }}</p>
    <p v-else-if="hint" class="input-hint">{{ hint }}</p>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue';

const props = defineProps({
  id: String,
  label: String,
  modelValue: {
    type: [String, Number],
    default: ''
  },
  type: {
    type: String,
    default: 'text'
  },
  placeholder: String,
  hint: String,
  error: String,
  leftIcon: String,
  rightIcon: String,
  disabled: Boolean,
  readonly: Boolean,
  clearable: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'focus', 'blur', 'clear']);

const focused = ref(false);
const inputRef = ref(null);

// 获取焦点
const handleFocus = (event) => {
  focused.value = true;
  emit('focus', event);
};

// 失去焦点
const handleBlur = (event) => {
  focused.value = false;
  emit('blur', event);
};

// 清除输入内容
const clearInput = () => {
  if (props.clearable && props.modelValue) {
    emit('update:modelValue', '');
    emit('clear');
    // 让输入框重新获取焦点
    inputRef.value?.focus();
  }
};
</script>

<style scoped>
.input-wrapper {
  margin-bottom: var(--space-4);
  width: 100%;
}

.input-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--space-2);
  color: var(--color-gray-500);
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.input-focused {
  color: var(--color-brand-blue);
}

.form-input {
  width: 100%;
  height: 40px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-gray-300);
  font-size: var(--font-size-md);
  color: var(--color-dark-gray);
  background-color: var(--color-white);
  transition: all var(--transition-fast) var(--ease-default);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-brand-blue);
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
}

.form-input::placeholder {
  color: var(--color-gray-300);
}

.form-input.has-left-icon {
  padding-left: var(--space-6);
}

.form-input.has-right-icon {
  padding-right: var(--space-6);
}

.form-input.input-error {
  border-color: var(--color-error-red);
}

.form-input.input-error:focus {
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.2);
}

.input-icon {
  position: absolute;
  font-size: var(--font-size-md);
  color: var(--color-gray-400);
  cursor: pointer;
  transition: color var(--transition-fast) var(--ease-default);
}

.input-icon:hover {
  color: var(--color-gray-500);
}

.left-icon {
  left: var(--space-3);
}

.right-icon {
  right: var(--space-3);
}

.input-error-message {
  margin-top: var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--color-error-red);
}

.input-hint {
  margin-top: var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--color-gray-400);
}

/* 禁用状态 */
.form-input:disabled {
  background-color: var(--color-gray-100);
  cursor: not-allowed;
  opacity: 0.7;
}

/* 只读状态 */
.form-input:read-only {
  background-color: var(--color-gray-100);
  cursor: default;
}

/* 图标替代 */
.icon-close:before {
  content: "✕";
}
</style> 