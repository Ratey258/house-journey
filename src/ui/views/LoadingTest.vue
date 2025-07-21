<template>
  <div class="loading-test">
    <GameLoader 
      :title="'测试加载动画'" 
      :status="loadingStatus"
      :progress="progress"
      @complete="onComplete"
    />
    
    <div v-if="!isLoading" class="test-complete">
      <h1>加载测试完成</h1>
      <button @click="router.push('/')">返回主菜单</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import GameLoader from '@/ui/components/common/GameLoader.vue';

const router = useRouter();
const isLoading = ref(true);
const loadingStatus = ref('测试加载中...');
const progress = ref(0);

function onComplete() {
  isLoading.value = false;
}

// 模拟加载过程
onMounted(() => {
  const steps = [
    '初始化测试环境...',
    '加载测试数据...',
    '处理测试资源...',
    '准备测试结果...',
    '完成测试加载'
  ];
  
  let currentStep = 0;
  const interval = setInterval(() => {
    if (currentStep < steps.length) {
      loadingStatus.value = steps[currentStep];
      progress.value = Math.min(100, (currentStep + 1) * 20);
      currentStep++;
    } else {
      clearInterval(interval);
    }
  }, 1000);
});
</script>

<style scoped>
.loading-test {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.test-complete {
  text-align: center;
  padding: 20px;
}

.test-complete h1 {
  margin-bottom: 20px;
  color: #2c3e50;
}

.test-complete button {
  padding: 10px 20px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.test-complete button:hover {
  background-color: #2980b9;
}
</style> 