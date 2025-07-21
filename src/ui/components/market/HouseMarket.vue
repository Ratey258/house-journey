<template>
  <div class="house-market">
    <h2 class="title">{{ $t('market.houseMarket.title') }}</h2>
    
    <div class="houses-container">
      <div
        v-for="house in houses"
        :key="house.id"
        class="house-card"
        :class="{ 'affordable': canPlayerAfford(house) }"
      >
        <div class="house-image">
          <img :src="getHouseImage(house)" alt="房屋图片">
          <span v-if="canPlayerAfford(house)" class="affordable-badge">{{ $t('market.houseMarket.affordable') }}</span>
        </div>
        <div class="house-info">
          <h3>{{ house.name }}</h3>
          <p class="house-description">{{ house.description }}</p>
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
              class="buy-btn"
              @click="openBuyModal(house)"
              :disabled="!canPlayerAfford(house)"
            >
              {{ $t('market.houseMarket.buyButton') }}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 购买确认模态框 -->
    <div v-if="showBuyModal" class="modal-backdrop" @click.self="closeBuyModal">
      <div class="modal-content">
        <h3>{{ $t('market.houseMarket.confirmTitle') }}</h3>
        <p>{{ $t('market.houseMarket.confirmMessage', { house: selectedHouse?.name }) }}</p>
        
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
        
        <p class="purchase-warning" v-if="isSignificantPurchase">{{ $t('market.houseMarket.significantWarning') }}</p>
        
        <div class="modal-actions">
          <button class="btn cancel-btn" @click="closeBuyModal">{{ $t('common.cancel') }}</button>
          <button class="btn confirm-btn" @click="purchaseHouse">{{ $t('common.confirm') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useGameStore } from '@/stores';
import { usePlayerStore } from '@/stores/player';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { formatNumber, formatCurrency } from '@/infrastructure/utils';
import { handleError, ErrorType, ErrorSeverity } from '../../../infrastructure/utils/errorHandler';
import { useGameCoreStore } from '@/stores/gameCore';
import { useUiStore } from '@/stores/uiStore';

const { t } = useI18n();
const gameStore = useGameCoreStore();
const playerStore = usePlayerStore();
const uiStore = useUiStore();

// 从playerStore获取玩家金钱
const { money: playerMoney } = storeToRefs(playerStore);

// 示例房屋数据
const houses = [
  {
    id: 'house1',
    name: t('houses.small.name'),
    description: t('houses.small.description'),
    price: 50000,
    level: 1,
    image: 'small_house.jpg'
  },
  {
    id: 'house2',
    name: t('houses.medium.name'),
    description: t('houses.medium.description'),
    price: 120000,
    level: 2,
    image: 'medium_house.jpg'
  },
  {
    id: 'house3',
    name: t('houses.large.name'),
    description: t('houses.large.description'),
    price: 250000,
    level: 3,
    image: 'large_house.jpg'
  },
  {
    id: 'house4',
    name: t('houses.luxury.name'),
    description: t('houses.luxury.description'),
    price: 500000,
    level: 4,
    image: 'luxury_house.jpg'
  },
  {
    id: 'house5',
    name: t('houses.mansion.name'),
    description: t('houses.mansion.description'),
    price: 1000000,
    level: 5,
    image: 'mansion.jpg'
  }
];

// 模态框状态
const showBuyModal = ref(false);
const selectedHouse = ref(null);

// 获取房屋图片
const getHouseImage = (house) => {
  // 实际项目中应该返回实际图片路径
  return `placeholder_house_${house.level}.jpg`;
};

// 判断玩家是否能买得起
const canPlayerAfford = (house) => {
  return playerStore.money >= house.price;
};

// 判断是否为重大购买（超过玩家当前资金的80%）
const isSignificantPurchase = computed(() => {
  if (!selectedHouse.value) return false;
  return selectedHouse.value.price > playerStore.money * 0.8;
});

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
    // 购买成功的消息
    let successMessage = t('market.houseMarket.purchaseSuccess', { house: selectedHouse.value.name });
    
    // 如果是高级房产（5级），添加祝贺信息
    if (selectedHouse.value.level >= 5) {
      successMessage = t('market.houseMarket.victoryPurchase', { house: selectedHouse.value.name });
      
      // 显示特殊的祝贺对话框
      setTimeout(() => {
        showVictoryDialog(selectedHouse.value);
      }, 500);
    }
    
    uiStore.showToast({
      type: 'success',
      message: t('market.houseMarket.purchaseSuccess', { name: selectedHouse.value.name }),
      duration: 5000
    });
    
    // 尝试触发自动保存
    try {
      const saveStore = useSaveStore();
      saveStore.triggerImportantActionAutoSave('housePurchase');
    } catch (err) {
      handleError(err, 'HouseMarket (market)', ErrorType.UNKNOWN, ErrorSeverity.WARNING);
      console.warn('购房后自动保存失败', err);
    }
    
    // 检查游戏胜利条件
    if (selectedHouse.value.level >= 5) {
      // 不再直接调用checkGameEnd，而是让游戏状态系统自动检测
      // 这样可以避免直接结束游戏
      gameStore.checkGameEnd();
    }
  } else {
    uiStore.showToast({
      type: 'error',
      message: t('market.houseMarket.purchaseFailed'),
      duration: 5000
    });
  }
  
  closeBuyModal();
};

// 显示胜利对话框
const showVictoryDialog = (house) => {
  // 这里可以实现一个更华丽的胜利提示
  // 例如使用一个专门的对话框组件
  const message = t('market.houseMarket.victoryMessage', {
    house: house.name,
    week: gameStore.currentWeek,
    maxWeek: gameStore.maxWeeks
  });
  
  if (confirm(message + "\n\n" + t('market.houseMarket.continuePrompt'))) {
    // 玩家选择继续游戏
    uiStore.showToast({
      type: 'info',
      message: t('market.houseMarket.continuePlaying'),
      duration: 5000
    });
  } else {
    // 玩家选择结束并查看结果
    gameStore.manualEndGame();
  }
};
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
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.house-card {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.house-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

.house-card.affordable {
  border: 2px solid #2ecc71;
}

.house-image {
  position: relative;
  height: 160px;
  overflow: hidden;
}

.house-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

.house-info {
  padding: 15px;
}

.house-info h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #2c3e50;
}

.house-description {
  color: #7f8c8d;
  margin-bottom: 15px;
  font-size: 0.9em;
}

.house-details {
  margin-bottom: 15px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.detail-label {
  color: #7f8c8d;
  font-weight: 500;
}

.detail-value {
  font-weight: bold;
  color: #2c3e50;
}

.house-actions {
  display: flex;
  justify-content: center;
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