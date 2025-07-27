<template>
  <div v-show="showModal" class="event-modal-container">
    <!-- 事件模态框 -->
    <div class="event-modal-overlay" @click.self="handleOverlayClick">
      <div class="event-modal" :class="{ 'with-result': resultMessage }">
        <!-- 事件标题 -->
        <div class="event-header">
          <div class="event-header-content">
            <h2 class="event-title">{{ currentEvent?.title || '事件' }}</h2>
            <div class="event-icon">{{ getEventIcon(currentEvent?.type) }}</div>
          </div>
        </div>

        <!-- 事件内容 -->
        <div class="event-content">
          <p class="event-description">{{ currentEvent?.description }}</p>

          <!-- 事件图片 - 如果有的话 -->
          <div v-if="eventImageUrl" class="event-image">
            <img :src="eventImageUrl" :alt="currentEvent?.title" />
          </div>
        </div>

        <!-- 事件选项 -->
        <div class="event-options">
          <div v-if="resultMessage" class="event-result">
            <div class="result-message">
              <div class="result-icon">✓</div>
              <p>{{ resultMessage }}</p>
            </div>

            <!-- 添加效果显示区域 -->
            <div v-if="effectResults.length > 0" class="effect-results">
              <h3>效果变化</h3>
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

            <button class="event-confirm-button" @click="hideModal">确定</button>
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

// 根据事件类型获取图标
const getEventIcon = (type) => {
  switch (type) {
    case 'market':
      return '📊';
    case 'player':
      return '👤';
    case 'house':
      return '🏠';
    case 'random':
      return '🎲';
    case 'news':
      return '📰';
    case 'disaster':
      return '🌪️';
    case 'opportunity':
      return '💼';
    default:
      return '📣';
  }
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

// 获取属性显示名称
const getAttributeDisplayName = (attribute) => {
  const attributeNames = {
    luck: "幸运",
    charisma: "魅力",
    intelligence: "智力",
    stamina: "体力"
  };
  
  return attributeNames[attribute] || attribute;
};

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
  backdrop-filter: blur(5px);
  animation: fadeIn 0.3s ease;
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
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  width: 90%;
  max-width: 550px;
  position: relative;
  overflow: hidden;
  margin: 0 auto;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.event-header {
  background-color: #3498db;
  color: white;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.event-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.event-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  flex-grow: 1;
  color: white;
}

.event-icon {
  font-size: 1.8rem;
  margin-left: 12px;
  background-color: rgba(255, 255, 255, 0.2);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.event-content {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
  background-color: white;
  max-height: 40vh;
}

.event-description {
  margin: 0 0 15px 0;
  font-size: 1.1rem;
  line-height: 1.6;
  color: #333;
}

.event-image {
  width: 100%;
  margin: 15px 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.event-image img {
  width: 100%;
  height: auto;
  object-fit: cover;
  display: block;
  transition: transform 0.5s ease;
}

.event-image:hover img {
  transform: scale(1.03);
}

.event-options {
  padding: 0 20px 20px;
  background-color: white;
}

.event-option-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.event-option-button {
  background-color: #3498db;
  color: white;
  padding: 14px 20px;
  border-radius: 8px;
  font-size: 1.05rem;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  position: relative;
  transition: all 0.2s ease;
  border: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.event-option-button::after {
  content: '›';
  font-size: 1.6rem;
  line-height: 1;
  opacity: 0.8;
  transition: transform 0.2s ease;
}

.event-option-button:hover {
  background-color: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.15);
}

.event-option-button:hover::after {
  transform: translateX(3px);
}

.event-option-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);
}

.event-option-button:disabled {
  background-color: #bdc3c7;
  color: #ecf0f1;
  cursor: not-allowed;
  box-shadow: none;
  opacity: 0.7;
}

.event-option-button:disabled::after {
  opacity: 0.3;
}

/* 结果样式 */
.event-result {
  padding: 20px 0 10px;
  text-align: center;
  animation: fadeIn 0.4s ease;
}

.result-message {
  background-color: #f1f9ff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  border-left: 4px solid #3498db;
  display: flex;
  align-items: center;
  text-align: left;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.result-icon {
  background-color: #3498db;
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  margin-right: 12px;
  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);
}

.result-message p {
  margin: 0;
  font-size: 1.05rem;
  color: #2c3e50;
}

.event-confirm-button {
  background-color: #2ecc71;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 500;
  padding: 12px 30px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.event-confirm-button:hover {
  background-color: #27ae60;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.event-confirm-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);
}

/* 效果结果样式 */
.effect-results {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  text-align: left;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
}

.effect-results h3 {
  font-size: 1.05rem;
  margin: 0 0 12px 0;
  color: #495057;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 8px;
  text-align: center;
}

.effect-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.effect-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  animation: fadeIn 0.3s ease;
  animation-fill-mode: both;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.effect-item:nth-child(1) { animation-delay: 0.1s; }
.effect-item:nth-child(2) { animation-delay: 0.2s; }
.effect-item:nth-child(3) { animation-delay: 0.3s; }
.effect-item:nth-child(4) { animation-delay: 0.4s; }
.effect-item:nth-child(5) { animation-delay: 0.5s; }

.effect-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.effect-icon {
  font-size: 1.2rem;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);
}

.effect-description {
  font-size: 0.95rem;
  color: #495057;
  font-weight: 500;
}

/* 不同效果类型样式 */
.effect-item.money {
  background-color: #e8f5e9;
}
.effect-item.money .effect-icon {
  background-color: #4caf50;
  color: white;
}

.effect-item.debt {
  background-color: #ffebee;
}
.effect-item.debt .effect-icon {
  background-color: #f44336;
  color: white;
}

.effect-item.capacity {
  background-color: #e3f2fd;
}
.effect-item.capacity .effect-icon {
  background-color: #2196f3;
  color: white;
}

.effect-item.item_add {
  background-color: #f3e5f5;
}
.effect-item.item_add .effect-icon {
  background-color: #9c27b0;
  color: white;
}

.effect-item.item_remove {
  background-color: #fff3e0;
}
.effect-item.item_remove .effect-icon {
  background-color: #ff9800;
  color: white;
}

.effect-item.market {
  background-color: #fff8e1;
}
.effect-item.market .effect-icon {
  background-color: #ffc107;
  color: white;
}

.effect-item.attribute {
  background-color: #ede7f6;
}
.effect-item.attribute .effect-icon {
  background-color: #673ab7;
  color: white;
}

.with-result .event-header {
  background-color: #2ecc71;
}

@keyframes scaleIn {
  0% { transform: scale(0.95); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
