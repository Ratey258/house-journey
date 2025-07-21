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
        
        <div class="statistics-section">
          <h2>游戏统计</h2>
          <div class="statistics-grid">
            <div class="stat-item">
              <div class="stat-icon">📅</div>
              <div class="stat-content">
                <div class="stat-label">游戏周数</div>
                <div class="stat-value">{{ gameStats.weeksPassed || 0 }} / {{ gameState.maxWeeks || 52 }}</div>
              </div>
            </div>
            
            <div class="stat-item">
              <div class="stat-icon">💰</div>
              <div class="stat-content">
                <div class="stat-label">最终资金</div>
                <div class="stat-value">¥{{ formatNumber(gameStats.finalMoney || 0) }}</div>
              </div>
            </div>
            
            <div class="stat-item">
              <div class="stat-icon">📊</div>
              <div class="stat-content">
                <div class="stat-label">总资产</div>
                <div class="stat-value">¥{{ formatNumber(gameStats.finalAssets || 0) }}</div>
              </div>
            </div>
            
            <div class="stat-item">
              <div class="stat-icon">🔄</div>
              <div class="stat-content">
                <div class="stat-label">交易次数</div>
                <div class="stat-value">{{ gameStats.tradeStats?.totalTrades || 0 }}</div>
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
            
            <div class="stat-item">
              <div class="stat-icon">💎</div>
              <div class="stat-content">
                <div class="stat-label">平均交易利润</div>
                <div class="stat-value">¥{{ formatNumber(gameStats.tradeStats?.averageProfit || 0) }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="player.purchasedHouses && player.purchasedHouses.length > 0" class="house-info">
          <h2>已购房产</h2>
          <div class="house-details">
            <div class="house-image-container">
              <img :src="getHouseImage(player.purchasedHouses[0])" alt="房屋图片" class="house-image">
            </div>
            <div class="house-text">
              <h3 class="house-name">{{ player.purchasedHouses[0].name }}</h3>
              <p class="house-price">价格: ¥{{ formatNumber(player.purchasedHouses[0].price) }}</p>
              <p class="house-week">购买时间: 第 {{ player.purchasedHouses[0].purchaseWeek }} 周</p>
              <p class="house-desc">{{ player.purchasedHouses[0].description }}</p>
            </div>
          </div>
        </div>
        
        <div class="score-breakdown">
          <h2>得分详情</h2>
          <div class="score-items">
            <div class="score-item">
              <div class="score-item-label">资产得分</div>
              <div class="score-item-value">{{ formatNumber(gameStats.score?.details?.assetsScore || 0) }}</div>
            </div>
            <div class="score-item">
              <div class="score-item-label">时间效率得分</div>
              <div class="score-item-value">{{ formatNumber(gameStats.score?.details?.timeScore || 0) }}</div>
            </div>
            <div class="score-item">
              <div class="score-item-label">房产价值得分</div>
              <div class="score-item-value">{{ formatNumber(gameStats.score?.details?.houseScore || 0) }}</div>
            </div>
            <div class="score-item">
              <div class="score-item-label">交易效率得分</div>
              <div class="score-item-value">{{ formatNumber(gameStats.score?.details?.tradeScore || 0) }}</div>
            </div>
            <div class="score-item">
              <div class="score-item-label">事件处理得分</div>
              <div class="score-item-value">{{ formatNumber(gameStats.score?.details?.eventScore || 0) }}</div>
            </div>
            <div class="score-item total">
              <div class="score-item-label">总分</div>
              <div class="score-item-value">{{ formatNumber(gameStats.score?.score || 0) }}</div>
            </div>
          </div>
        </div>
        
        <div v-if="gameStats.locationStats && gameStats.locationStats.length > 0" class="location-stats">
          <h2>地点访问统计</h2>
          <div class="location-chart">
            <div v-for="(location, index) in gameStats.locationStats.slice(0, 5)" :key="index" class="location-bar">
              <div class="location-name">{{ location.locationName }}</div>
              <div class="bar-container">
                <div class="bar" :style="{width: getLocationBarWidth(location.visitCount)}"></div>
                <span class="bar-value">{{ location.visitCount }}次</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="suggestions">
          <h2>游戏建议</h2>
          <ul class="suggestion-list">
            <li v-for="(suggestion, index) in gameStats.suggestions" :key="index" class="suggestion-item">
              <div class="suggestion-icon">💡</div>
              <div class="suggestion-text">{{ suggestion }}</div>
            </li>
          </ul>
        </div>
        
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
      </div>
      
      <div class="actions">
        <button @click="showDetailedStats" class="btn btn-info">
          <span class="btn-icon">📊</span>
          <span class="btn-text">详细统计</span>
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
    resultClass() {
      const endReason = this.gameStats.endReason;
      if (endReason === 'victory' || endReason === 'achievement' || 
          endReason === 'victoryTimeLimit' || endReason === 'victoryOther') {
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
             endReason === 'victoryOther';
    },
    isBankruptcy() {
      return this.gameStats.endReason === 'bankruptcy';
    },
    getGameOverTitle() {
      const endReason = this.gameStats.endReason;
      
      switch (endReason) {
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
      return house.image || require('@/assets/images/houses/default-house.png');
    },
    returnToMainMenu() {
      this.$emit('return-to-main');
    },
    showDetailedStats() {
      this.showDetailedView = !this.showDetailedView;
      this.$emit('show-detailed-stats');
    },
    restartGame() {
      this.$emit('restart-game');
    },
    getLocationBarWidth(visitCount) {
      if (!this.gameStats.locationStats || this.gameStats.locationStats.length === 0) return '0%';
      
      const maxVisits = Math.max(...this.gameStats.locationStats.map(loc => loc.visitCount));
      if (maxVisits === 0) return '0%';
      
      return `${(visitCount / maxVisits * 100).toFixed(0)}%`;
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
      const elements = document.querySelectorAll('.stat-item, .score-item, .suggestion-item');
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
  padding: 20px;
  color: #333;
}

.game-over-container {
  max-width: 900px;
  width: 100%;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  padding: 30px;
  overflow: auto;
  max-height: 90vh;
}

.header-section {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.title {
  font-size: 2.5rem;
  margin-bottom: 10px;
  color: #2c3e50;
}

.title.victory {
  color: #27ae60;
}

.title.failure {
  color: #e74c3c;
}

.subtitle {
  font-size: 1.2rem;
  color: #7f8c8d;
  margin-bottom: 0;
}

.rank-display {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 30px;
}

.rank-animation {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 20px;
  font-size: 3rem;
  font-weight: bold;
  position: relative;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
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
  font-size: 1rem;
  color: #7f8c8d;
  margin-bottom: 5px;
}

.score-value {
  font-size: 2rem;
  font-weight: bold;
  color: #2c3e50;
}

.statistics-section, .house-info, .score-breakdown, .location-stats, .suggestions, .achievements-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

h2 {
  font-size: 1.5rem;
  color: #2c3e50;
  margin-bottom: 20px;
  position: relative;
  padding-left: 15px;
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
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, opacity 0.3s ease;
  opacity: 0;
  transform: translateY(20px);
}

.stat-item.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.stat-icon {
  font-size: 1.8rem;
  margin-right: 15px;
  color: #3498db;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: bold;
  color: #2c3e50;
}

.stat-value.positive {
  color: #27ae60;
}

.stat-value.negative {
  color: #e74c3c;
}

.house-details {
  display: flex;
  background-color: #f8f9fa;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.house-image-container {
  width: 200px;
  height: 150px;
  overflow: hidden;
}

.house-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.house-text {
  flex: 1;
  padding: 15px;
}

.house-name {
  font-size: 1.3rem;
  font-weight: bold;
  margin-bottom: 10px;
  color: #2c3e50;
}

.house-price {
  font-size: 1.1rem;
  color: #e74c3c;
  font-weight: bold;
  margin-bottom: 5px;
}

.house-week {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-bottom: 10px;
}

.house-desc {
  font-size: 0.9rem;
  color: #7f8c8d;
  line-height: 1.5;
}

.score-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.score-item {
  padding: 12px;
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
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-bottom: 5px;
}

.score-item-value {
  font-size: 1.2rem;
  font-weight: bold;
  color: #2c3e50;
}

.location-chart {
  margin-top: 20px;
}

.location-bar {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
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
  margin-bottom: 15px;
  padding: 12px;
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
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.achievement-item {
  display: flex;
  align-items: center;
  padding: 15px;
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
  gap: 15px;
  margin-top: 30px;
}

.btn {
  padding: 12px 25px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
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
</style> 