<!-- 
  卡片组件
  遵循UI设计规范中的卡片设计
-->
<template>
  <div 
    :class="[
      'game-card',
      { 
        'card-hoverable': hoverable, 
        'card-elevated': elevated,
        [`border-${borderColor}`]: borderColor
      }
    ]"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div v-if="$slots.header || title" class="card-header">
      <slot name="header">
        <h3 class="card-title">{{ title }}</h3>
      </slot>
    </div>
    <div class="card-content">
      <slot></slot>
    </div>
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  hoverable: {
    type: Boolean,
    default: false
  },
  elevated: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  borderColor: {
    type: String,
    validator: (value) => ['primary', 'success', 'warning', 'danger', 'info'].includes(value) || !value,
    default: ''
  }
});

const handleMouseEnter = () => {
  // 鼠标悬停效果可以在此处理
};

const handleMouseLeave = () => {
  // 鼠标离开效果可以在此处理
};
</script>

<style scoped>
.game-card {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--color-gray-200);
  transition: all var(--transition-normal) var(--ease-default);
}

.card-hoverable:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.card-elevated {
  box-shadow: var(--shadow-md);
}

.card-header {
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-gray-200);
}

.card-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  margin: 0;
}

.card-content {
  padding: var(--space-4);
}

.card-footer {
  padding: var(--space-4);
  border-top: 1px solid var(--color-gray-200);
  background-color: var(--color-gray-100);
}

/* 边框颜色变体 */
.border-primary {
  border-top: 3px solid var(--color-brand-blue);
}

.border-success {
  border-top: 3px solid var(--color-success-green);
}

.border-warning {
  border-top: 3px solid var(--color-warning-orange);
}

.border-danger {
  border-top: 3px solid var(--color-error-red);
}

.border-info {
  border-top: 3px solid var(--color-info-blue);
}
</style> 