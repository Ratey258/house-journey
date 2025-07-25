<template>
  <div v-show="showModal" class="event-modal-container">
    <!-- 事件模态框 -->
    <div class="event-modal-overlay" @click.self="handleOverlayClick">
      <div class="event-modal">
        <!-- 事件标题 -->
        <div class="event-header">
          <h2 class="event-title">{{ currentEvent?.title || '事件' }}</h2>
        </div>

        <!-- 事件内容 -->
        <div class="event-content">
          <p class="event-description">{{ currentEvent?.description }}</p>

          <!-- 事件图片 - 暂时禁用 -->
          <!-- <div v-if="eventImageUrl" class="event-image">
            <img :src="eventImageUrl" :alt="currentEvent?.title" />
          </div> -->
        </div>

        <!-- 事件选项 -->
        <div class="event-options">
          <div v-if="resultMessage" class="event-result">
            <p>{{ resultMessage }}</p>

            <!-- 添加效果显示区域 -->
            <div v-if="effectResults.length > 0" class="effect-results">
              <h3>效果变化:</h3>
              <div class="effect-list">
                <div v-for="(effect, index) in effectResults" :key="index"
                     :class="['effect-item', effect.type]">
                  <span v-if="effect.type === 'money'" class="effect-icon">
                    {{ effect.value > 0 ? '💰' : '💸' }}
                  </span>
                  <span v-else-if="effect.type === 'debt'" class="effect-icon">
                    {{ effect.value < 0 ? '📉' : '📈' }}
                  </span>
                  <span v-else-if="effect.type === 'capacity'" class="effect-icon">🎒</span>
                  <span v-else-if="effect.type === 'item_add'" class="effect-icon">📦</span>
                  <span v-else-if="effect.type === 'item_remove'" class="effect-icon">🗑️</span>
                  <span v-else-if="effect.type === 'market'" class="effect-icon">📊</span>
                  <span v-else-if="effect.type === 'attribute'" class="effect-icon">✨</span>
                  <span v-else class="effect-icon">🔄</span>

                  <span class="effect-description">
                    <template v-if="effect.type === 'money'">
                      {{ effect.value > 0 ? '获得金钱: ' : '支出金钱: ' }}{{ Math.abs(effect.value) }}元
                    </template>
                    <template v-else-if="effect.type === 'debt'">
                      {{ effect.value > 0 ? '增加债务: ' : '减少债务: ' }}{{ Math.abs(effect.value) }}元
                    </template>
                    <template v-else-if="effect.type === 'capacity'">
                      背包容量增加: {{ effect.value }}
                    </template>
                    <template v-else-if="effect.type === 'item_add'">
                      获得物品: {{ effect.productId }} x {{ effect.quantity }}
                    </template>
                    <template v-else-if="effect.type === 'item_remove'">
                      失去物品: {{ effect.productId }} x {{ effect.quantity }}
                    </template>
                    <template v-else-if="effect.type === 'market'">
                      市场变化: {{ getMarketEffectDescription(effect) }}
                    </template>
                    <template v-else-if="effect.type === 'attribute'">
                      {{ getAttributeDisplayName(effect.attribute) }}: {{ effect.oldValue }} → {{ effect.newValue }}
                    </template>
                    <template v-else>
                      {{ effect.type }}: {{ JSON.stringify(effect) }}
                    </template>
                  </span>
                </div>
              </div>
            </div>

            <button class="event-option-button" @click="hideModal">确定</button>
          </div>
          <div v-else-if="currentEvent?.options" class="event-option-list">
            <button
              v-for="option in currentEvent.options"
              :key="option.id"
              class="event-option-button"
              @click="selectOption(option)"
              :disabled="applyingEffects"
            >
              {{ option.text }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue';
import { useEventActions } from '@/stores/events';
import { useGameCoreStore } from '@/stores/gameCore';
import eventEmitter from '@/infrastructure/eventEmitter';
import { handleError, ErrorType, ErrorSeverity } from '@/infrastructure/utils/errorHandler';

// 事件状态
const currentEvent = ref(null);
const showModal = ref(false);
const selectedOption = ref(null);
const resultMessage = ref(null);
const applyingEffects = ref(false);
const eventHistory = ref([]);
const effectResults = ref([]); // 添加效果结果状态

// 游戏核心存储
const gameCore = useGameCoreStore();

// 事件操作
const eventActions = useEventActions();

// 音效
let eventSound = null;

// 组件挂载时
onMounted(() => {
  // 初始化音效
  try {
    // 使用相对路径加载音效，避免404错误
    eventSound = new Audio('./resources/assets/sounds/event.mp3');
    console.log('EventModal - 音效初始化成功');
  } catch (error) {
    console.warn('EventModal - 初始化音效失败:', error);
    // 创建一个空的音频对象，避免后续使用时出错
    eventSound = {
      play: () => console.log('EventModal - 使用空音效')
    };
  }

  // 强制检查模态框状态
  nextTick(() => {
    console.log('EventModal - 组件挂载完成，模态框状态:', showModal.value);
  });
});

// 处理资源路径的辅助函数
const resolveResourcePath = (url) => {
  if (!url) return null;

  // 如果是绝对路径，需要调整
  if (url.startsWith('/assets/')) {
    // 路径模式1：/assets/images/... -> ./resources/assets/images/...
    return url.replace(/^\/assets\//, './resources/assets/');
  } else if (url.startsWith('/resources/')) {
    // 路径模式2：/resources/assets/... -> ./resources/assets/...
    return url.replace(/^\/resources\//, './resources/');
  } else if (url.includes('/assets/images/')) {
    // 路径模式3：包含 /assets/images/ 但不是以 / 开头
    const matches = url.match(/\/assets\/images\/.*/);
    if (matches) {
      return `./resources${matches[0]}`;
    }
  }

  // 默认直接返回原路径
  return url;
};

// 计算属性：事件图片URL
const eventImageUrl = computed(() => {
  if (!currentEvent.value) return null;

  // 尝试从imageUrl属性获取
  if (currentEvent.value.imageUrl) {
    console.log('EventModal - 从imageUrl属性获取图片:', currentEvent.value.imageUrl);
    return resolveResourcePath(currentEvent.value.imageUrl);
  }

  // 尝试从事件对象的第9个参数获取
  const eventArray = Object.values(currentEvent.value);
  if (eventArray.length >= 9 && typeof eventArray[8] === 'string' && eventArray[8].includes('/assets/images/')) {
    console.log('EventModal - 从事件对象第9个参数获取图片:', eventArray[8]);
    return resolveResourcePath(eventArray[8]);
  }

  return null;
});

/**
 * 获取市场效果描述
 * @param {Object} effect 市场效果对象
 * @returns {string} 市场效果描述
 */
const getMarketEffectDescription = (effect) => {
  if (!effect || !effect.effect) return '未知市场变化';

  const marketEffect = effect.effect;
  const descriptions = [];

  if (marketEffect.globalPriceModifier) {
    const percentage = Math.round((marketEffect.globalPriceModifier - 1) * 100);
    if (percentage > 0) {
      descriptions.push(`全球价格上涨 ${percentage}%`);
    } else if (percentage < 0) {
      descriptions.push(`全球价格下跌 ${Math.abs(percentage)}%`);
    }
  }

  if (marketEffect.categoryModifiers) {
    for (const [category, modifier] of Object.entries(marketEffect.categoryModifiers)) {
      const percentage = Math.round((modifier - 1) * 100);
      if (percentage > 0) {
        descriptions.push(`${category}类别价格上涨 ${percentage}%`);
      } else if (percentage < 0) {
        descriptions.push(`${category}类别价格下跌 ${Math.abs(percentage)}%`);
      }
    }
  }

  if (marketEffect.productModifiers) {
    const productCount = Object.keys(marketEffect.productModifiers).length;
    descriptions.push(`影响 ${productCount} 个特定商品价格`);
  }

  // 添加持续时间描述
  if (marketEffect.duration) {
    const weeks = Math.round(marketEffect.duration / (86400 * 7)); // 秒转周
    descriptions.push(`持续 ${weeks} 周`);
  }

  return descriptions.join('，');
};

// 处理背景点击
const handleOverlayClick = () => {
  // 如果没有选项或只有一个确认选项，点击背景可以关闭
  if (!currentEvent.value.options || currentEvent.value.options.length === 0) {
    hideModal();
  }
};

/**
 * 显示事件模态框
 * @param {Object} event 要显示的事件对象
 */
const showEvent = (event) => {
  console.log('EventModal - 尝试显示事件:', event ? event.id : 'undefined');

  // 如果没有传入事件对象，则不执行任何操作
  if (!event) {
    console.warn('EventModal - 没有传入事件对象，无法显示事件');
    return;
  }

  try {
    console.log('EventModal - 显示事件:', event.id, event.title);
    console.log('EventModal - 事件详情:', {
      title: event.title,
      description: event.description,
      options: event.options ? event.options.length : 0,
      imageUrl: event.imageUrl, // 添加图片URL调试信息
      rawEvent: JSON.stringify(event) // 输出整个事件对象
    });

    // 确保事件对象有必要的属性
    if (!event.options || !Array.isArray(event.options) || event.options.length === 0) {
      console.warn('EventModal - 事件没有选项，添加默认选项');
      event.options = [
        {
          id: 'default_option',
          text: '确认',
          result: '你确认了这个事件。',
          effects: {}
        }
      ];
    }

    currentEvent.value = event;
    showModal.value = true;
    selectedOption.value = null;

    if (resultMessage.value) {
      resultMessage.value = null;
    }

    if (applyingEffects.value) {
      applyingEffects.value = false;
    }

    // 清空上次的效果结果
    effectResults.value = [];

    // 添加事件到历史记录
    if (event.id && !eventHistory.value.includes(event.id)) {
      eventHistory.value.push(event.id);
    }

    // 播放音效
    if (eventSound && eventSound.play && typeof eventSound.play === 'function') {
      eventSound.play();
    }

    // 发送显示事件的消息
    eventEmitter.emit('event:shown', { eventId: event.id });

    console.log('EventModal - 事件模态框已显示');

    // 调试信息：输出当前模态框状态
    console.log('EventModal - 模态框状态:', {
      showModal: showModal.value,
      currentEvent: currentEvent.value ? currentEvent.value.id : null,
      hasOptions: currentEvent.value && currentEvent.value.options ? currentEvent.value.options.length : 0
    });
  } catch (error) {
    console.error('EventModal - 显示事件时出错:', error);
  }
};

// 选择事件选项
const selectOption = (option) => {
  console.log('EventModal - 选择选项:', option);

  if (!option) {
    console.warn('EventModal - 无法选择选项: 选项对象为空');
    return;
  }

  try {
    // 标记正在应用效果
    applyingEffects.value = true;

    // 设置选中的选项
    selectedOption.value = option;

    // 显示结果消息
    resultMessage.value = option.result || '你做出了选择。';

    // 清空上次的效果结果
    effectResults.value = [];

    // 如果有事件操作模块，调用处理选项方法
    if (eventActions && typeof eventActions.handleEventOption === 'function') {
      console.log('EventModal - 调用事件操作模块处理选项');
      const result = eventActions.handleEventOption(option);
      console.log('EventModal - 选项处理结果:', result);

      // 处理效果结果
      if (result && result.appliedEffects) {
        // 过滤掉不需要显示的效果类型
        effectResults.value = result.appliedEffects.filter(effect =>
          effect.type !== 'next_event' &&
          effect.type !== 'location_change'
        );

        console.log('EventModal - 应用的效果:', effectResults.value);

        // 确保至少显示1秒的结果，即使没有效果
        if (effectResults.value.length === 0) {
          effectResults.value = [{
            type: 'info',
            description: '选项已执行'
          }];
        }
      } else {
        // 如果没有返回效果，添加一个默认效果
        effectResults.value = [{
          type: 'info',
          description: '选项已执行'
        }];
      }
    } else {
      console.warn('EventModal - 事件操作模块不可用，无法处理选项效果');
      // 添加一个默认效果
      effectResults.value = [{
        type: 'info',
        description: '选项已执行'
      }];
    }

    // 发送选项选择事件
    eventEmitter.emit('event:option_selected', {
      eventId: currentEvent.value?.id,
      optionId: option.id || option.text
    });

    // 延迟一段时间后允许关闭
    setTimeout(() => {
      applyingEffects.value = false;
    }, 1000);
  } catch (error) {
    console.error('EventModal - 处理选项时出错:', error);
    applyingEffects.value = false;
    resultMessage.value = '处理选项时出错，请稍后再试。';

    // 添加错误效果
    effectResults.value = [{
      type: 'error',
      description: '处理选项时出错'
    }];
  }
};

// 关闭事件
const hideModal = () => {
  showModal.value = false;
  currentEvent.value = {};
};

// 导出组件方法供父组件调用
defineExpose({
  showEvent,
  hideModal
});
</script>

<style scoped>
.event-modal-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  /* 移除背景模糊效果 */
  /* backdrop-filter: blur(3px); */
  padding: 20px; /* Add some padding for mobile screens */
}

.event-modal-overlay {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.event-modal {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 550px; /* 减小最大宽度 */
  position: relative;
  overflow: hidden;
  margin: 0 auto;
  max-height: 75vh; /* 减小最大高度 */
  display: flex;
  flex-direction: column;
}

.event-header {
  background-color: #4299e1;
  color: white;
  padding: 10px 15px; /* 减小内边距 */
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.event-title {
  margin: 0;
  font-size: 1.2rem; /* 减小字体大小 */
  font-weight: 600;
}

.event-type {
  position: absolute;
  top: -10px;
  right: 10px;
  background-color: #3182ce;
  color: white;
  font-size: 0.8rem;
  padding: 3px 8px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.event-content {
  padding: 10px 15px; /* 减小内边距 */
  flex: 1;
  overflow-y: auto;
  max-height: 40vh; /* 限制内容高度 */
}

.event-description {
  margin: 0 0 10px 0;
  font-size: 1rem;
  line-height: 1.5;
  color: #2d3748;
}

.event-image {
  width: 100%;
  margin: 10px 0; /* 减小外边距 */
  border-radius: 8px;
  overflow: hidden;
  max-height: 180px; /* 限制图片高度 */
}

.event-image img {
  width: 100%;
  height: auto;
  object-fit: cover;
  border-radius: 6px;
}

.event-options {
  padding: 10px 15px; /* 减小内边距 */
  background-color: #f7fafc;
  border-top: 1px solid #e2e8f0;
}

.event-option-list {
  display: flex;
  flex-direction: column;
  gap: 8px; /* 减小选项间距 */
}

.event-option-button {
  background-color: #ebf4ff;
  border: 1px solid #bee3f8;
  color: #3182ce;
  padding: 8px 12px; /* 减小内边距 */
  border-radius: 6px;
  font-size: 0.95rem; /* 减小字体大小 */
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  position: relative;
  transition: all 0.2s;
  width: 100%;
}

.event-option-button::after {
  content: '›';
  position: absolute;
  right: 15px;
  font-size: 1.5rem;
  opacity: 0.7;
  transition: transform 0.3s ease;
}

.event-option-button:hover {
  background-color: #3a7bc8;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.event-option-button:hover::after {
  transform: translateX(3px);
}

.event-option-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);
}

.event-option-button:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
  box-shadow: none;
  opacity: 0.7;
}

/* 结果确认按钮样式 */
.event-result .event-option-button {
  background-color: #38b2ac;
  text-align: center;
  justify-content: center;
  font-weight: 600;
  max-width: 180px;
  margin: 15px auto 0;
  padding: 10px 25px;
  border-radius: 20px;
}

.event-result .event-option-button::after {
  content: none;
}

.event-result .event-option-button:hover {
  background-color: #319795;
}

.option-effects {
  margin-top: 8px;
  padding: 8px 12px;
  background-color: #f7fafc;
  border-radius: 5px;
  font-size: 0.9rem;
  border-left: 3px solid #4299e1;
}

.effect-item {
  display: flex;
  align-items: center;
  margin: 5px 0;
  font-size: 0.85rem;
}

.effect-icon {
  margin-right: 8px;
}

.money {
  color: #38a169;
}

.money:not(.positive) {
  color: #e53e3e;
}

.debt {
  color: #e53e3e;
}

.debt:not(.positive) {
  color: #38a169;
}

.capacity {
  color: #4299e1;
}

.inventory {
  color: #805ad5;
}

.market {
  color: #dd6b20;
}

.event-result {
  background-color: #f0f9ff;
  padding: 15px; /* 减小内边距 */
  border-radius: 8px;
  margin-bottom: 10px; /* 减小下边距 */
  text-align: center;
  border-left: 4px solid #38b2ac;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  width: 90%; /* 减小宽度 */
  max-width: 400px; /* 减小最大宽度 */
  margin-left: auto;
  margin-right: auto;
  animation: fade-in 0.3s ease-in-out;
  display: block; /* 确保始终显示 */
}

.event-result p {
  margin-bottom: 12px; /* 减小下边距 */
  font-size: 1rem; /* 减小字体大小 */
  color: #2d3748;
}

.event-actions {
  padding: 0 20px 20px;
  display: flex;
  justify-content: center;
}

.event-close {
  width: 100%;
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 12px 15px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.event-close:hover {
  background-color: #3182ce;
}

.event-close:active {
  transform: scale(0.98);
}

/* 效果结果样式 */
.effect-results {
  margin-top: 15px;
  background-color: #f8fafc;
  border-radius: 8px;
  padding: 12px;
  text-align: left;
  border: 1px solid #e2e8f0;
  width: 100%;
}

.effect-results h3 {
  font-size: 1rem;
  margin: 0 0 10px 0;
  color: #4a5568;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 5px;
}

.effect-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.effect-item {
  display: flex;
  align-items: center;
  padding: 5px;
  border-radius: 4px;
  background-color: #fff;
  border-left: 3px solid #cbd5e0;
  animation: fade-in 0.3s ease-in-out;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

.effect-item.money {
  border-left-color: #38a169;
}

.effect-item.debt {
  border-left-color: #e53e3e;
}

.effect-item.capacity {
  border-left-color: #4299e1;
}

.effect-item.item_add {
  border-left-color: #805ad5;
}

.effect-item.item_remove {
  border-left-color: #dd6b20;
}

.effect-item.market {
  border-left-color: #f6ad55;
}

.effect-item.attribute {
  border-left-color: #9f7aea;
}

.effect-item.info {
  border-left-color: #4299e1;
  background-color: #ebf8ff;
}

.effect-item.error {
  border-left-color: #e53e3e;
  background-color: #fff5f5;
}

.effect-icon {
  font-size: 1.2rem;
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.effect-description {
  font-size: 0.9rem;
  color: #4a5568;
}
</style>
