<template>
  <div class="game-stats-detail" v-if="show">
    <div class="stats-modal">
      <div class="stats-header">
        <h2>详细游戏统计</h2>
        <button class="close-btn" @click="close">×</button>
      </div>
      
      <div class="stats-content">
        <div class="stats-tabs">
          <button 
            v-for="(tab, index) in tabs" 
            :key="index" 
            class="tab-btn" 
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            {{ tab.name }}
          </button>
        </div>
        
        <div class="tab-content">
          <!-- 交易统计 -->
          <div v-if="activeTab === 'trades'" class="trade-stats">
            <div class="stats-summary">
              <div class="summary-item">
                <div class="summary-label">总交易次数</div>
                <div class="summary-value">{{ gameStats.tradeStats.totalTrades }}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">总交易利润</div>
                <div class="summary-value" :class="{'positive': gameStats.tradeStats.totalProfit > 0, 'negative': gameStats.tradeStats.totalProfit < 0}">
                  {{ gameStats.tradeStats.totalProfit > 0 ? '+' : '' }}¥{{ formatNumber(gameStats.tradeStats.totalProfit) }}
                </div>
              </div>
              <div class="summary-item">
                <div class="summary-label">平均交易利润</div>
                <div class="summary-value">¥{{ formatNumber(gameStats.tradeStats.averageProfit) }}</div>
              </div>
            </div>
            
            <h3>最赚钱商品</h3>
            <div class="profit-items" v-if="player.statistics && player.statistics.productProfits">
              <div v-for="(profit, productId) in player.statistics.productProfits" :key="productId" class="profit-item">
                <div class="product-name">{{ getProductName(productId) }}</div>
                <div class="profit-bar-container">
                  <div class="profit-bar" :style="{ width: getProfitBarWidth(profit), backgroundColor: profit > 0 ? '#27ae60' : '#e74c3c' }"></div>
                  <span class="profit-value">¥{{ formatNumber(profit) }}</span>
                </div>
              </div>
            </div>
            
            <h3>交易历史趋势</h3>
            <div class="trade-chart">
              <!-- 这里可以添加交易历史图表，例如使用 Chart.js 或其他图表库 -->
              <div class="chart-placeholder">
                <p>交易历史图表将在未来版本中添加</p>
              </div>
            </div>
          </div>
          
          <!-- 地点统计 -->
          <div v-if="activeTab === 'locations'" class="location-stats">
            <h3>地点访问频率</h3>
            <div class="location-chart">
              <div v-for="(location, index) in gameStats.locationStats" :key="index" class="location-bar">
                <div class="location-name">{{ location.locationName }}</div>
                <div class="bar-container">
                  <div class="bar" :style="{width: getLocationBarWidth(location.visitCount)}"></div>
                  <span class="bar-value">{{ location.visitCount }}次</span>
                </div>
              </div>
            </div>
            
            <h3>地点交易利润</h3>
            <div class="location-profit-chart" v-if="player.statistics && player.statistics.locationProfits">
              <div v-for="(profit, locationId) in player.statistics.locationProfits" :key="locationId" class="location-profit-bar">
                <div class="location-name">{{ getLocationName(locationId) }}</div>
                <div class="profit-bar-container">
                  <div class="profit-bar" :style="{ width: getProfitBarWidth(profit), backgroundColor: profit > 0 ? '#27ae60' : '#e74c3c' }"></div>
                  <span class="profit-value">¥{{ formatNumber(profit) }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 事件统计 -->
          <div v-if="activeTab === 'events'" class="event-stats">
            <div class="stats-summary">
              <div class="summary-item">
                <div class="summary-label">总事件数</div>
                <div class="summary-value">{{ gameStats.eventStats.totalEvents }}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">正面结果</div>
                <div class="summary-value positive">{{ gameStats.eventStats.positiveOutcomes }}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">负面结果</div>
                <div class="summary-value negative">{{ gameStats.eventStats.negativeOutcomes }}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">中性结果</div>
                <div class="summary-value">{{ gameStats.eventStats.totalEvents - gameStats.eventStats.positiveOutcomes - gameStats.eventStats.negativeOutcomes }}</div>
              </div>
            </div>
            
            <h3>事件类型分布</h3>
            <div class="event-type-chart" v-if="player.statistics && player.statistics.eventTypes">
              <div class="event-types-grid">
                <div v-for="(count, type) in player.statistics.eventTypes" :key="type" class="event-type-item">
                  <div class="event-type-icon">{{ getEventTypeIcon(type) }}</div>
                  <div class="event-type-content">
                    <div class="event-type-name">{{ getEventTypeName(type) }}</div>
                    <div class="event-type-count">{{ count }}次</div>
                  </div>
                </div>
              </div>
            </div>
            
            <h3>重要事件记录</h3>
            <div class="important-events" v-if="player.statistics && player.statistics.importantEvents">
              <div v-for="(event, index) in player.statistics.importantEvents" :key="index" class="important-event-item">
                <div class="event-week">第{{ event.week }}周</div>
                <div class="event-content">
                  <div class="event-title">{{ event.title }}</div>
                  <div class="event-description">{{ event.description }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 资产统计 -->
          <div v-if="activeTab === 'assets'" class="asset-stats">
            <div class="stats-summary">
              <div class="summary-item">
                <div class="summary-label">最终资金</div>
                <div class="summary-value">¥{{ formatNumber(gameStats.finalMoney) }}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">最终债务</div>
                <div class="summary-value negative">¥{{ formatNumber(player.debt) }}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">库存价值</div>
                <div class="summary-value">¥{{ formatNumber(getInventoryValue()) }}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">房产价值</div>
                <div class="summary-value">¥{{ formatNumber(getHousesValue()) }}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">总资产</div>
                <div class="summary-value">¥{{ formatNumber(gameStats.finalAssets) }}</div>
              </div>
            </div>
            
            <h3>资产变化历史</h3>
            <div class="asset-chart">
              <!-- 这里可以添加资产变化历史图表 -->
              <div class="chart-placeholder">
                <p>资产变化历史图表将在未来版本中添加</p>
              </div>
            </div>
            
            <h3>最终库存</h3>
            <div class="inventory-list">
              <table class="inventory-table">
                <thead>
                  <tr>
                    <th>商品</th>
                    <th>数量</th>
                    <th>购买价格</th>
                    <th>当前价值</th>
                    <th>利润/损失</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in player.inventory" :key="item.productId">
                    <td>{{ getProductName(item.productId) }}</td>
                    <td>{{ item.quantity }}</td>
                    <td>¥{{ formatNumber(item.purchasePrice) }}</td>
                    <td>¥{{ formatNumber(getCurrentPrice(item.productId)) }}</td>
                    <td :class="{'positive': getCurrentPrice(item.productId) > item.purchasePrice, 'negative': getCurrentPrice(item.productId) < item.purchasePrice}">
                      {{ getCurrentPrice(item.productId) > item.purchasePrice ? '+' : '' }}¥{{ formatNumber((getCurrentPrice(item.productId) - item.purchasePrice) * item.quantity) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GameStatsDetail',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    gameStats: {
      type: Object,
      required: true
    },
    player: {
      type: Object,
      required: true
    },
    gameState: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      activeTab: 'trades',
      tabs: [
        { id: 'trades', name: '交易统计' },
        { id: 'locations', name: '地点统计' },
        { id: 'events', name: '事件统计' },
        { id: 'assets', name: '资产统计' }
      ]
    };
  },
  methods: {
    close() {
      this.$emit('close');
    },
    formatNumber(num) {
      if (num === undefined || num === null) return '0';
      return num.toLocaleString('zh-CN');
    },
    getLocationName(locationId) {
      // 这里应该从游戏状态中获取地点名称
      const location = this.gameStats.locationStats.find(loc => loc.locationId === locationId);
      return location ? location.locationName : '未知地点';
    },
    getProductName(productId) {
      // 这里应该从游戏状态中获取商品名称
      // 简单实现，实际应该从商品列表中查找
      return productId || '未知商品';
    },
    getEventTypeIcon(type) {
      // 根据事件类型返回对应的图标
      const icons = {
        'random': '🎲',
        'story': '📖',
        'location': '🏙️',
        'market': '📊',
        'personal': '👤',
        'tutorial': '📝'
      };
      return icons[type] || '❓';
    },
    getEventTypeName(type) {
      // 根据事件类型返回对应的名称
      const names = {
        'random': '随机事件',
        'story': '故事事件',
        'location': '地点事件',
        'market': '市场事件',
        'personal': '个人事件',
        'tutorial': '教程事件'
      };
      return names[type] || '未知类型';
    },
    getLocationBarWidth(visitCount) {
      if (!this.gameStats.locationStats || this.gameStats.locationStats.length === 0) return '0%';
      
      const maxVisits = Math.max(...this.gameStats.locationStats.map(loc => loc.visitCount));
      if (maxVisits === 0) return '0%';
      
      return `${(visitCount / maxVisits * 100).toFixed(0)}%`;
    },
    getProfitBarWidth(profit) {
      // 计算利润条的宽度
      const maxProfit = 10000; // 设置一个合理的最大值
      const percentage = Math.min(Math.abs(profit) / maxProfit * 100, 100);
      return `${percentage.toFixed(0)}%`;
    },
    getInventoryValue() {
      // 计算库存总价值
      return this.player.inventory.reduce((sum, item) => {
        return sum + (this.getCurrentPrice(item.productId) * item.quantity);
      }, 0);
    },
    getHousesValue() {
      // 计算房产总价值
      return this.player.purchasedHouses.reduce((sum, house) => {
        return sum + house.purchasePrice;
      }, 0);
    },
    getCurrentPrice(productId) {
      // 获取商品当前价格
      // 简单实现，实际应该从商品价格列表中查找
      const item = this.player.inventory.find(i => i.productId === productId);
      return item ? item.purchasePrice : 0;
    }
  }
}
</script>

<style scoped>
.game-stats-detail {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1100;
  display: flex;
  justify-content: center;
  align-items: center;
}

.stats-modal {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 1000px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.stats-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  color: #7f8c8d;
}

.stats-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.stats-tabs {
  display: flex;
  border-bottom: 1px solid #eee;
  background-color: #f8f9fa;
}

.tab-btn {
  padding: 12px 20px;
  border: none;
  background: none;
  font-size: 1rem;
  cursor: pointer;
  color: #7f8c8d;
  position: relative;
  transition: all 0.2s ease;
}

.tab-btn.active {
  color: #3498db;
  font-weight: 500;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: #3498db;
}

.tab-content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.stats-summary {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 15px;
  margin-bottom: 25px;
}

.summary-item {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.summary-label {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-bottom: 5px;
}

.summary-value {
  font-size: 1.3rem;
  font-weight: bold;
  color: #2c3e50;
}

.summary-value.positive {
  color: #27ae60;
}

.summary-value.negative {
  color: #e74c3c;
}

h3 {
  margin: 25px 0 15px;
  color: #2c3e50;
  font-size: 1.2rem;
  position: relative;
  padding-left: 12px;
}

h3::before {
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

.location-chart, .profit-items, .location-profit-chart {
  margin-top: 15px;
}

.location-bar, .profit-item, .location-profit-bar {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.location-name, .product-name {
  width: 120px;
  font-size: 0.9rem;
  color: #7f8c8d;
  text-align: right;
  padding-right: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bar-container, .profit-bar-container {
  flex: 1;
  height: 22px;
  background-color: #f0f2f5;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.bar, .profit-bar {
  height: 100%;
  background-color: #3498db;
  border-radius: 4px;
  transition: width 1s ease-out;
}

.bar-value, .profit-value {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.8rem;
  color: #333;
  font-weight: bold;
}

.chart-placeholder {
  height: 200px;
  background-color: #f8f9fa;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #7f8c8d;
}

.event-types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
}

.event-type-item {
  display: flex;
  align-items: center;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.event-type-icon {
  font-size: 1.8rem;
  margin-right: 12px;
}

.event-type-name {
  font-size: 0.9rem;
  color: #2c3e50;
  margin-bottom: 3px;
}

.event-type-count {
  font-size: 1.1rem;
  font-weight: bold;
  color: #3498db;
}

.important-events {
  margin-top: 15px;
}

.important-event-item {
  display: flex;
  margin-bottom: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  overflow: hidden;
}

.event-week {
  width: 80px;
  background-color: #3498db;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
}

.event-content {
  padding: 12px 15px;
  flex: 1;
}

.event-title {
  font-weight: bold;
  margin-bottom: 5px;
  color: #2c3e50;
}

.event-description {
  font-size: 0.9rem;
  color: #7f8c8d;
}

.inventory-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

.inventory-table th, .inventory-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.inventory-table th {
  background-color: #f8f9fa;
  color: #7f8c8d;
  font-weight: 500;
  font-size: 0.9rem;
}

.inventory-table td {
  color: #2c3e50;
}

.positive {
  color: #27ae60 !important;
}

.negative {
  color: #e74c3c !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-tabs {
    overflow-x: auto;
  }
  
  .tab-btn {
    padding: 12px 15px;
    font-size: 0.9rem;
  }
  
  .stats-summary {
    grid-template-columns: 1fr 1fr;
  }
  
  .event-types-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .location-name, .product-name {
    width: 80px;
  }
  
  .inventory-table {
    display: block;
    overflow-x: auto;
  }
}
</style> 