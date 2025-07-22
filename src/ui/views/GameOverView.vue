<template>
  <div class="game-over-view" :class="resultClass">
    <div class="game-over-container">
      <div class="header-section">
        <h1 class="title" :class="{'victory': isVictory, 'failure': isBankruptcy}">{{ getGameOverTitle }}</h1>
        <p class="subtitle">{{ getResultDescription }}</p>
      </div>
      
      <div class="result-summary">
        <div class="rank-display">
          <div class="rank-animation" :class="'rank-' + (gameStats.score?.rank || 'D')">
            <span class="rank-value">{{ gameStats.score?.rank || 'D' }}</span>
          </div>
          <div class="score-display">
            <div class="score-label">最终得分</div>
            <div class="score-value">{{ formatNumber(gameStats.score?.score || 0) }}</div>
          </div>
        </div>
        
        <!-- 核心统计数据，集中在一行 -->
        <div class="core-stats">
          <div class="stat-item">
            <div class="stat-label">游戏周数</div>
            <div class="stat-value">{{ gameStats.weeksPassed || 0 }} / {{ gameState.maxWeeks }}</div>
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
        <div class="house-details">
          <div class="house-image-container">
            <img :src="getHouseImage(player.purchasedHouses[0])" alt="房屋图片" class="house-image">
          </div>
          <div class="house-text">
            <h3 class="house-name">{{ player.purchasedHouses[0].name }}</h3>
            <p class="house-price">价格: ¥{{ formatNumber(player.purchasedHouses[0].purchasePrice || player.purchasedHouses[0].price) }}</p>
            <p class="house-week">购买时间: 第 {{ player.purchasedHouses[0].purchaseWeek || gameStats.week }} 周</p>
            <div class="victory-info">
              <div class="victory-badge">游戏通关!</div>
              <p class="victory-text">在{{ gameState.maxWeeks }}周游戏中，您仅用了{{ player.purchasedHouses[0].purchaseWeek || gameStats.week }}周就完成了购房目标!</p>
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
            <div class="victory-info">
              <div class="victory-badge">游戏通关!</div>
              <p class="victory-text">在{{ gameState.maxWeeks }}周游戏中，您仅用了{{ gameStats.week }}周就完成了购房目标!</p>
            </div>
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

<script>
import { formatNumber, formatCurrency, formatDate, formatGameTime } from '@/infrastructure/utils';
import { useGameCoreStore } from '@/stores/gameCore';

export default {
  name: 'GameOverView',
  props: {
    gameState: {
      type: Object,
      required: true
    },
    player: {
      type: Object,
      required: true
    },
    gameStats: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      showDetailedView: false,
      achievements: []
    };
  },
  computed: {
    canContinueGame() {
      // 检查是否可以继续游戏（房屋购买胜利）
      return this.gameStats.canContinue || this.gameStats.endReason === 'houseVictory';
    },
    resultClass() {
      const endReason = this.gameStats.endReason;
      if (endReason === 'victory' || endReason === 'achievement' || 
          endReason === 'victoryTimeLimit' || endReason === 'victoryOther' ||
          endReason === 'houseVictory') {
        return 'result-success';
      }
      if (endReason === 'bankruptcy') return 'result-failure';
      return 'result-neutral';
    },
    isVictory() {
      const endReason = this.gameStats.endReason;
      return endReason === 'victory' || 
             endReason === 'achievement' || 
             endReason === 'victoryTimeLimit' || 
             endReason === 'victoryOther' ||
             endReason === 'houseVictory';
    },
    isBankruptcy() {
      return this.gameStats.endReason === 'bankruptcy';
    },
    getGameOverTitle() {
      const endReason = this.gameStats.endReason;
      
      switch (endReason) {
        case 'houseVictory':
          return `恭喜！你成功购买了${this.gameStats.purchasedHouse?.name || '房产'}！`;
        case 'victory':
          return '恭喜！你成功购买了豪宅！';
        case 'victoryTimeLimit':
          return '游戏完成！你成功购买了豪宅并坚持到最后！';
        case 'victoryOther':
          return '游戏结束！你已经成功购买了豪宅！';
        case 'timeLimit':
          return '时间到！游戏结束';
        case 'bankruptcy':
          return '破产了！游戏结束';
        case 'achievement':
          return '成就达成！游戏结束';
        case 'playerChoice':
          return '你选择了结束游戏';
        default:
          return '游戏结束';
      }
    },
    getResultDescription() {
      const endReason = this.gameStats.endReason;
      const firstVictoryWeek = this.gameStats.data?.firstVictoryWeek;
      
      switch (endReason) {
        case 'victory':
          return `你在第 ${this.gameStats.weeksPassed || 0} 周成功购买了豪宅，真是太棒了！`;
        
        case 'victoryTimeLimit':
          return `你在第 ${firstVictoryWeek || '?'} 周成功购买了豪宅，并坚持到了第 ${this.gameStats.weeksPassed || 0} 周！最终资产达到了 ¥${this.formatNumber(this.gameStats.finalAssets || 0)}。`;
        
        case 'victoryOther':
          return `你在第 ${firstVictoryWeek || '?'} 周成功购买了豪宅，并在第 ${this.gameStats.weeksPassed || 0} 周结束了游戏。最终资产达到了 ¥${this.formatNumber(this.gameStats.finalAssets || 0)}。`;
        
        case 'timeLimit':
          return `52周时间已到，你积累了 ¥${this.formatNumber(this.gameStats.finalAssets || 0)} 的资产。`;
        
        case 'bankruptcy':
          return `你破产了！无法偿还 ¥${this.formatNumber(this.gameStats.data?.debt || 0)} 的债务。`;
        
        case 'achievement':
          return `你达成了特殊成就！资产达到 ¥${this.formatNumber(this.gameStats.finalAssets || 0)}。`;
        
        case 'playerChoice':
          return `你在第 ${this.gameStats.weeksPassed || 0} 周选择结束游戏，最终资产达到 ¥${this.formatNumber(this.gameStats.finalAssets || 0)}。`;
        
        default:
          return '游戏结束了，感谢你的游玩！';
      }
    },
    hasAchievements() {
      return this.achievements && this.achievements.length > 0;
    }
  },
  mounted() {
    // 加载成就数据
    this.loadAchievements();
    
    // 添加动画效果
    this.$nextTick(() => {
      this.animateScoreElements();
    });
  },
  methods: {
    formatNumber(num) {
      return formatNumber(num);
    },
    getHouseImage(house) {
      // 简单返回一个固定字符串，避免require可能导致的问题
      return house.image || '/placeholder_house.jpg';
    },
    returnToMainMenu() {
      this.$emit('return-to-main');
    },
    restartGame() {
      this.$emit('restart-game');
    },
    continueGame() {
      // 调用游戏核心存储的继续游戏方法
      const gameStore = useGameCoreStore();
      gameStore.continueGame();
      // 发送事件给父组件
      this.$emit('continue-game');
    },
    loadAchievements() {
      // 这里应该从游戏状态加载成就数据
      this.achievements = [];
      
      const endReason = this.gameStats.endReason;
      const weeksPassed = this.gameStats.weeksPassed;
      const firstVictoryWeek = this.gameStats.data?.firstVictoryWeek || weeksPassed;
      
      // 胜利相关成就
      if (this.isVictory) {
        // 购买豪宅成就
        this.achievements.push({
          name: '安家梦想',
          description: '成功购买豪宅'
        });
        
        // 根据购买时间添加不同的成就
        if (firstVictoryWeek < 30) {
          this.achievements.push({
            name: '房产投资大师',
            description: '在30周内购买豪宅'
          });
        } else if (firstVictoryWeek < 40) {
          this.achievements.push({
            name: '高效购房',
            description: '在40周内购买豪宅'
          });
        }
        
        // 如果是玩到最后的胜利
        if (endReason === 'victoryTimeLimit') {
          this.achievements.push({
            name: '坚持不懈',
            description: '在购买豪宅后继续游戏到最后一周'
          });
          
          // 如果最终资产非常高
          if (this.gameStats.finalAssets > 2000000) {
            this.achievements.push({
              name: '财富帝国',
              description: '最终资产超过200万'
            });
          }
        }
      }
      
      // 特殊成就
      if (endReason === 'achievement') {
        this.achievements.push({
          name: '百万富翁',
          description: '资产超过100万'
        });
      }
      
      // 交易相关成就
      if (this.gameStats.tradeStats && this.gameStats.tradeStats.totalProfit > 500000) {
        this.achievements.push({
          name: '交易大师',
          description: '总交易利润超过50万'
        });
      }
      
      if (this.gameStats.tradeStats && this.gameStats.tradeStats.totalTrades > 100) {
        this.achievements.push({
          name: '频繁交易者',
          description: '交易次数超过100次'
        });
      }
      
      // 破产成就
      if (endReason === 'bankruptcy') {
        this.achievements.push({
          name: '东山再起',
          description: '经历破产是成功的第一步'
        });
      }
      
      // 如果没有任何成就，添加一个参与奖
      if (this.achievements.length === 0) {
        this.achievements.push({
          name: '初次尝试',
          description: '完成一次游戏'
        });
      }
    },
    animateScoreElements() {
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
    }
  }
}
</script>

<style scoped>
.game-over-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 10px; /* 减小整体内边距 */
  color: #333;
}

.game-over-container {
  max-width: 800px; /* 减小最大宽度 */
  width: 100%;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  padding: 20px; /* 减小内边距 */
  overflow: auto;
  max-height: 85vh; /* 减小最大高度 */
}

.header-section {
  text-align: center;
  margin-bottom: 15px; /* 减小下边距 */
  padding-bottom: 15px; /* 减小下内边距 */
  border-bottom: 1px solid #eee;
}

.title {
  font-size: 2rem; /* 减小标题字体大小 */
  margin-bottom: 5px; /* 减小下边距 */
  color: #2c3e50;
}

.title.victory {
  color: #27ae60;
}

.title.failure {
  color: #e74c3c;
}

.subtitle {
  font-size: 1rem; /* 减小副标题字体大小 */
  color: #7f8c8d;
  margin-bottom: 0;
}

.rank-display {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 15px; /* 减小下边距 */
}

.rank-animation {
  width: 80px; /* 减小排名图标尺寸 */
  height: 80px; /* 减小排名图标尺寸 */
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 15px; /* 减小右边距 */
  font-size: 2.5rem; /* 减小字体大小 */
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
  font-size: 0.9rem; /* 减小标签字体大小 */
  color: #7f8c8d;
  margin-bottom: 2px; /* 减小下边距 */
}

.score-value {
  font-size: 1.6rem; /* 减小分数字体大小 */
  font-weight: bold;
  color: #2c3e50;
}

.statistics-section, .house-info, .score-breakdown, .location-stats, .suggestions, .achievements-section {
  margin-bottom: 15px; /* 减小下边距 */
  padding-bottom: 15px; /* 减小内边距 */
  border-bottom: 1px solid #eee;
}

h2 {
  font-size: 1.3rem; /* 减小标题字体大小 */
  color: #2c3e50;
  margin-bottom: 10px; /* 减小下边距 */
  position: relative;
  padding-left: 12px; /* 减小左内边距 */
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
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); /* 减小网格项最小宽度 */
  gap: 10px; /* 减小网格间隔 */
  margin-bottom: 10px; /* 减小下边距 */
}

.stat-item {
  display: flex;
  align-items: center;
  padding: 10px; /* 减小内边距 */
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, opacity 0.3s ease;
  opacity: 0;
  transform: translateY(10px);
}

.stat-item.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.stat-icon {
  font-size: 1.4rem; /* 减小图标大小 */
  margin-right: 10px; /* 减小右边距 */
  color: #3498db;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.8rem; /* 减小标签字体大小 */
  color: #7f8c8d;
  margin-bottom: 2px; /* 减小下边距 */
}

.stat-value {
  font-size: 1rem; /* 减小值字体大小 */
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
  padding: 15px; /* 减小内边距 */
  margin-bottom: 15px; /* 减小下边距 */
  background-color: #f5f7fa;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e1e8ed;
  position: relative;
  overflow: hidden;
}

.house-info h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #2c3e50;
  position: relative;
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
  gap: 15px; /* 减小间隔 */
}

.house-image-container {
  flex: 0 0 150px; /* 减小图片容器宽度 */
  height: 120px; /* 减小图片容器高度 */
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  border: 2px solid #fff;
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
  margin-top: 0;
  margin-bottom: 5px; /* 减小下边距 */
  color: #2c3e50;
  font-size: 1.2rem; /* 减小标题字体大小 */
}

.house-price {
  font-weight: bold;
  color: #e74c3c;
  margin-bottom: 5px; /* 减小下边距 */
}

.house-week {
  color: #7f8c8d;
  margin-bottom: 5px; /* 减小下边距 */
}

.house-desc {
  color: #34495e;
  font-style: italic;
  margin-bottom: 15px;
}

.victory-info {
  background: linear-gradient(to right, rgba(46, 204, 113, 0.1), rgba(52, 152, 219, 0.1));
  border-radius: 8px;
  padding: 10px; /* 减小内边距 */
  border-left: 3px solid #2ecc71;
  margin-top: 10px; /* 减小上边距 */
}

.victory-badge {
  display: inline-block;
  background: linear-gradient(to right, #2ecc71, #3498db);
  color: white;
  padding: 3px 8px; /* 减小内边距 */
  border-radius: 20px;
  font-weight: bold;
  margin-bottom: 5px; /* 减小下边距 */
  font-size: 0.9rem;
}

.victory-text {
  color: #2c3e50;
  margin: 0;
  font-size: 0.95rem;
}

.score-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); /* 减小网格项最小宽度 */
  gap: 10px; /* 减小间隔 */
}

.score-item {
  padding: 10px; /* 减小内边距 */
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, opacity 0.3s ease;
  opacity: 0;
  transform: translateY(20px);
}

.score-item.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.score-item.total {
  grid-column: 1 / -1;
  background-color: #3498db;
  color: white;
}

.score-item.total .score-item-label,
.score-item.total .score-item-value {
  color: white;
}

.score-item-label {
  font-size: 0.8rem; /* 减小标签字体大小 */
  color: #7f8c8d;
  margin-bottom: 2px; /* 减小下边距 */
}

.score-item-value {
  font-size: 1rem; /* 减小值字体大小 */
  font-weight: bold;
  color: #2c3e50;
}

.location-chart {
  margin-top: 10px; /* 减小上边距 */
}

.location-bar {
  display: flex;
  align-items: center;
  margin-bottom: 8px; /* 减小下边距 */
}

.location-name {
  width: 100px;
  font-size: 0.9rem;
  color: #7f8c8d;
  text-align: right;
  padding-right: 15px;
}

.bar-container {
  flex: 1;
  height: 25px;
  background-color: #f0f2f5;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.bar {
  height: 100%;
  background-color: #3498db;
  border-radius: 4px;
  transition: width 1s ease-out;
}

.bar-value {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.8rem;
  color: #333;
  font-weight: bold;
}

.suggestion-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.suggestion-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 8px; /* 减小下边距 */
  padding: 10px; /* 减小内边距 */
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, opacity 0.3s ease;
  opacity: 0;
  transform: translateY(20px);
}

.suggestion-item.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.suggestion-icon {
  margin-right: 15px;
  font-size: 1.2rem;
}

.suggestion-text {
  flex: 1;
  font-size: 0.95rem;
  line-height: 1.5;
  color: #2c3e50;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); /* 减小网格项最小宽度 */
  gap: 10px; /* 减小间隔 */
}

.achievement-item {
  display: flex;
  align-items: center;
  padding: 10px; /* 减小内边距 */
  background-color: #fff3cd;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.achievement-icon {
  font-size: 2rem;
  margin-right: 15px;
  color: #ffc107;
}

.achievement-content {
  flex: 1;
}

.achievement-name {
  font-size: 1.1rem;
  font-weight: bold;
  color: #856404;
  margin-bottom: 5px;
}

.achievement-desc {
  font-size: 0.9rem;
  color: #856404;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 10px; /* 减小按钮间间隔 */
  margin-top: 15px; /* 减小上边距 */
}

.btn {
  padding: 8px 15px; /* 减小按钮内边距 */
  border: none;
  border-radius: 6px;
  font-size: 0.9rem; /* 减小按钮字体大小 */
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
}

.btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.btn-icon {
  margin-right: 8px;
  font-size: 1.2rem;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-success {
  background-color: #2ecc71;
  color: white;
}

.btn-info {
  background-color: #9b59b6;
  color: white;
}

/* 新增的样式 */
.core-stats {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 15px;
}

.core-stats .stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 8px;
  text-align: center;
  transform: none;
  opacity: 1;
}

.core-stats .stat-label {
  font-size: 0.8rem;
  color: #7f8c8d;
  margin-bottom: 5px;
}

.core-stats .stat-value {
  font-size: 1.1rem;
  font-weight: bold;
  color: #2c3e50;
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

/* 结果颜色主题 */
.result-success {
  background-color: #e6f7ef;
}

.result-failure {
  background-color: #fbeae8;
}

.result-neutral {
  background-color: #f5f7fa;
}

@media (max-width: 576px) {
  /* 在小屏幕上进一步优化布局 */
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
</style> 