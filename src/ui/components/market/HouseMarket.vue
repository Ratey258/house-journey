<template>
  <div class="house-market">
    <h2 class="title">
      {{ $t('market.houseMarket.title') }}
    </h2>

    <div class="houses-container">
      <div
        v-for="house in houses"
        :key="house.id"
        class="house-card"
        :class="{
          'affordable': canPlayerAfford(house) && !isHousePurchased(house.id),
          'purchased': isHousePurchased(house.id)
        }"
      >
        <div class="house-image">
          <img
            :src="getHouseImage(house)"
            alt="房屋图片"
          >
          <span
            v-if="canPlayerAfford(house) && !isHousePurchased(house.id)"
            class="affordable-badge"
          >
            {{ $t('market.houseMarket.affordable') }}
          </span>
          <span
            v-if="isHousePurchased(house.id)"
            class="purchased-badge"
          >
            {{ $t('market.houseMarket.purchased') }}
          </span>
        </div>
        <div class="house-info">
          <h3>
            {{ house.name }}
          </h3>
          <p class="house-description">
            {{ house.description }}
          </p>
          <div class="house-details">
            <div class="detail-item">
              <span class="detail-label">{{ $t('market.houseMarket.price') }}</span>
              <span class="detail-value">¥{{ formatNumber(house.price) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">{{ $t('market.houseMarket.level') }}</span>
              <span class="detail-value">{{ house.level }}</span>
            </div>
          </div>
          <div class="house-actions">
            <button
              :disabled="!canPlayerAfford(house) || isHousePurchased(house.id)"
              class="buy-btn"
              @click="openBuyModal(house)"
            >
              {{ isHousePurchased(house.id) ? $t('market.houseMarket.alreadyOwned') : $t('market.houseMarket.buyButton') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 购买确认模态框 -->
    <div v-if="showBuyModal" class="modal-backdrop" @click.self="closeBuyModal">
      <div class="modal-content">
        <h3>{{ $t('market.houseMarket.confirmTitle') }}</h3>
        <p>
          {{ $t('market.houseMarket.confirmMessage', { house: selectedHouse?.name }) }}
        </p>

        <div class="house-purchase-info">
          <div class="detail-item">
            <span class="detail-label">{{ $t('market.houseMarket.price') }}</span>
            <span class="detail-value">¥{{ formatNumber(selectedHouse?.price) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">{{ $t('market.houseMarket.yourMoney') }}</span>
            <span class="detail-value">¥{{ formatNumber(playerMoney) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">{{ $t('market.houseMarket.remaining') }}</span>
            <span class="detail-value">¥{{ formatNumber(playerMoney - (selectedHouse?.price || 0)) }}</span>
          </div>
        </div>

        <!-- 移除警告通知 -->
        <!-- <p
          v-if="isSignificantPurchase"
          class="purchase-warning"
        >
          {{ $t('market.houseMarket.significantWarning') }}
        </p> -->

        <div class="modal-actions">
          <button
            class="btn cancel-btn"
            @click="closeBuyModal"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            class="btn confirm-btn"
            @click="purchaseHouse"
          >
            {{ $t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { usePlayerStore } from '@/stores/player';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { formatNumber, getHouseImagePath } from '@/infrastructure/utils';
import {
  handleError,
  ErrorType,
  ErrorSeverity
} from '../../../infrastructure/utils/errorHandler';
import { useGameCoreStore } from '@/stores/gameCore';
import { useUiStore } from '@/stores/uiStore';
import { useSaveStore } from '@/stores/persistence';
import { getAllHouses } from '@/core/models/house';

const { t } = useI18n();
const gameStore = useGameCoreStore();
const playerStore = usePlayerStore();
const uiStore = useUiStore();

// 从playerStore获取玩家金钱
const { money: playerMoney } = storeToRefs(playerStore);

// 从房屋模型获取房屋数据
const houses = ref([]);

onMounted(() => {
  // 获取预定义的房屋列表
  const predefinedHouses = getAllHouses();
  houses.value = predefinedHouses.map(house => {
    // 创建ID到i18n键的映射
    const idToKey = {
      'apartment': 'small',
      'second_hand': 'medium',
      'highend': 'large',
      'villa': 'luxury',
      'mansion': 'mansion'
    };

    const i18nKey = idToKey[house.id] || house.id;

    return {
      id: house.id,
      name: t(`houses.${i18nKey}.name`),
      description: t(`houses.${i18nKey}.description`),
      price: house.price,
      level: house.level,
      image: house.image
    };
  });
});

// 模态框状态
const showBuyModal = ref(false);
const selectedHouse = ref(null);

// 获取房屋图片
const getHouseImage = (house) => {
  // 优先使用house对象自带的image属性
  if (house && house.image) {
    // 确保image路径正确，添加前导/
    if (house.image.startsWith('./')) {
      return house.image.replace('./', '/');
    } else if (!house.image.startsWith('/')) {
      return `/${house.image}`;
    }
    return house.image;
  }

  // 如果没有image属性或为空，则使用getHouseImagePath获取
  // 处理图片路径
  const defaultImage = '/resources/assets/images/house_1.jpeg';
  if (!house || !house.id) return defaultImage;

  // 尝试使用ID获取图片
  try {
    // 确保返回的路径以/开头
    const path = getHouseImagePath(house.id);
    return path.startsWith('/') ? path : `/${path}`;
  } catch (err) {
    console.warn('获取房屋图片时出错:', err);
    return defaultImage;
  }
};

// 判断玩家是否能买得起
const canPlayerAfford = (house) => {
  return playerStore.money >= house.price;
};

// 检查房屋是否已被购买
const isHousePurchased = (houseId) => {
  return playerStore.purchasedHouses.some(house => house.houseId === houseId);
};

// 判断是否为重大购买（超过玩家当前资金的80%）
// 移除未使用的计算属性
// const isSignificantPurchase = computed(() => {
//   if (!selectedHouse.value) return false;
//   return selectedHouse.value.price > playerStore.money * 0.8;
// });

// 打开购买模态框
const openBuyModal = (house) => {
  // 严格验证资金
  if (!canPlayerAfford(house)) {
    uiStore.showToast({
      type: 'error',
      message: t('market.houseMarket.notEnoughMoney', {
        price: formatNumber(house.price),
        money: formatNumber(playerStore.money),
        shortfall: formatNumber(house.price - playerStore.money)
      }),
      duration: 5000 // 显示时间稍长，让玩家有足够时间阅读
    });
    return;
  }

  selectedHouse.value = house;
  showBuyModal.value = true;
};

// 关闭模态框
const closeBuyModal = () => {
  showBuyModal.value = false;
  selectedHouse.value = null;
};

// 购买房屋
const purchaseHouse = () => {
  if (!selectedHouse.value) return;

  // 再次严格验证资金，防止在打开模态框后资金变动
  if (playerStore.money < selectedHouse.value.price) {
    uiStore.showToast({
      type: 'error',
      message: t('market.houseMarket.fundsChanged', {
        price: formatNumber(selectedHouse.value.price),
        money: formatNumber(playerStore.money),
        shortfall: formatNumber(selectedHouse.value.price - playerStore.money)
      }),
      duration: 5000
    });
    closeBuyModal();
    return;
  }

  // 大额购买确认（超过玩家资金的90%）
  if (selectedHouse.value.price > playerStore.money * 0.9) {
    if (!confirm(t('market.houseMarket.significantConfirm', {
      percent: Math.round((selectedHouse.value.price / playerStore.money) * 100)
    }))) {
      closeBuyModal();
      return;
    }
  }

  // 执行购买
  const success = playerStore.purchaseHouse(selectedHouse.value);

  if (success) {
    // 尝试触发自动保存
    try {
      const saveStore = useSaveStore();
      saveStore.triggerImportantActionAutoSave('housePurchase');
    } catch (err) {
      handleError(err, 'HouseMarket (market)', ErrorType.UNKNOWN, ErrorSeverity.WARNING);
      console.warn('购房后自动保存失败', err);
    }

    // 设置游戏结束但可继续的状态
    // 标记成功购买房屋，并显示结算页面
    gameStore.achieveVictoryWithHouse(selectedHouse.value);
  } else {
    uiStore.showToast({
      type: 'error',
      message: t('market.houseMarket.purchaseFailed'),
      duration: 5000
    });
  }

  closeBuyModal();
};

// 移除showVictoryDialog方法，因为不再需要弹窗确认
</script>

<style scoped>
.house-market {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.title {
  font-size: 1.2rem;
  margin-top: 0;
  margin-bottom: 16px;
  color: #2c3e50;
  border-bottom: 1px solid #ddd;
  padding-bottom: 8px;
}

.houses-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  padding: 5px;
}

.house-card {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  position: relative;
  border: 1px solid rgba(0,0,0,0.03);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.house-card:hover {
  transform: translateY(-7px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
}

.house-card.affordable {
  border: none;
  box-shadow: 0 3px 12px rgba(46, 204, 113, 0.2);
}

.house-card.affordable::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 2px solid #2ecc71;
  border-radius: 12px;
  pointer-events: none;
  z-index: 1;
}

.house-card.purchased {
  border: none;
  box-shadow: 0 3px 12px rgba(142, 68, 173, 0.2);
}

.house-card.purchased::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 2px solid #8e44ad;
  border-radius: 12px;
  pointer-events: none;
  z-index: 1;
}

.house-image {
  position: relative;
  height: 220px; /* 固定图片高度 */
  overflow: hidden;
}

.house-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.house-card:hover .house-image img {
  transform: scale(1.05); /* 鼠标悬停时放大图片效果 */
}

.affordable-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #2ecc71;
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 0.8em;
}

.purchased-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #8e44ad;
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 0.8em;
}

.house-card.purchased .buy-btn {
  background-color: #8e44ad;
  cursor: not-allowed;
}

.house-info {
  padding: 12px;
  position: relative;
  z-index: 2;
  background: linear-gradient(to bottom, #ffffff, #f9f9f9);
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start; /* 确保从顶部开始对齐 */
}

/* 添加一个flex-grow元素来自动占据剩余空间 */
.house-info h3 {
  margin-top: 0;
  margin-bottom: 6px;
  color: #2c3e50;
  font-size: 1.1rem;
}

.house-description {
  color: #7f8c8d;
  margin-bottom: 10px;
  font-size: 0.85em;
  height: 2.6em; /* 改为固定高度而非最大高度 */
  min-height: 2.6em; /* 确保最小高度也保持一致 */
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2; /* 标准属性 */
}
/* 添加弹性间隔元素 */
.house-info::after {
  content: '';
  flex: 1;
  min-height: 5px; /* 最小间隔 */
}
.house-details {
  margin-bottom: 10px;
  background-color: rgba(248, 249, 250, 0.7);
  padding: 6px 8px;
  border-radius: 6px;
  display: grid;
  grid-template-columns: auto 1fr;
  row-gap: 3px;
  column-gap: 10px;
  margin-top: auto; /* 推到flex容器底部 */
}

.detail-item {
  display: contents;
}

.detail-label {
  color: #7f8c8d;
  font-weight: 500;
  text-align: left;
  padding-left: 5px;
}

.detail-value {
  font-weight: bold;
  color: #2c3e50;
  text-align: right; /* 右对齐数值 */
  padding-right: 5px;
}

.house-actions {
  display: flex;
  justify-content: center;
  margin-top: auto;
  padding-top: 10px;
}

.buy-btn {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 8px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  width: 100%;
}

.buy-btn:hover:not(:disabled) {
  background-color: #2980b9;
}

.buy-btn:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

/* 模态框样式 */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  width: 90%;
  max-width: 400px;
}

.house-purchase-info {
  margin: 15px 0;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
  display: grid;
  grid-template-columns: auto 1fr;
  row-gap: 3px;
  column-gap: 10px;
}

/* 模态框中的标签和值需要更多间距 */
.house-purchase-info .detail-label {
  padding-left: 8px;
}

.house-purchase-info .detail-value {
  padding-right: 8px;
}

.purchase-warning {
  color: #e74c3c;
  font-weight: bold;
  padding: 10px;
  border-left: 4px solid #e74c3c;
  background-color: #fadbd8;
  margin: 15px 0;
}

.modal-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: 500;
}

.confirm-btn {
  background-color: #2ecc71;
  color: white;
}

.confirm-btn:hover {
  background-color: #27ae60;
}

.cancel-btn {
  background-color: #e74c3c;
  color: white;
}

.cancel-btn:hover {
  background-color: #c0392b;
}
</style>
