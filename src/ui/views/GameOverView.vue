<template>
  <div class="game-over-view" :class="resultClass">
    <div class="game-over-container">
      <div class="header-section">
        <h1 class="title" :class="{'victory': isVictory, 'failure': isBankruptcy}">{{ getGameOverTitle }}</h1>
        <p class="subtitle">{{ getResultDescription }}</p>
      </div>

      <div class="result-summary">
        <div class="rank-display">
          <div class="rank-animation" :class="'rank-' + (getScoreRank || 'D')">
            <span class="rank-value">{{ getScoreRank || 'D' }}</span>
          </div>
          <div class="score-display">
            <div class="score-label">最终得分</div>
            <div class="score-value">{{ formatNumber(getFinalScore || 0) }}</div>
          </div>
        </div>

        <!-- 核心统计数据，集中在一行 -->
        <div class="core-stats">
          <div class="stat-item">
            <div class="stat-label">游戏周数</div>
            <div class="stat-value">{{ Math.min(gameStats.weeksPassed || 0, gameState.maxWeeks) }} / {{ gameState.maxWeeks }}</div>
          </div>

          <div class="stat-item">
            <div class="stat-label">最终资金</div>
            <div class="stat-value">¥{{ formatNumber(gameStats.finalMoney || 0) }}</div>
          </div>

          <div class="stat-item">
            <div class="stat-label">净资产</div>
            <div class="stat-value">¥{{ formatNumber(gameStats.finalAssets || 0) }}</div>
          </div>
        </div>
      </div>

      <!-- 房产信息(如果有) -->
      <div v-if="player.purchasedHouses && player.purchasedHouses.length > 0" class="house-info">
        <h2>已购房产 ({{ player.purchasedHouses.length }}套)</h2>

        <!-- 显示最高级别/最贵的房产 -->
        <div class="house-details">
          <div class="house-image-container">
            <img :src="getHouseImage(getBestHouse)" alt="房屋图片" class="house-image">
          </div>
          <div class="house-text">
            <h3 class="house-name">{{ getBestHouse.name }} <span class="best-house-badge">{{ getBestHouse === getMostExpensiveHouse ? '最贵房产' : '最高级房产' }}</span></h3>
            <p class="house-price">价格: ¥{{ formatNumber(getBestHouse.purchasePrice || getBestHouse.price) }}</p>
            <p class="house-week">购买时间: 第 {{ getBestHouse.purchaseWeek || gameStats.week }} 周</p>
          </div>
        </div>

        <!-- 多房产展示 -->
        <div v-if="player.purchasedHouses.length > 1" class="all-houses-container">
          <h3>全部房产</h3>
          <div class="houses-grid">
            <div v-for="house in player.purchasedHouses" :key="house.houseId" class="mini-house-card">
              <div class="mini-house-image">
                <img :src="getHouseImage(house)" alt="房屋图片">
              </div>
              <div class="mini-house-info">
                <div class="mini-house-name">{{ house.name }}</div>
                <div class="mini-house-price">¥{{ formatNumber(house.purchasePrice) }}</div>
                <div class="mini-house-week">第{{ house.purchaseWeek }}周</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 备选：从游戏状态中显示房屋信息 -->
      <div v-else-if="gameStats.purchasedHouse || (gameStats.data && gameStats.data.house)" class="house-info">
        <div class="house-details">
          <div class="house-image-container">
            <img :src="getHouseImage(gameStats.purchasedHouse || gameStats.data.house)" alt="房屋图片" class="house-image">
          </div>
          <div class="house-text">
            <h3 class="house-name">{{ (gameStats.purchasedHouse || gameStats.data.house).name }}</h3>
            <p class="house-price">价格: ¥{{ formatNumber((gameStats.purchasedHouse || gameStats.data.house).price) }}</p>
            <p class="house-week">购买时间: 第 {{ gameStats.week }} 周</p>
          </div>
        </div>
      </div>

      <!-- 交易统计 -->
      <div class="statistics-section" v-if="gameStats.tradeStats">
        <h2>交易统计</h2>
        <div class="statistics-grid">
          <div class="stat-item">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <div class="stat-label">交易笔数</div>
              <div class="stat-value">{{ gameStats.tradeStats?.totalTrades || 0 }}次</div>
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-icon">📈</div>
            <div class="stat-content">
              <div class="stat-label">总交易利润</div>
              <div class="stat-value" :class="{'positive': (gameStats.tradeStats?.totalProfit || 0) > 0, 'negative': (gameStats.tradeStats?.totalProfit || 0) < 0}">
                {{ (gameStats.tradeStats?.totalProfit || 0) > 0 ? '+' : '' }}¥{{ formatNumber(gameStats.tradeStats?.totalProfit || 0) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 得分明细 -->
      <div class="score-details-section" v-if="gameStats.scoreDetails">
        <h2>得分明细</h2>
        <div class="score-details-grid">
          <div class="stat-item">
            <div class="stat-icon">💰</div>
            <div class="stat-content">
              <div class="stat-label">资产得分</div>
              <div class="stat-value">{{ formatNumber(gameStats.scoreDetails?.assetsScore || 0) }}</div>
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-icon">🏡</div>
            <div class="stat-content">
              <div class="stat-label">房产得分</div>
              <div class="stat-value">{{ formatNumber(gameStats.scoreDetails?.houseScore || 0) }}</div>
              <div v-if="player.purchasedHouses && player.purchasedHouses.length > 1" class="stat-bonus">
                含{{ player.purchasedHouses.length }}套房产加成
              </div>
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-icon">⏱️</div>
            <div class="stat-content">
              <div class="stat-label">时间效率</div>
              <div class="stat-value">{{ formatNumber(gameStats.scoreDetails?.timeScore || 0) }}</div>
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-icon">🔄</div>
            <div class="stat-content">
              <div class="stat-label">交易得分</div>
              <div class="stat-value">{{ formatNumber(gameStats.scoreDetails?.tradeScore || 0) }}</div>
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-icon">🏦</div>
            <div class="stat-content">
              <div class="stat-label">银行管理</div>
              <div class="stat-value">{{ formatNumber(gameStats.scoreDetails?.bankScore || 0) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 成就展示 -->
      <div v-if="hasAchievements" class="achievements-section">
        <h2>解锁成就</h2>
        <div class="achievements-grid">
          <div v-for="(achievement, index) in achievements" :key="index" class="achievement-item">
            <div class="achievement-icon">🏆</div>
            <div class="achievement-content">
              <div class="achievement-name">{{ achievement.name }}</div>
              <div class="achievement-desc">{{ achievement.description }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="actions">
        <button v-if="canContinueGame" @click="continueGame" class="btn btn-primary">
          <span class="btn-icon">🎮</span>
          <span class="btn-text">继续游戏</span>
        </button>

        <button @click="restartGame" class="btn btn-success">
          <span class="btn-icon">🔄</span>
          <span class="btn-text">重新开始</span>
        </button>

        <button @click="returnToMainMenu" class="btn btn-primary">
          <span class="btn-icon">🏠</span>
          <span class="btn-text">返回主菜单</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, type Ref } from 'vue';
import { formatNumber } from '@/infrastructure/utils';
import { useGameCoreStore } from '@/stores/gameCore';
import { useUiStore } from '@/stores/uiStore';
import { useSmartLogger } from '@/infrastructure/utils/smartLogger';

// ==================== 类型定义 ====================

interface GameState {
  maxWeeks: number;
  [key: string]: any;
}

interface Player {
  purchasedHouses: Array<{
    houseId: string | number;
    name: string;
    purchasePrice: number;
    purchaseDate: string;
    level?: number;
    price?: number;
    purchaseWeek?: number;
    id?: string | number;
    imageUrl?: string;
    image?: string;
  }>;
  money: number;
  debt: number;
  [key: string]: any;
}

interface GameStats {
  endReason: string;
  canContinue?: boolean;
  weeksPassed?: number;
  finalAssets?: number;
  tradeStats?: {
    totalTrades: number;
    totalProfit: number;
  };
  purchasedHouse?: {
    name: string;
  };
  data?: {
    firstVictoryWeek?: number;
    debt?: number;
  };
  score?: {
    score: number;
    rank?: string;
  };
  scoreDetails?: any;
  reason?: string;
  week?: number;
  [key: string]: any;
}

interface Achievement {
  name: string;
  description: string;
}

// ==================== Props ====================

interface Props {
  gameState: GameState;
  player: Player;
  gameStats: GameStats;
}

const props = withDefaults(defineProps<Props>(), {});

// ==================== Emits ====================

const emit = defineEmits<{
  'return-to-main': [];
  'restart-game': [];
  'continue-game': [];
}>();

// ==================== 响应式状态 ====================

// 初始化智能日志系统
const { game, ui } = useSmartLogger();

const showDetailedView: Ref<boolean> = ref(false);
const achievements: Ref<Achievement[]> = ref([]);

// ==================== 计算属性 ====================

const canContinueGame = computed(() => {
  // 检查是否可以继续游戏（房屋购买胜利）
  const isHouseVictory = props.gameStats.endReason === 'houseVictory';
  const hasCanContinueFlag = props.gameStats.canContinue === true;
  const hasPurchasedHouse = props.player.purchasedHouses && props.player.purchasedHouses.length > 0;

  // 日志输出帮助调试
  game.debug('继续游戏条件检查', {
    isHouseVictory,
    hasCanContinueFlag,
    hasPurchasedHouse,
    endReason: props.gameStats.endReason,
    playerHouses: props.player.purchasedHouses
  }, 'continue-game-check');

  // 简化判断条件: 只要不是破产或时间限制结束，且有房产就可以继续
  return (hasPurchasedHouse || hasCanContinueFlag || isHouseVictory) &&
         props.gameStats.endReason !== 'bankruptcy';
});

const resultClass = computed(() => {
  const endReason = props.gameStats.endReason;
  if (endReason === 'victory' || endReason === 'houseVictory') {
    return 'result-house-victory'; // 购房胜利
  } else if (endReason === 'victoryTimeLimit') {
    return 'result-game-complete'; // 购房后坚持到最后的完美胜利
  } else if (endReason === 'bankruptcy') {
    return 'result-bankruptcy'; // 破产失败
  } else if (endReason === 'timeLimit') {
    return 'result-time-expired'; // 时间到失败
  }
  return 'result-neutral';
});

const isVictory = computed(() => {
  const endReason = props.gameStats.endReason;
  return endReason === 'victory' ||
         endReason === 'achievement' ||
         endReason === 'victoryTimeLimit' ||
         endReason === 'victoryOther' ||
         endReason === 'houseVictory';
});

const isBankruptcy = computed(() => {
  return props.gameStats.endReason === 'bankruptcy';
});

const hasAchievements = computed(() => {
  return achievements.value && achievements.value.length > 0;
});

const getGameOverTitle = computed(() => {
  const endReason = props.gameStats.endReason;

  // 预处理多房产情况
  let titlePrefix = '';
  const houseCount = props.player.purchasedHouses?.length || 0;
  const houseName = props.gameStats.purchasedHouse?.name || props.player.purchasedHouses?.[0]?.name || '房产';

  if (houseCount > 1) {
    titlePrefix = `🏆 购置${houseCount}套房产！`;
  } else {
    titlePrefix = `🎉 恭喜购得${houseName}！`;
  }

  // 根据结束原因返回不同标题
  switch (endReason) {
    case 'houseVictory':
    case 'victory':
      return titlePrefix;
    case 'victoryTimeLimit':
      return '🏆 完美通关！事业有成！';
    case 'timeLimit':
      return '⌛ 时间已到，未能实现购房梦';
    case 'bankruptcy':
      return '💸 破产清算，游戏结束';
    case 'playerChoice':
      return '你选择了结束游戏';
    default:
      return '游戏结束';
  }
});

const getResultDescription = computed(() => {
  const endReason = props.gameStats.endReason;
  const firstVictoryWeek = props.gameStats.data?.firstVictoryWeek;
  // 确保周数不超过最大值52
  const currentWeek = Math.min(props.gameStats.weeksPassed || 0, props.gameState.maxWeeks);
  const finalAssets = formatNumber(props.gameStats.finalAssets || 0);
  const totalTrades = props.gameStats.tradeStats?.totalTrades || 0;
  const totalProfit = formatNumber(Math.abs(props.gameStats.tradeStats?.totalProfit || 0));
  const profitPrefix = (props.gameStats.tradeStats?.totalProfit || 0) >= 0 ? '盈利' : '亏损';

  switch (endReason) {
    case 'victory':
    case 'houseVictory':
      return `恭喜你在第 ${currentWeek} 周成功实现购房梦想！\n` +
             `通过 ${totalTrades} 次交易，总计${profitPrefix} ¥${totalProfit}。`;

    case 'victoryTimeLimit':
      return `你用 ${firstVictoryWeek} 周买到了心仪的房子，并继续奋斗到第 ${currentWeek} 周！\n` +
             `最终资产达到 ¥${finalAssets}，完美诠释了"赢家通吃"！`;

    case 'timeLimit':
      return `游戏结束，你在52周内累积了 ¥${finalAssets} 的资产。\n` +
             `通过 ${totalTrades} 次交易，总计${profitPrefix} ¥${totalProfit}。继续努力，下次一定能实现购房梦！`;

    case 'bankruptcy':
      const debt = formatNumber(props.gameStats.data?.debt || 0);
      return `很遗憾，由于无力偿还 ¥${debt} 的债务导致破产。\n` +
             `通过 ${totalTrades} 次交易，总计${profitPrefix} ¥${totalProfit}。吸取教训，东山再起！`;

    case 'playerChoice':
      return `你在第 ${props.gameStats.weeksPassed || 0} 周选择结束游戏，最终资产达到 ¥${formatNumber(props.gameStats.finalAssets || 0)}。`;

    default:
      return '游戏结束了，感谢你的游玩！';
  }
});

const getBestHouse = computed(() => {
  if (!props.player.purchasedHouses || props.player.purchasedHouses.length === 0) {
    return {};
  }
  return props.player.purchasedHouses.reduce((best, current) => {
    if ((current.level || 0) > (best.level || 0)) {
      return current;
    }
    if ((current.level || 0) === (best.level || 0) && (current.price || 0) > (best.price || 0)) {
      return current;
    }
    return best;
  }, props.player.purchasedHouses[0]);
});

const getMostExpensiveHouse = computed(() => {
  if (!props.player.purchasedHouses || props.player.purchasedHouses.length === 0) {
    return {};
  }
  return props.player.purchasedHouses.reduce((mostExpensive, current) => {
    return ((current.price || 0) > (mostExpensive.price || 0)) ? current : mostExpensive;
  }, props.player.purchasedHouses[0]);
});

const getScoreRank = computed(() => {
  if (props.gameStats.score) {
    if (props.gameStats.score.rank) {
      return props.gameStats.score.rank;
    }
    if (props.gameStats.score.score >= 1000000) {
      return 'S';
    }
    if (props.gameStats.score.score >= 800000) {
      return 'A';
    }
    if (props.gameStats.score.score >= 600000) {
      return 'B';
    }
    if (props.gameStats.score.score >= 400000) {
      return 'C';
    }
    return 'D';
  }
  return 'D';
});

const getFinalScore = computed(() => {
  if (props.gameStats.score) {
    if (props.gameStats.score.score) {
      return props.gameStats.score.score;
    }
    if (props.gameStats.finalAssets) {
      return props.gameStats.finalAssets;
    }
    return 0;
  }
  return 0;
});

// ==================== 方法 ====================

/**
 * 计算得分等级
 */
const calculateScoreRank = (score: number): string => {
  if (score >= 1000000) return 'S';
  if (score >= 800000) return 'A';
  if (score >= 600000) return 'B';
  if (score >= 400000) return 'C';
  if (score >= 200000) return 'D';
  return 'D';
};

/**
 * 获取房屋图片
 */
const getHouseImage = (house: any): string => {
  if (!house) return '/resources/assets/images/house_1.jpeg';

  // 记录日志帮助调试
  ui.debug('正在获取房产图片', { house }, 'get-house-image');

  // 根据房产ID选择对应图片
  if (house.id || house.houseId) {
    const houseId = house.id || house.houseId;
    
    // 根据房产ID返回相应的图片
    switch (String(houseId)) {
      case '1':
        return '/resources/assets/images/house_1.jpeg';
      case '2':
        return '/resources/assets/images/house_2.jpeg';
      case '3':
        return '/resources/assets/images/house_3.jpeg';
      case '4':
        return '/resources/assets/images/house_4.jpeg';
      case '5':
        return '/resources/assets/images/house_5.jpeg';
      default:
        return '/resources/assets/images/house_1.jpeg';
    }
  }

  // 如果有imageUrl直接使用
  if (house.imageUrl) return house.imageUrl;
  if (house.image) return house.image;

  // 默认返回第一张图片
  return '/resources/assets/images/house_1.jpeg';
};

/**
 * 返回主菜单
 */
const returnToMainMenu = (): void => {
  emit('return-to-main');
};

/**
 * 重新开始游戏
 */
const restartGame = (): void => {
  emit('restart-game');
};

/**
 * 继续游戏
 */
const continueGame = (): void => {
  // 添加调试日志
  game.debug('继续游戏按钮被点击', {}, 'continue-game-button');

  // 调用游戏核心存储的继续游戏方法
  try {
    const gameStore = useGameCoreStore();
    game.debug('获取到gameStore', { hasGameStore: Boolean(gameStore) }, 'get-game-store');

    if (!gameStore) {
      game.error('无法获取游戏存储', {}, 'get-game-store-failed');
      return;
    }

    // 直接调整gameStore状态
    gameStore.gameOver = false;
    gameStore.victoryAchieved = true;

    // 调用继续游戏方法
    if (typeof gameStore.continueGame === 'function') {
      gameStore.continueGame();
      game.debug('成功调用continueGame方法', {}, 'continue-game-success');
    } else {
      game.error('continueGame方法不存在', {}, 'continue-game-method-missing');
    }

    // 使用UI Store显示提示，而不是依赖通知系统
    try {
      const uiStore = useUiStore();
      if (uiStore && uiStore.showToast) {
        uiStore.showToast({
          type: 'success',
          message: '您选择继续游戏！您可以继续赚钱并购买更多房产，直到第52周游戏结束。',
          duration: 5000
        });
      }
    } catch (err) {
      game.warn('显示继续游戏提示失败', { error: err }, 'show-toast-failed');
    }

    // 发送事件给父组件
    emit('continue-game');
    game.debug('已发送continue-game事件', {}, 'continue-game-event-sent');
  } catch (error) {
    game.error('继续游戏时出错', { error }, 'continue-game-error');
  }
};

/**
 * 检查成就
 */
const checkAchievements = (): void => {
  // 重置成就
  achievements.value = [];

  // 检查各种成就条件
  const { gameStats, player } = props;
  
  if (gameStats && player) {
    const endReason = gameStats.endReason;
    
    // 早期胜利成就
    if (endReason === 'houseVictory' && gameStats.weeksPassed < 30) {
      achievements.value.push({
        name: '快速致富',
        description: '在30周内购买豪宅'
      });
    }

    // 无债务购房成就
    if (endReason === 'houseVictory' && player.debt <= 0) {
      achievements.value.push({
        name: '无债一身轻',
        description: '在没有债务的情况下购买豪宅'
      });
    }

    // 超高资产成就
    if (gameStats.finalAssets > 1500000) {
      achievements.value.push({
        name: '百万富翁',
        description: '最终资产超过150万'
      });
    }

    // 交易高手成就
    if (gameStats.tradeStats && gameStats.tradeStats.totalTrades > 100) {
      achievements.value.push({
        name: '交易大师',
        description: '完成超过100次交易'
      });
    }

    // 特定周数胜利成就
    if (endReason === 'houseVictory' && gameStats.weeksPassed < 40) {
      achievements.value.push({
        name: '时间管理高手',
        description: '在40周内购买豪宅'
      });
    }

    // 如果是玩到最后的胜利
    if (endReason === 'victoryTimeLimit') {
      achievements.value.push({
        name: '坚持不懈',
        description: '在购买豪宅后继续游戏到最后一周'
      });

      // 如果最终资产非常高
      if (gameStats.finalAssets > 2000000) {
        achievements.value.push({
          name: '财富帝国',
          description: '最终资产超过200万'
        });
      }
    }
  }

  // 触发动画
  nextTick(() => {
    animateResults();
  });
};

/**
 * 动画效果
 */
const animateResults = (): void => {
  // 这里可以添加动画效果，例如使用GSAP库
  // 简单实现：添加CSS类触发动画
  const elements = document.querySelectorAll('.stat-item:not(.core-stats .stat-item), .achievement-item');
  elements.forEach((el, index) => {
    setTimeout(() => {
      el.classList.add('animate-in');
    }, index * 100);
  });

  // 排名动画
  const rankElement = document.querySelector('.rank-animation');
  if (rankElement) {
    rankElement.classList.add('animate');
  }
};

// ==================== 生命周期 ====================

onMounted(() => {
  // 检查成就
  checkAchievements();
});
</script>

<style scoped>
/* 组件样式将保持不变，这里省略... */
.game-over-view {
  /* 样式内容 */
}

/* 其他样式保持原样 */
</style>