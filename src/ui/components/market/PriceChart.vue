<!--
  价格图表组件
  使用ECharts展示商品价格趋势
-->
<template>
  <div class="price-chart-container" :class="{ 'is-mini': mini }">
    <div v-if="!mini" class="chart-controls">
      <div class="time-range-selector">
        <el-radio-group v-model="selectedRange" size="small">
          <el-radio-button v-for="range in timeRanges" :key="range.value" :label="range.value">
            {{ range.label }}
          </el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <div class="chart-wrapper" ref="chartRef"></div>

    <div v-if="!mini && showLegend" class="chart-legend">
      <div class="legend-item">
        <span class="color-dot buy"></span>
        <span>购入价</span>
      </div>
      <div class="legend-item">
        <span class="color-dot current"></span>
        <span>当前价</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, inject, computed } from 'vue';
import { useElementSize } from '@vueuse/core';

// 从插件中注入echarts
const echarts = inject('echarts');

// 定义组件属性
const props = defineProps({
  // 价格历史数据
  priceHistory: {
    type: Array,
    default: () => []
  },
  // 购买价格（可选）
  buyPrice: {
    type: Number,
    default: null
  },
  // 是否为迷你图表
  mini: {
    type: Boolean,
    default: false
  },
  // 是否显示图例
  showLegend: {
    type: Boolean,
    default: true
  },
  // 图表高度
  height: {
    type: [Number, String],
    default: null
  },
  // 图表宽度（为空则自适应）
  width: {
    type: [Number, String],
    default: null
  },
  // 图表主题色
  color: {
    type: String,
    default: '#3498DB'
  }
});

// Vue 3.5 新特性：类型安全的模板引用
const chartRef = useTemplateRef('chartContainer');
// 图表实例
let chartInstance = null;

// 时间范围选项
const timeRanges = [
  { label: '7天', value: 7 },
  { label: '14天', value: 14 },
  { label: '30天', value: 30 },
  { label: '全部', value: 'all' }
];

// 当前选择的时间范围
const selectedRange = ref(7);

// 监听元素大小变化
const { width: containerWidth, height: containerHeight } = useElementSize(chartRef);

// 计算图表高度
const chartHeight = computed(() => {
  return props.height || (props.mini ? 60 : 300);
});

// 计算处理后的数据
const processedData = computed(() => {
  if (!props.priceHistory || props.priceHistory.length === 0) {
    return {
      dates: [],
      prices: []
    };
  }

  let filteredData = [...props.priceHistory];

  // 根据选择的时间范围过滤数据
  if (selectedRange.value !== 'all' && filteredData.length > selectedRange.value) {
    filteredData = filteredData.slice(-selectedRange.value);
  }

  // 提取日期和价格
  const dates = filteredData.map(item => item.date);
  const prices = filteredData.map(item => item.price);

  return { dates, prices };
});

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return;

  // 创建图表实例
  chartInstance = echarts.init(chartRef.value, 'buyHouseTheme');

  // 更新图表
  updateChart();

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize);
};

// 更新图表数据和配置
const updateChart = () => {
  if (!chartInstance) return;

  const { dates, prices } = processedData.value;

  // 图表配置
  const option = {
    grid: {
      left: props.mini ? '3%' : '3%',
      right: props.mini ? '3%' : '4%',
      top: props.mini ? '5%' : '8%',
      bottom: props.mini ? '3%' : '8%',
      containLabel: !props.mini
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        const price = params[0].value;
        let result = `${params[0].axisValue}<br/>价格: ${price.toFixed(2)}`;

        // 如果有购买价格，显示差价
        if (props.buyPrice !== null) {
          const diff = price - props.buyPrice;
          const diffPercentage = ((diff / props.buyPrice) * 100).toFixed(2);
          const diffColor = diff >= 0 ? '#2ECC71' : '#E74C3C';
          const diffSign = diff >= 0 ? '+' : '';

          result += `<br/><span style="color:${diffColor}">差价: ${diffSign}${diff.toFixed(2)} (${diffSign}${diffPercentage}%)</span>`;
        }

        return result;
      }
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        show: !props.mini
      },
      axisLine: {
        show: !props.mini
      },
      axisTick: {
        show: !props.mini
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        show: !props.mini
      },
      axisLine: {
        show: !props.mini
      },
      axisTick: {
        show: !props.mini
      },
      splitLine: {
        show: !props.mini
      }
    },
    series: [
      {
        name: '价格',
        type: 'line',
        data: prices,
        smooth: true,
        symbol: props.mini ? 'none' : 'circle',
        symbolSize: 6,
        itemStyle: {
          color: props.color
        },
        lineStyle: {
          width: props.mini ? 2 : 3,
          color: props.color
        },
        areaStyle: props.mini ? {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: props.color + '50' },
              { offset: 1, color: props.color + '10' }
            ]
          }
        } : null
      }
    ]
  };

  // 如果有购买价格，添加水平参考线
  if (props.buyPrice !== null && !props.mini) {
    option.series.push({
      name: '购买价',
      type: 'line',
      data: Array(dates.length).fill(props.buyPrice),
      lineStyle: {
        type: 'dashed',
        width: 1,
        color: '#E67E22'
      },
      symbol: 'none'
    });
  }

  // 设置图表配置
  chartInstance.setOption(option);
};

// 处理窗口大小变化
const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize();
  }
};

// 监听数据变化
watch(() => props.priceHistory, updateChart, { deep: true });
watch(() => props.buyPrice, updateChart);
watch(selectedRange, updateChart);
watch([containerWidth, containerHeight], handleResize);

// 组件挂载时初始化图表
onMounted(() => {
  initChart();
});

// 组件卸载前清理资源
onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.price-chart-container {
  width: 100%;
  height: v-bind('`${chartHeight}px`');
  display: flex;
  flex-direction: column;
}

.chart-controls {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.chart-wrapper {
  flex: 1;
  min-height: 0;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 8px;
  font-size: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.color-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.color-dot.buy {
  background-color: #E67E22;
}

.color-dot.current {
  background-color: v-bind('props.color');
}

.is-mini .chart-wrapper {
  height: 60px;
}
</style>
