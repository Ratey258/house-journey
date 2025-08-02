<template>
  <div class="lottie-loader-container" :class="{ 'fade-out': isFadingOut }">
    <div class="lottie-animation-container" ref="lottieContainer"></div>
    <div class="loading-content">
      <h2 v-if="title" class="loading-title">{{ title }}</h2>
      <div class="loading-status">{{ status }}</div>
      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
        </div>
        <div class="progress-text">{{ progress }}%</div>
      </div>
      <div class="loading-tips" v-if="tips.length > 0">
        <div class="tip-content">{{ currentTip }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import loadingAnimationData from './loadingAnimationData.js';

// 定义组件属性
const props = defineProps({
  title: {
    type: String,
    default: '正在加载'
  },
  status: {
    type: String,
    default: '加载中...'
  },
  progress: {
    type: Number,
    default: 0
  },
  tips: {
    type: Array,
    default: () => [
      '正在加载游戏资源...',
      '初始化市场数据...',
      '准备房产信息...',
      '生成游戏事件...',
      '加载游戏界面...',
      '游戏即将开始...'
    ]
  }
});

// 定义事件
const emit = defineEmits(['complete']);

// 组件状态
const lottieContainer = ref(null);
const lottieAnimation = ref(null);
const currentTipIndex = ref(0);
const currentTip = computed(() => props.tips[currentTipIndex.value]);
const isFadingOut = ref(false);

// 监听进度变化
watch(() => props.progress, (newProgress) => {
  if (newProgress >= 100) {
    completeLoading();
  }
});

// 切换提示
let tipInterval = null;
const startTipRotation = () => {
  tipInterval = setInterval(() => {
    currentTipIndex.value = (currentTipIndex.value + 1) % props.tips.length;
  }, 3000);
};

// 完成加载
const completeLoading = () => {
  isFadingOut.value = true;
  setTimeout(() => {
    emit('complete');
  }, 1000);
};

// 组件挂载时
onMounted(() => {
  // 动态加载 Lottie 脚本
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js';
  script.async = true;
  
  script.onload = () => {
    // 脚本加载完成后初始化动画
    if (window.lottie && lottieContainer.value) {
      // 使用内嵌的加载动画数据
      lottieAnimation.value = window.lottie.loadAnimation({
        container: lottieContainer.value,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: loadingAnimationData // 使用内嵌动画数据
      });
    }
  };
  
  document.head.appendChild(script);
  
  // 开始提示轮换
  startTipRotation();
});

// 组件销毁前
onBeforeUnmount(() => {
  // 清除定时器
  if (tipInterval) {
    clearInterval(tipInterval);
  }
  
  // 销毁动画
  if (lottieAnimation.value) {
    lottieAnimation.value.destroy();
  }
});
</script>

<style scoped>
.lottie-loader-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #1a1a2e;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  transition: opacity 0.5s ease;
}

.lottie-loader-container.fade-out {
  opacity: 0;
}

.lottie-animation-container {
  width: 200px;
  height: 200px;
  margin-bottom: 20px;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #fff;
  width: 80%;
  max-width: 500px;
}

.loading-title {
  font-size: 24px;
  margin-bottom: 10px;
  color: #4cc9f0;
}

.loading-status {
  font-size: 16px;
  margin-bottom: 15px;
}

.progress-container {
  width: 100%;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.progress-bar {
  width: 100%;
  height: 10px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 5px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4361ee, #4cc9f0);
  border-radius: 5px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 14px;
  color: #f1faee;
}

.loading-tips {
  margin-top: 20px;
  text-align: center;
  font-style: italic;
  color: #a8dadc;
  min-height: 20px;
}

.tip-content {
  animation: fadeInOut 3s ease infinite;
}

@keyframes fadeInOut {
  0% { opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { opacity: 0; }
}
</style> 