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

const getVictoryBadgeText = computed(() => {
  if (props.player.purchasedHouses && props.player.purchasedHouses.length > 0) {
    return props.player.purchasedHouses.length > 1 ? '豪华置业' : '安家置业';
  }
  return '游戏通关!';
});

const getVictoryDescription = computed(() => {
  const firstHouse = props.player.purchasedHouses && props.player.purchasedHouses.length > 0
    ? props.player.purchasedHouses[0]
    : null;

  if (!firstHouse) {
    return `在${props.gameState.maxWeeks}周游戏中，您成功通关!`;
  }

  const firstWeek = firstHouse.purchaseWeek || props.gameStats.week;
  const houseCount = props.player.purchasedHouses.length;

  if (houseCount > 1) {
    return `在${props.gameState.maxWeeks}周游戏中，您共购买了${houseCount}套房产，首套房产仅用了${firstWeek}周就购得!`;
  }

  return `在${props.gameState.maxWeeks}周游戏中，您仅用了${firstWeek}周就完成了购房目标!`;
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
 * 更新得分显示
 */
const updateScoreDisplay = (): void => {
  // 强制刷新得分显示
  game.debug('强制刷新得分显示', {}, 'force-refresh-score');
  // 如果得分为0但有净资产，尝试基于净资产计算一个默认得分
  if (getFinalScore.value === 0 && props.gameStats.finalAssets && props.gameStats.finalAssets > 0) {
    game.debug('检测到得分为0但有净资产，尝试计算默认得分', { finalAssets: props.gameStats.finalAssets }, 'calculate-default-score');
    // 直接基于净资产计算得分
    const calculatedScore = Math.floor(props.gameStats.finalAssets / 500);
    // 创建完整的得分对象
    const newScore = {
      score: calculatedScore,
      rank: calculateScoreRank(calculatedScore),
      details: {
        assetsScore: Math.floor(props.gameStats.finalAssets / 800),
        timeScore: 0,
        houseScore: 0,
        tradeScore: 0,
        bankScore: 0,
        totalScore: calculatedScore
      }
    };
    // 注意：在Setup Script中我们不能直接修改props，这里只是为了兼容原有逻辑
    // 实际项目中应该通过emit事件通知父组件更新
    Object.assign(props.gameStats, { score: newScore });
  }
};

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

  // 确保使用house.imageUrl或正确的图片路径
  // 根据房产ID选择对应图片，使用正确的路径
  if (house.id || house.houseId) {
    const houseId = house.id || house.houseId;

    // 特定ID到图片的映射
    const imageMap = {
      'apartment': '/resources/assets/images/house_1.jpeg',
      'second_hand': '/resources/assets/images/house_2.jpeg',
      'highend': '/resources/assets/images/house_3.jpeg',
      'villa': '/resources/assets/images/house_4.jpeg',
      'mansion': '/resources/assets/images/house_5.jpeg'
    };

    // 先检查是否为预定义的房屋ID
    if (imageMap[houseId as keyof typeof imageMap]) {
      return imageMap[houseId as keyof typeof imageMap];
    }

    // 如果不是预定义ID，尝试解析为数字
    const parsedId = parseInt(String(houseId));
    // 如果解析成功，使用对应索引；否则使用默认值1
    const imageIndex = !isNaN(parsedId) ? (parsedId % 5 || 1) : 1;
    return `/resources/assets/images/house_${imageIndex}.jpeg`;
  }

  // 如果存在imageUrl则优先使用
  if (house.imageUrl) return house.imageUrl;
  if (house.image) {
    // 确保image路径正确，添加前导/如果不存在
    if (house.image.startsWith('./')) {
      return house.image.replace('./', '/');
    } else if (!house.image.startsWith('/')) {
      return `/${house.image}`;
    }
    // 如果路径包含NaN，使用默认图片
    if (house.image.includes('NaN')) {
      return '/resources/assets/images/house_1.jpeg';
    }
    return house.image;
  }

  // 默认图片
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
  // 更新得分显示
  updateScoreDisplay();
  // 检查成就
  checkAchievements();
});
</script>

<style scoped>
/* 基础布局样式 */
.game-over-view {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: auto;
  width: 100%;
  background-color: transparent;
  color: #333;
  margin: 0;
}

.game-over-container {
  position: relative;
  max-width: 600px;
  width: 100%;
  background-color: white;
  border-radius: 30px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3), 0 5px 15px rgba(0, 0, 0, 0.2);
  padding: 15px 18px 15px 18px;
  overflow-y: auto;
  max-height: 85vh;
  border: 2px solid rgba(255, 255, 255, 0.95);
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.game-over-container::-webkit-scrollbar {
  display: none;
}

/* 头部和排名样式 */
.header-section {
  text-align: center;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.title {
  font-size: 1.6rem;
  margin: 0 0 3px 0;
  color: #2c3e50;
}

.title.victory {
  color: #27ae60;
}

.title.failure {
  color: #e74c3c;
}

.subtitle {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin: 0 0 5px 0;
}

.rank-display {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 10px;
}

.rank-animation {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 15px;
  font-size: 2.2rem;
  font-weight: bold;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.rank-animation::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
  opacity: 0;
}

.rank-animation.animate::before {
  animation: pulse 2s ease-in-out;
}

@keyframes pulse {
  0% { opacity: 0; transform: scale(0.5); }
  50% { opacity: 1; transform: scale(1.2); }
  100% { opacity: 0; transform: scale(2); }
}

.rank-S {
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: white;
}

.rank-A {
  background: linear-gradient(135deg, #c0c0c0, #a0a0a0);
  color: white;
}

.rank-B {
  background: linear-gradient(135deg, #cd7f32, #a05a2c);
  color: white;
}

.rank-C {
  background: linear-gradient(135deg, #4a90e2, #357abd);
  color: white;
}

.rank-D {
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  color: white;
}

.rank-E {
  background: linear-gradient(135deg, #95a5a6, #7f8c8d);
  color: white;
}

.score-display {
  text-align: left;
}

.score-label {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-bottom: 2px;
}

.score-value {
  font-size: 1.6rem;
  font-weight: bold;
  color: #2c3e50;
}

/* 统计和房产样式 */
.statistics-section, .house-info, .score-breakdown, .location-stats, .suggestions, .achievements-section {
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

h2 {
  font-size: 1.2rem;
  color: #2c3e50;
  margin-bottom: 8px;
  position: relative;
  padding-left: 10px;
}

h2::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 5px;
  height: 20px;
  background-color: #3498db;
  border-radius: 3px;
}

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 6px;
  margin-bottom: 6px;
}

.stat-item {
  display: flex;
  align-items: center;
  padding: 6px;
  background-color: #f8f9fa;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  opacity: 1;
  transform: none;
}

.stat-item.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.stat-icon {
  font-size: 1.2rem;
  margin-right: 8px;
  color: #3498db;
  background: rgba(52, 152, 219, 0.1);
  padding: 5px;
  border-radius: 50%;
  height: 30px;
  width: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.75rem;
  color: #7f8c8d;
  margin-bottom: 1px;
}

.stat-value {
  font-size: 0.9rem;
  font-weight: bold;
  color: #2c3e50;
}

.stat-value.positive {
  color: #27ae60;
}

.stat-value.negative {
  color: #e74c3c;
}

.house-info {
  padding: 12px;
  margin-bottom: 12px;
  background: linear-gradient(to bottom right, #f8f9fa, #e9ecef);
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(225, 232, 237, 0.8);
  position: relative;
  overflow: hidden;
}

.house-info h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #2c3e50;
  position: relative;
  font-size: 1.2rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

.house-info h2:after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -8px;
  width: 60px;
  height: 3px;
  background: linear-gradient(to right, #3498db, #2ecc71);
  border-radius: 3px;
}

.house-details {
  display: flex;
  gap: 8px;
}

.house-image-container {
  flex: 0 0 100px;
  height: 80px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #fff;
}

.house-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.house-text {
  flex: 1;
}

.house-name {
  margin: 0 0 3px 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.house-price, .house-week {
  margin: 0 0 3px 0;
  font-size: 0.9rem;
}

.best-house-badge {
  font-size: 0.7rem;
  background-color: #8e44ad;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 5px;
  vertical-align: middle;
}

/* 成就样式 */
.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 6px;
}

.achievement-item {
  display: flex;
  align-items: center;
  padding: 6px;
  background-color: #fff3cd;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  opacity: 1;
  transform: none;
}

.achievement-icon {
  font-size: 1.6rem;
  margin-right: 10px;
  color: #ffc107;
  background: rgba(255, 193, 7, 0.2);
  padding: 5px;
  border-radius: 50%;
  height: 35px;
  width: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.achievement-content {
  flex: 1;
}

.achievement-name {
  font-size: 1rem;
  font-weight: bold;
  color: #856404;
  margin-bottom: 3px;
}

.achievement-desc {
  font-size: 0.85rem;
  color: #856404;
}

/* 多套房产样式 */
.all-houses-container {
  margin-top: 15px;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  padding: 10px;
}

.all-houses-container h3 {
  margin-top: 5px;
  margin-bottom: 10px;
  font-size: 0.95rem;
  color: #555;
}

.houses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}

.mini-house-card {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
}

.mini-house-image {
  height: 80px;
  overflow: hidden;
}

.mini-house-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mini-house-info {
  padding: 8px;
}

.mini-house-name {
  font-weight: bold;
  font-size: 0.8rem;
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mini-house-price {
  color: #e74c3c;
  font-size: 0.75rem;
  margin-bottom: 2px;
}

.mini-house-week {
  color: #7f8c8d;
  font-size: 0.7rem;
}

/* 核心统计样式 */
.core-stats {
  display: flex;
  justify-content: space-between;
  gap: 5px;
  margin-bottom: 8px;
}

.core-stats .stat-item {
  padding: 5px;
  margin: 0;
  background-color: #f8f9fa;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.core-stats .stat-item:hover {
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.core-stats .stat-label {
  font-size: 0.8rem;
  color: #7f8c8d;
  margin-bottom: 5px;
}

.core-stats .stat-value {
  font-size: 1rem;
}

/* 得分明细样式 */
.score-details-section {
  margin-top: 15px;
  padding: 15px;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
}

.score-details-section h2 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 1.1rem;
  color: #34495e;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

.score-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}

.stat-bonus {
  margin-top: 5px;
  font-size: 0.7rem;
  color: #8e44ad;
  font-style: italic;
}

/* 按钮样式 */
.actions {
  padding: 12px 10px 15px;
  border-top: 1px solid rgba(238, 238, 238, 0.5);
  margin-top: 12px;
  margin-bottom: 0;
  display: flex;
  justify-content: center;
  gap: 12px;
  border-radius: 0 0 30px 30px;
  background: linear-gradient(to bottom, rgba(255,255,255,0.8), rgba(249,249,249,0.95));
  position: sticky;
  bottom: -15px;
  left: 0;
  right: 0;
  margin-left: -18px;
  margin-right: -18px;
  padding-left: 18px;
  padding-right: 18px;
  z-index: 100;
  box-shadow: 0 -5px 10px rgba(0,0,0,0.05);
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1rem;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  min-width: 140px;
}

.btn:after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(to bottom right, rgba(255,255,255,0.2), rgba(255,255,255,0));
  transform: rotate(45deg);
  transition: all 0.5s;
  opacity: 0;
}

.btn:hover:after {
  opacity: 1;
  top: -100%;
  left: -100%;
}

.btn:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

.btn:active {
  transform: translateY(1px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.btn-icon {
  margin-right: 8px;
  font-size: 1.2rem;
}

.btn-primary {
  background: linear-gradient(135deg, #3498db, #2980b9);
}

.btn-success {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: white;
}

.actions button:first-child {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  box-shadow: 0 4px 12px rgba(46, 204, 113, 0.3);
  transform: scale(1.05);
  animation: pulse-green 2s infinite;
}

@keyframes pulse-green {
  0% {
    box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.5);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(46, 204, 113, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(46, 204, 113, 0);
  }
}

/* 悬停效果 */
.stat-item, .achievement-item {
  transition: transform 0.3s ease, opacity 0.3s ease, box-shadow 0.3s ease;
}

.stat-item:hover, .achievement-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .game-over-container {
    padding: 20px;
  }

  .title {
    font-size: 2rem;
  }

  .statistics-grid, .score-items, .achievements-grid {
    grid-template-columns: 1fr;
  }

  .house-details {
    flex-direction: column;
  }

  .house-image-container {
    width: 100%;
  }

  .actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}

@media (max-width: 576px) {
  .house-details {
    flex-direction: column;
  }

  .house-image-container {
    width: 100%;
    height: 100px;
    margin-bottom: 10px;
  }

  .statistics-grid {
    grid-template-columns: 1fr;
  }

  .score-items {
    grid-template-columns: 1fr;
  }

  .achievements-grid {
    grid-template-columns: 1fr;
  }
}

/* 优化样式 */
.achievements-section, .statistics-section {
  margin-bottom: 8px;
  padding-bottom: 8px;
}

h2 {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 3px 0 6px 0;
  position: relative;
  padding-left: 8px;
}

h2::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 16px;
  background-color: #3498db;
  border-radius: 2px;
}

.statistics-grid, .achievements-grid {
  margin-top: 5px;
}
</style>