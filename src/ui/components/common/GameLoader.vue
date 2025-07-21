<template>
  <div class="game-loader" v-if="visible">
    <div class="loader-container">
      <div class="loader-content">
        <h2 class="loader-title">{{ title || '正在加载游戏' }}</h2>
        
        <div class="loader-animation">
          <div class="spinner"></div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
          </div>
        </div>
        
        <div class="loader-status">{{ status || '加载中...' }}</div>
        
        <div class="loader-tip">{{ currentTip }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: true
  },
  title: {
    type: String,
    default: '正在加载游戏'
  },
  status: {
    type: String,
    default: '加载中...'
  },
  progress: {
    type: Number,
    default: 0
  },
  autoProgress: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['update:progress', 'complete']);

// 加载提示
const tips = [
  "游戏提示：低买高卖是致富的关键！",
  "游戏提示：关注市场趋势，把握最佳交易时机",
  "游戏提示：不同地区的商品价格有差异，可以利用这一点赚取差价",
  "游戏提示：随时关注你的资金状况，避免破产",
  "游戏提示：购买房产是游戏的最终目标",
  "游戏提示：每周市场价格都会变动，要把握时机",
  "游戏提示：注意债务利息，不要让债务超过你的承受能力",
  "游戏提示：特色商品通常有更高的利润空间",
  "游戏提示：随机事件可能带来意外收获或损失",
  "游戏提示：合理规划你的库存容量"
];

const currentTip = ref(tips[0]);
const internalProgress = ref(props.progress);
let tipInterval = null;
let progressInterval = null;

// 自动更新提示
function startTipRotation() {
  let tipIndex = 0;
  tipInterval = setInterval(() => {
    tipIndex = (tipIndex + 1) % tips.length;
    currentTip.value = tips[tipIndex];
  }, 3000);
}

// 自动更新进度
function startProgressAnimation() {
  if (!props.autoProgress) return;
  
  let step = 0;
  progressInterval = setInterval(() => {
    if (internalProgress.value < 100) {
      // 非线性进度增长，开始快，接近100%时变慢
      step = step + 0.2;
      const increment = Math.max(0.1, (100 - internalProgress.value) / 50);
      internalProgress.value = Math.min(99, internalProgress.value + increment);
      emit('update:progress', internalProgress.value);
    } else {
      clearInterval(progressInterval);
      emit('complete');
    }
  }, 100);
}

// 监听外部进度变化
watch(() => props.progress, (newProgress) => {
  internalProgress.value = newProgress;
  if (newProgress >= 100) {
    clearInterval(progressInterval);
    emit('complete');
  }
});

// 组件挂载时
onMounted(() => {
  startTipRotation();
  if (props.autoProgress) {
    startProgressAnimation();
  }
});

// 组件卸载时
onUnmounted(() => {
  clearInterval(tipInterval);
  clearInterval(progressInterval);
});
</script>

<style scoped>
.game-loader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d);
  background-size: 400% 400%;
  animation: gradient 15s ease infinite;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loader-container {
  width: 80%;
  max-width: 500px;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  color: white;
  text-align: center;
}

.loader-title {
  font-size: 24px;
  margin-bottom: 20px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.loader-animation {
  margin: 20px 0;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #3498db;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin: 10px 0;
}

.progress-fill {
  height: 100%;
  background-color: #3498db;
  background-image: linear-gradient(45deg, rgba(255, 255, 255, .15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, .15) 50%, rgba(255, 255, 255, .15) 75%, transparent 75%, transparent);
  background-size: 20px 20px;
  animation: progressbar-stripes 1s linear infinite;
  transition: width 0.3s ease;
}

.loader-status {
  font-size: 16px;
  margin: 10px 0;
}

.loader-tip {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 20px;
  min-height: 40px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes progressbar-stripes {
  from { background-position: 0 0; }
  to { background-position: 20px 0; }
}
</style> 