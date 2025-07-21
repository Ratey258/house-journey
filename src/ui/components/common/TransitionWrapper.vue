<template>
  <transition 
    :name="transitionName" 
    :mode="mode"
    :duration="duration"
    v-bind="$attrs"
    v-on="$listeners"
  >
    <slot></slot>
  </transition>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  transitionName: {
    type: String,
    default: 'fade'
  },
  mode: {
    type: String,
    default: 'out-in'
  },
  duration: {
    type: [Number, Object],
    default: 300
  }
});
</script>

<style scoped>
/* 淡入淡出过渡 */
.fade-enter-active, .fade-leave-active {
  transition: opacity var(--transition-duration, 300ms) ease;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}

/* 滑动过渡 */
.slide-enter-active, .slide-leave-active {
  transition: transform var(--transition-duration, 300ms) ease, opacity var(--transition-duration, 300ms) ease;
}
.slide-enter, .slide-leave-to {
  transform: translateY(20px);
  opacity: 0;
}

/* 缩放过渡 */
.scale-enter-active, .scale-leave-active {
  transition: transform var(--transition-duration, 300ms) ease, opacity var(--transition-duration, 300ms) ease;
}
.scale-enter, .scale-leave-to {
  transform: scale(0.9);
  opacity: 0;
}

/* 侧滑过渡 */
.slide-right-enter-active, .slide-right-leave-active {
  transition: transform var(--transition-duration, 300ms) ease, opacity var(--transition-duration, 300ms) ease;
}
.slide-right-enter, .slide-right-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}

.slide-left-enter-active, .slide-left-leave-active {
  transition: transform var(--transition-duration, 300ms) ease, opacity var(--transition-duration, 300ms) ease;
}
.slide-left-enter, .slide-left-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style> 