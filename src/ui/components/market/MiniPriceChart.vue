<template>
  <div class="mini-price-chart" :style="{ height: `${height}px` }">
    <svg :width="width" :height="height" viewBox="0 0 100 30" preserveAspectRatio="none">
      <!-- 价格曲线 -->
      <polyline 
        :points="chartPoints" 
        class="price-line" 
        fill="none" 
      />
      
      <!-- 最新价格点 -->
      <circle 
        v-if="chartPointsArray.length > 0"
        :cx="chartPointsArray[chartPointsArray.length - 1].x" 
        :cy="chartPointsArray[chartPointsArray.length - 1].y" 
        r="1.5" 
        class="latest-price-point" 
      />
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  history: {
    type: Array,
    default: () => []
  },
  width: {
    type: Number,
    default: 100
  },
  height: {
    type: Number,
    default: 30
  }
});

// 计算实际使用的最小和最大价格
const minPrice = computed(() => {
  if (props.history.length === 0) return 0;
  return Math.min(...props.history);
});

const maxPrice = computed(() => {
  if (props.history.length === 0) return 100;
  return Math.max(...props.history);
});

// 将价格归一化到0-30范围
function normalizePrice(price) {
  const min = minPrice.value;
  const max = maxPrice.value;
  if (max === min) return 15; // 避免除以零
  return ((price - min) / (max - min)) * 30;
}

// 生成图表点
const chartPointsArray = computed(() => {
  if (props.history.length < 2) return [];
  
  const points = [];
  const step = 100 / (props.history.length - 1);
  
  props.history.forEach((price, index) => {
    const x = index * step;
    const y = 30 - normalizePrice(price);
    points.push({ x, y });
  });
  
  return points;
});

// 生成SVG点字符串
const chartPoints = computed(() => {
  return chartPointsArray.value.map(point => `${point.x},${point.y}`).join(' ');
});

// 确定图表颜色
const chartColor = computed(() => {
  if (props.history.length < 2) return '#6c757d';
  
  const firstPrice = props.history[0];
  const lastPrice = props.history[props.history.length - 1];
  
  if (lastPrice > firstPrice) return '#28a745';
  if (lastPrice < firstPrice) return '#dc3545';
  return '#6c757d';
});
</script>

<style scoped>
.mini-price-chart {
  width: 100%;
  overflow: hidden;
}

svg {
  display: block;
  width: 100%;
}

.price-line {
  stroke: #4a6fa5;
  stroke-width: 1;
}

.latest-price-point {
  fill: #fd7e14;
}
</style> 