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
                <!-- 普通效果项 -->
                <div v-for="(effect, index) in effectResults.filter(e => e.type !== 'market')"
                     :key="`normal-${index}`"
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
                  <span v-else-if="effect.type === 'info'" class="effect-icon">ℹ️</span>
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
                    <template v-else-if="effect.type === 'attribute'">
                      {{ getAttributeDisplayName(effect.attribute) }}: {{ effect.oldValue }} → {{ effect.newValue }}
                    </template>
                    <template v-else-if="effect.type === 'info'">
                      {{ effect.description || '信息' }}
                    </template>
                    <template v-else>
                      {{ effect.description || effect.type }}
                    </template>
                  </span>
                </div>

                <!-- 市场效果项，单独处理，每条描述一行 -->
                <template v-for="(effect, effectIndex) in effectResults.filter(e => e.type === 'market')" :key="`market-${effectIndex}`">
                  <div v-for="(description, descIndex) in getMarketEffectDescription(effect)"
                       :key="`market-${effectIndex}-${descIndex}`"
                       class="effect-item market">
                    <span class="effect-icon">📊</span>
                    <span class="effect-description">{{ description }}</span>
                  </div>
                </template>
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

// 组件挂载时
onMounted(() => {
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
 * @returns {Array} 市场效果描述数组，每个元素是一行描述
 */
const getMarketEffectDescription = (effect) => {
  if (!effect || !effect.effect) return ['未知市场变化'];

  const marketEffect = effect.effect;
  const descriptions = [];

  // 确定持续时间文本
  let durationText = '';
  if (marketEffect.duration) {
    // 确认duration是否已经是周数，如果是秒数则需要转换
    let weeks = marketEffect.duration;
    if (marketEffect.duration > 52) { // 如果duration大于52，可能是以秒为单位
      weeks = Math.round(marketEffect.duration / (7 * 24 * 3600));
    }
    durationText = `，持续 ${weeks} 周`;
  }

  if (marketEffect.globalPriceModifier) {
    const percentage = Math.round((marketEffect.globalPriceModifier - 1) * 100);
    if (percentage > 0) {
      descriptions.push(`全球价格上涨 ${percentage}%${durationText}`);
    } else if (percentage < 0) {
      descriptions.push(`全球价格下跌 ${Math.abs(percentage)}%${durationText}`);
    }
  }

  if (marketEffect.categoryModifiers) {
    for (const [category, modifier] of Object.entries(marketEffect.categoryModifiers)) {
      const percentage = Math.round((modifier - 1) * 100);
      if (percentage > 0) {
        descriptions.push(`${category}类别价格上涨 ${percentage}%${durationText}`);
      } else if (percentage < 0) {
        descriptions.push(`${category}类别价格下跌 ${Math.abs(percentage)}%${durationText}`);
      }
    }
  }

  // 显示地点特定修改器
  if (marketEffect.locationModifiers) {
    for (const [locationId, modifier] of Object.entries(marketEffect.locationModifiers)) {
      const percentage = Math.round((modifier - 1) * 100);
      const locationName = getLocationName(locationId);
      if (percentage > 0) {
        descriptions.push(`${locationName}价格上涨 ${percentage}%${durationText}`);
      } else if (percentage < 0) {
        descriptions.push(`${locationName}价格下跌 ${Math.abs(percentage)}%${durationText}`);
      }
    }
  }

  // 显示地点内特定商品修改器
  if (marketEffect.locationProductModifiers) {
    for (const [locationId, products] of Object.entries(marketEffect.locationProductModifiers)) {
      const locationName = getLocationName(locationId);
      for (const [productId, modifier] of Object.entries(products)) {
        const percentage = Math.round((modifier - 1) * 100);
        const productName = getProductName(productId);
        if (percentage > 0) {
          descriptions.push(`${locationName}的${productName}价格上涨 ${percentage}%${durationText}`);
        } else if (percentage < 0) {
          descriptions.push(`${locationName}的${productName}价格下跌 ${Math.abs(percentage)}%${durationText}`);
        }
      }
    }
  }

  // 显示具体影响的产品
  if (marketEffect.productModifiers) {
    const productModifiers = Object.entries(marketEffect.productModifiers);

    // 不管产品数量多少，都单独显示每个产品
    for (const [productId, modifier] of productModifiers) {
      const percentage = Math.round((modifier - 1) * 100);
      const productName = getProductName(productId);
      if (percentage > 0) {
        descriptions.push(`${productName}价格上涨 ${percentage}%${durationText}`);
      } else if (percentage < 0) {
        descriptions.push(`${productName}价格下跌 ${Math.abs(percentage)}%${durationText}`);
      }
    }
  }

  // 如果没有任何描述，添加一个默认描述
  if (descriptions.length === 0) {
    descriptions.push(`市场没有明显变化${durationText}`);
  }

  return descriptions;
};

// 获取地点名称
const getLocationName = (locationId) => {
  const locationMap = {
    'commodity_market': '大宗商品市场',
    'second_hand_market': '二手市场',
    'premium_mall': '高端商场',
    'electronics_hub': '电子产品中心',
    'black_market': '黑市'
  };
  return locationMap[locationId] || locationId;
};

// 获取产品名称
const getProductName = (productId) => {
  // 将productId转为字符串，以便统一处理数字和字符串ID
  const id = String(productId);

  // 处理特殊格式的ID，比如house_a, land_a这类
  if (id.startsWith('house_')) {
    const houseType = id.split('_')[1]?.toUpperCase() || '';
    return `${houseType}型房产`;
  } else if (id.startsWith('land_')) {
    const landType = id.split('_')[1]?.toUpperCase() || '';
    return `${landType}类土地`;
  }

  // 这里添加所有商品的中文名称映射
  const productMap = {
    // 字符串ID商品
    'phone': '手机',
    'laptop': '笔记本电脑',
    'smartwatch': '智能手表',
    'tablet': '平板电脑',
    'camera': '相机',
    'tv': '电视',
    'console': '游戏机',
    'headphones': '耳机',
    'speaker': '音箱',
    'watch': '手表',
    'jewelry': '珠宝',
    'handbag': '手提包',
    'painting': '画作',
    'antique': '古董',
    'collectible': '收藏品',
    'gold': '黄金',
    'silver': '白银',
    'oil': '原油',
    'wheat': '小麦',
    'corn': '玉米',
    'coffee': '咖啡',
    'copper': '铜',
    'steel': '钢铁',
    'cotton': '棉花',
    'rice': '大米',
    'antique_painting': '古画',

    // 数字ID商品 - 日常用品 (101-199)
    '101': '卫生纸',
    '102': '洗发水',
    '103': '牙膏',
    '104': '肥皂',
    '105': '毛巾',
    '106': '二手衣物',
    '107': '二手家具',

    // 食品 (201-299)
    '201': '鸡蛋',
    '202': '大米',
    '203': '食用油',
    '204': '新鲜蔬菜',
    '205': '水果',

    // 电子产品 (301-399)
    '301': '手机',
    '302': '电视',
    '303': '笔记本电脑',
    '304': '平板电脑',
    '305': '智能手表',

    // 奢侈品 (401-499)
    '401': '名牌手表',
    '402': '钻石项链',
    '403': '设计师包包',
    '404': '高级香水',
    '405': '名牌服装',
    '406': '高级红酒',

    // 收藏品 (501-599)
    '501': '古董钟表',
    '502': '邮票',
    '503': '古画',
    '504': '老式相机',
    '505': '纪念币'
  };

  return productMap[id] || `商品(${id})`;
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

// 选择选项
const selectOption = (option) => {
  console.log('EventModal - 选择选项:', option);

  // 防止重复点击
  if (applyingEffects.value) {
    return;
  }

  applyingEffects.value = true;

  try {
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

        // 去重：确保相同类型的效果不重复显示
        const uniqueEffects = [];
        const effectTypes = new Set();

        effectResults.value.forEach(effect => {
          // 对于市场效果，检查effect.effect的内容是否相同
          if (effect.type === 'market') {
            const marketEffect = JSON.stringify(effect.effect);
            if (!effectTypes.has(marketEffect)) {
              effectTypes.add(marketEffect);
              uniqueEffects.push(effect);
            }
          } else {
            // 对于其他类型的效果，简单检查类型
            if (!effectTypes.has(effect.type)) {
              effectTypes.add(effect.type);
              uniqueEffects.push(effect);
            }
          }
        });

        effectResults.value = uniqueEffects;

        // 确保至少显示1秒的结果，即使没有效果
        if (effectResults.value.length === 0) {
          // 根据事件标题和类型，提供更具体的默认效果描述
          let defaultDescription = '选项已生效';

          // 根据事件标题进行简单分析
          const eventTitle = currentEvent.value.title || '';

          if (eventTitle.includes('市场') || eventTitle.includes('价格') || eventTitle.includes('商品')) {
            defaultDescription = '你将在市场中看到价格变化';
          } else if (eventTitle.includes('投资') || eventTitle.includes('理财')) {
            defaultDescription = '你的投资决策已记录，结果将在后续显现';
          } else if (eventTitle.includes('对话') || eventTitle.includes('交流') || eventTitle.includes('顾问')) {
            defaultDescription = '这次交流增加了你的见识和人脉';
          }

          effectResults.value = [{
            type: 'info',
            description: defaultDescription
          }];
        } else {
          // 美化信息类型的效果描述
          effectResults.value = effectResults.value.map(effect => {
            // 将JSON对象转换为友好的描述
            if (effect.type === 'info' && !effect.description) {
              return {
                ...effect,
                description: '选项已成功执行'
              };
            }
            // 处理原始JSON显示
            if (typeof effect.description === 'object') {
              return {
                ...effect,
                description: '选项效果已应用'
              };
            }
            return effect;
          });
        }
      } else {
        // 如果没有返回效果，添加一个默认效果
        const eventTitle = currentEvent.value.title || '';
        let defaultDescription = '选项已执行，效果将逐渐显现';

        if (eventTitle.includes('市场') || eventTitle.includes('价格')) {
          defaultDescription = '你的决策将影响后续市场行情';
        } else if (eventTitle.includes('投资')) {
          defaultDescription = '你的投资已完成，回报将在未来显现';
        }

        effectResults.value = [{
          type: 'info',
          description: defaultDescription
        }];
      }
    } else {
      console.warn('EventModal - 事件操作模块不可用，无法处理选项效果');
      // 添加一个默认效果
      effectResults.value = [{
        type: 'info',
        description: '选项已执行，但系统无法显示具体效果'
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
      description: '处理选项时出错: ' + (error.message || '未知错误')
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
  margin-top: 10px;
  max-height: 250px; /* 增加高度，可以显示更多效果 */
  overflow-y: auto;
  padding: 0 5px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.effect-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 8px;
  background-color: #f5f5f5;
  transition: all 0.3s ease;
  animation: fadeIn 0.3s ease forwards;
}

/* 为市场效果添加特殊动画，依次显示 */
.effect-item.market {
  animation: fadeIn 0.3s ease forwards;
}

.effect-item.market:nth-child(1) { animation-delay: 0.05s; }
.effect-item.market:nth-child(2) { animation-delay: 0.1s; }
.effect-item.market:nth-child(3) { animation-delay: 0.15s; }
.effect-item.market:nth-child(4) { animation-delay: 0.2s; }
.effect-item.market:nth-child(5) { animation-delay: 0.25s; }
.effect-item.market:nth-child(6) { animation-delay: 0.3s; }
.effect-item.market:nth-child(7) { animation-delay: 0.35s; }
.effect-item.market:nth-child(8) { animation-delay: 0.4s; }
.effect-item.market:nth-child(9) { animation-delay: 0.45s; }
.effect-item.market:nth-child(10) { animation-delay: 0.5s; }

.effect-icon {
  margin-right: 10px;
  font-size: 1.2em;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px; /* 确保图标有固定宽度 */
}

.effect-description {
  flex: 1;
  font-size: 0.95em;
  line-height: 1.4;
}

/* 效果类型样式，为市场效果添加渐变色 */
.effect-item.market {
  background: linear-gradient(to right, #fff8e1, #ffecb3);
  border-left: 4px solid #ffc107;
}

.effect-item.money {
  background-color: #e8f5e9;
  border-left: 4px solid #4caf50;
}

.effect-item.debt {
  background-color: #ffebee;
  border-left: 4px solid #f44336;
}

.effect-item.capacity {
  background-color: #e3f2fd;
  border-left: 4px solid #2196f3;
}

.effect-item.item_add {
  background-color: #e8f5e9;
  border-left: 4px solid #4caf50;
}

.effect-item.item_remove {
  background-color: #ffebee;
  border-left: 4px solid #f44336;
}

.effect-item.market {
  background-color: #fff8e1;
  border-left: 4px solid #ffc107;
}

.effect-item.attribute {
  background-color: #ede7f6;
  border-left: 4px solid #673ab7;
}

.effect-item.info {
  background-color: #e1f5fe;
  border-left: 4px solid #03a9f4;
}

.effect-item.error {
  background-color: #ffebee;
  border-left: 4px solid #f44336;
}

.with-result .event-header {
  background-color: #2ecc71;
}

@keyframes scaleIn {
  0% { transform: scale(0.95); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

