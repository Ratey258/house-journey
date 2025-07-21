import { defineStore } from 'pinia';
import { usePlayerStore } from '../player';
import { useMarketStore } from '../market';
import { useEventStore } from '../events';
import { handleError, ErrorType, ErrorSeverity } from '../../infrastructure/utils/errorHandler';

/**
 * 游戏核心状态管理
 * 负责管理游戏流程、周数和全局游戏状态
 */
export const useGameCoreStore = defineStore('gameCore', {
  state: () => ({
    currentWeek: 1,
    maxWeeks: 52,
    gameStarted: false,
    gamePaused: false,
    gameOver: false,
    victoryAchieved: false, // 新增：标记玩家是否已达成胜利条件
    gameResult: null,
    notifications: [],
    initialized: false, // 新增：标记游戏是否已初始化
    gameGoals: {
      requiredNetWorth: 400000,
      targetWeeks: 30,
      debtRatio: 0.4
    }
  }),
  
  actions: {
    /**
     * 开始新游戏
     * @param {string} playerName - 玩家名称
     */
    async startNewGame(playerName) {
      console.log('GameCore - 开始新游戏:', playerName);
      
      this.currentWeek = 1;
      this.gameStarted = true;
      this.gamePaused = false;
      this.gameOver = false; // 确保游戏开始时不是结束状态
      this.victoryAchieved = false; // 重置胜利标志
      this.gameResult = null;
      
      try {
        // 初始化其他模块
        const playerStore = usePlayerStore();
        const marketStore = useMarketStore();
        const eventStore = useEventStore();
        
        // 等待玩家初始化完成
        await playerStore.initializePlayer(playerName);
        
        // 确保名称已被设置
        if (!playerStore.name && playerName) {
          playerStore.name = playerName;
        }
        
        marketStore.initializeMarket().then(() => {
          // 确保市场初始化完成后立即更新当前地点的商品
          marketStore.updateLocationProducts();
          console.log('GameCore - 市场商品已更新');
        });
        eventStore.resetEvents();
        
        // 保存玩家名称到本地存储
        localStorage.setItem('lastPlayerName', playerName);
        
        console.log('GameCore - 游戏初始化完成');
      } catch (error) {
        handleError(error, 'gameState (gameCore)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
        console.error('GameCore - 初始化游戏模块时出错:', error);
        throw error;
      }
    },
    
    /**
     * 进入下一周
     * @returns {boolean} 是否成功进入下一周
     */
    advanceWeek() {
      if (this.currentWeek < this.maxWeeks && !this.gameOver) {
        this.currentWeek++;
        console.log(`GameCore - 进入第 ${this.currentWeek} 周`);
        
        const playerStore = usePlayerStore();
        const marketStore = useMarketStore();
        const eventStore = useEventStore();
        
        // 更新玩家信息（债务等）
        console.log('GameCore - 更新玩家状态');
        playerStore.updateWeeklyPlayerState(this.currentWeek);
        
        // 更新市场
        console.log('GameCore - 更新市场状态');
        marketStore.updateMarketState(this.currentWeek);
        
        // 生成随机事件
        console.log('GameCore - 准备生成随机事件');
        
        // 准备传递给事件系统的数据
        const playerData = {
          money: playerStore.money,
          debt: playerStore.debt,
          inventory: playerStore.inventory,
          statistics: playerStore.statistics,
          purchasedHouses: playerStore.purchasedHouses,
          name: playerStore.name,
          capacity: playerStore.capacity,
          inventoryUsed: playerStore.inventoryUsed
        };
        
        console.log('GameCore - 已准备玩家数据:', {
          money: playerData.money,
          debt: playerData.debt,
          inventoryCount: playerData.inventory.length
        });
        
        // 创建市场数据对象，确保包含必要的数据
        const marketData = {
          marketModifiers: marketStore.marketModifiers,
          currentLocation: marketStore.currentLocation,
          productPrices: marketStore.productPrices,
          products: marketStore.products,
          locations: marketStore.locations
        };
        
        console.log('GameCore - 已准备市场数据:', {
          currentLocationId: marketData.currentLocation ? marketData.currentLocation.id : '未设置',
          productCount: marketData.products.length,
          locationCount: marketData.locations.length
        });
        
        // 调用事件系统生成随机事件，传递当前周数、玩家数据和市场数据
        console.log('GameCore - 调用事件生成函数');
        
        // 增加事件生成概率：先尝试生成一次
        let event = eventStore.generateRandomEvent(
          this.currentWeek, 
          playerData, 
          marketData
        );
        
        // 如果第一次没有生成事件，并且当前周数是3的倍数，再尝试一次
        if (!event && this.currentWeek % 3 === 0) {
          console.log('GameCore - 第一次未生成事件，尝试第二次生成');
          event = eventStore.generateRandomEvent(
            this.currentWeek, 
            playerData, 
            marketData
          );
        }
        
        // 输出事件生成结果
        if (event) {
          console.log('GameCore - 成功生成随机事件:', event.id, event.title);
          
          // 将事件添加到活跃事件队列
          if (!eventStore.activeEvents.includes(event)) {
            eventStore.activeEvents.push(event);
            console.log('GameCore - 事件已加入活跃队列, 当前队列长度:', eventStore.activeEvents.length);
          }
        } else {
          console.log('GameCore - 本周未触发事件');
        }
        
        // 检查游戏结束条件
        this.checkGameEnd();
        
        return true;
      } else {
        this.gameOver = true;
        return false;
      }
    },
    
    /**
     * 检查是否有可购买的商品
     * @returns {boolean} 是否有可购买的商品
     */
    hasAffordableProducts() {
      const playerStore = usePlayerStore();
      const marketStore = useMarketStore();
      const playerMoney = playerStore.money;
      
      // 检查所有地点的所有商品
      for (const location of marketStore.locations) {
        // 先切换到该地点
        const availableProductIds = marketStore.getLocationAvailableProducts(location);
        
        // 检查该地点的所有商品
        for (const productId of availableProductIds) {
          const product = marketStore.products.find(p => p.id === productId);
          if (!product) continue;
          
          // 获取当前价格
          const price = marketStore.getCurrentProductPrice(productId);
          
          // 如果有任何商品价格低于玩家资金，就返回true
          if (price <= playerMoney) {
            return true;
          }
        }
      }
      
      // 如果所有商品都买不起，返回false
      return false;
    },
    
    /**
     * 检查游戏结束条件
     */
    checkGameEnd() {
      const playerStore = usePlayerStore();
      const netWorth = playerStore.netWorth;
      const money = playerStore.money;
      const debt = playerStore.debt;
      
      // 周数限制检查
      if (this.currentWeek >= this.maxWeeks) {
        this.endGame(this.victoryAchieved ? 'victoryTimeLimit' : 'timeLimit');
        return;
      }
      
      // 胜利条件：购买了最高级别的房子
      // 不再直接结束游戏，而是标记胜利状态
      if (playerStore.hasHighestHouse && !this.victoryAchieved) {
        this.victoryAchieved = true;
        this.addNotification('success', '恭喜！您已经购买了豪宅，达成了游戏主要目标！您可以选择继续游戏，争取更高分数，或者结束游戏查看您的成绩。');
        // 触发胜利成就，但不结束游戏
        this.achieveVictory();
        return;
      }
      
      // 破产条件 - 只有在第一周之后才检查破产条件
      // 这样可以避免游戏一开始就因为初始资金小于债务而直接判定破产
      // 新的破产条件：
      // 1. 第一周之后
      // 2. 净资产为负
      // 3. 债务大于资金的一定倍数
      // 4. 玩家无法购买任何商品（新增条件）
      if (this.currentWeek > 1 && netWorth < 0 && debt > money * this.gameGoals.debtRatio && !this.hasAffordableProducts()) {
        this.endGame('bankruptcy');
        return;
      }
    },
    
    /**
     * 达成胜利，但不结束游戏
     */
    achieveVictory() {
      const playerStore = usePlayerStore();
      
      // 记录胜利信息，但不设置gameOver为true
      this.gameResult = {
        reason: 'victory',
        week: this.currentWeek,
        score: this.calculateGameScore('victory'),
        continuedPlay: true,
        firstVictoryWeek: this.currentWeek,
        firstVictoryHouse: playerStore.mostExpensiveHouse
      };
      
      // 可以在这里添加一些胜利奖励
      // 例如增加一些资金作为奖励
      playerStore.addMoney(50000);
      this.addNotification('reward', '作为购买豪宅的奖励，您获得了额外的50,000元！');
    },
    
    /**
     * 结束游戏
     * @param {string} reason - 结束原因
     * @param {string} [achievementName=null] - 成就名称（如果是通过成就结束）
     */
    endGame(reason, achievementName = null) {
      this.gameOver = true;
      
      // 如果已经达成胜利，但因为其他原因结束游戏，保留胜利信息
      if (this.victoryAchieved && reason !== 'victory' && reason !== 'victoryTimeLimit') {
        reason = 'victoryOther';
      }
      
      const playerStore = usePlayerStore();
      
      // 构建完整的游戏结果对象，包含所有可能需要的统计数据
      this.gameResult = {
        reason,
        week: this.currentWeek,
        weeksPassed: this.currentWeek,
        score: this.calculateGameScore(reason),
        achievementName,
        victoryAchieved: this.victoryAchieved,
        firstVictoryWeek: this.gameResult?.firstVictoryWeek || null,
        firstVictoryHouse: this.gameResult?.firstVictoryHouse || null,
        finalMoney: playerStore.money,
        finalAssets: playerStore.netWorth,
        debt: playerStore.debt,
        // 确保包含交易统计数据
        tradeStats: {
          totalTrades: playerStore.statistics?.transactionCount || 0,
          totalProfit: playerStore.statistics?.totalProfit || 0,
          averageProfit: playerStore.statistics?.transactionCount > 0 
            ? (playerStore.statistics?.totalProfit || 0) / playerStore.statistics.transactionCount 
            : 0
        },
        // 添加其他可能需要的统计数据
        score: {
          score: this.calculateGameScore(reason),
          rank: this.calculateRank(this.calculateGameScore(reason)),
          details: this.calculateScoreDetails(reason)
        },
        endReason: reason,
        data: {
          debt: playerStore.debt,
          firstVictoryWeek: this.gameResult?.firstVictoryWeek || this.currentWeek
        }
      };
    },
    
    /**
     * 计算游戏得分
     * @param {string} endReason - 结束原因
     * @returns {number} 得分
     */
    calculateGameScore(endReason) {
      const playerStore = usePlayerStore();
      const baseScore = playerStore.netWorth / 1000;
      
      // 根据结束原因调整分数
      let multiplier = 1;
      switch (endReason) {
        case 'victory':
          multiplier = 1.5;
          break;
        case 'victoryTimeLimit':
          // 达成胜利并玩到最后，给予最高奖励
          multiplier = 2.0;
          break;
        case 'bankruptcy':
          multiplier = 0.5;
          break;
        case 'achievement':
          multiplier = 1.2;
          break;
      }
      
      // 根据完成速度调整分数
      let speedMultiplier = 1;
      
      // 如果是胜利结局，使用首次达成胜利的周数计算速度加成
      if ((endReason === 'victory' || endReason === 'victoryTimeLimit') && this.gameResult?.firstVictoryWeek) {
        speedMultiplier = this.maxWeeks / Math.max(1, this.gameResult.firstVictoryWeek);
      } else {
        speedMultiplier = this.maxWeeks / Math.max(1, this.currentWeek);
      }
      
      return Math.round(baseScore * multiplier * speedMultiplier);
    },
    
    /**
     * 计算玩家等级
     * @param {number} score - 玩家得分
     * @returns {string} 等级（S, A, B, C, D）
     */
    calculateRank(score) {
      if (score >= 1000000) return 'S';
      if (score >= 500000) return 'A';
      if (score >= 200000) return 'B';
      if (score >= 100000) return 'C';
      return 'D';
    },
    
    /**
     * 计算得分详情
     * @param {string} endReason - 结束原因
     * @returns {Object} 得分详情
     */
    calculateScoreDetails(endReason) {
      const playerStore = usePlayerStore();
      
      // 资产得分 - 基于净资产
      const assetsScore = playerStore.netWorth / 800;
      
      // 时间效率得分 - 基于完成时间
      let timeScore = 0;
      if ((endReason === 'victory' || endReason === 'victoryTimeLimit') && this.gameResult?.firstVictoryWeek) {
        timeScore = Math.round(500000 / Math.max(1, this.gameResult.firstVictoryWeek));
      }
      
      // 房产得分 - 基于房产价值和等级
      const houseScore = playerStore.purchasedHouses.reduce((score, house) => {
        return score + (house.purchasePrice / 500) * (house.level || 1);
      }, 0);
      
      // 交易效率得分
      const tradeScore = (playerStore.statistics?.totalProfit || 0) / 500;
      
      // 事件处理得分 - 这部分可能需要其他系统支持
      const eventScore = 0;
      
      return {
        assetsScore: Math.round(assetsScore),
        timeScore: Math.round(timeScore),
        houseScore: Math.round(houseScore),
        tradeScore: Math.round(tradeScore),
        eventScore: Math.round(eventScore)
      };
    },
    
    /**
     * 添加通知消息
     * @param {string} type - 通知类型
     * @param {string} message - 通知内容
     */
    addNotification(type, message) {
      this.notifications.push({
        id: Date.now(),
        type,
        message,
        timestamp: new Date().toISOString()
      });
      
      // 限制通知数量
      if (this.notifications.length > 10) {
        this.notifications.shift();
      }
    },
    
    /**
     * 暂停游戏
     */
    pauseGame() {
      if (this.gameStarted && !this.gameOver) {
        this.gamePaused = true;
      }
    },
    
    /**
     * 继续游戏
     */
    resumeGame() {
      this.gamePaused = false;
    },
    
    /**
     * 手动结束游戏（玩家选择结束）
     */
    manualEndGame() {
      const reason = this.victoryAchieved ? 'victory' : 'playerChoice';
      this.endGame(reason);
    },
    
    /**
     * 触发教程事件
     * @param {string} eventtry {
        const eventStore = useEventStore();
        if (eventStore && typeof eventStore.triggerEvent === 'function') {
          return eventStore.triggerEvent(eventId);
        }
        return false;
      } catch (error) {
    handleError(error, 'gameState (gameCore)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
    console.error('触发教程事件失败:', error);
        return false;}    } catch (error) {
        console.error('触发教程事件失败:', error);
        return false;
      }
    },
    
    /**
     * 触发特定事件
     * @param {string} eventId - 事件ID
     * @returns {Object|null} 触发的事件对象，如果触发失败则返回null
     */
    triggerSpecificEvent(eventId) {
      console.log('GameCore - 尝试触发特定事件:', eventId);
      
      try {
        const eventStore = useEventStore();
        const playerStore = usePlayerStore();
        const marketStore = useMarketStore();
        
        // 准备玩家数据
        const playerData = {
          money: playerStore.money,
          debt: playerStore.debt,
          inventory: playerStore.inventory,
          statistics: playerStore.statistics,
          purchasedHouses: playerStore.purchasedHouses,
          name: playerStore.name,
          capacity: playerStore.capacity,
          inventoryUsed: playerStore.inventoryUsed
        };
        
        // 准备市场数据
        const marketData = {
          marketModifiers: marketStore.marketModifiers,
          currentLocation: marketStore.currentLocation,
          productPrices: marketStore.productPrices,
          products: marketStore.products,
          locations: marketStore.locations
        };
        
        // 触发特定事件
        const event = eventStore.triggerSpecificEvent(eventId, playerData, marketData);
        
        if (event) {
          console.log('GameCore - 成功触发特定事件:', event.id, event.title);
          
          // 将事件添加到活跃事件队列
          if (!this.activeEvents.includes(event)) {
            this.activeEvents.push(event);
            console.log('GameCore - 事件已添加到活跃队列, 当前队列长度:', this.activeEvents.length);
          }
          
          return event;
        } else {
          console.warn('GameCore - 触发特定事件失败:', eventId);
          return null;
        }
      } catch (error) {
        handleError(error, 'gameState.triggerSpecificEvent', ErrorType.GAME_LOGIC, ErrorSeverity.ERROR);
        console.error('GameCore - 触发特定事件时出错:', error);
        return null;
      }
    },

    /**
     * 初始化游戏核心
     * 用于游戏加载过程
     * @returns {Promise} 初始化完成的Promise
     */
    initializeGameCore() {
      return new Promise((resolve) => {
        console.log('GameCore - 初始化游戏核心');
        
        // 模拟一些初始化操作
        setTimeout(() => {
          this.initialized = true;
          console.log('GameCore - 游戏核心初始化完成');
          resolve();
        }, 300);
      });
    },

    /**
     * 更新游戏状态
     * 用于确保游戏状态是最新的
     */
    updateGameState() {
      console.log('GameCore - 更新游戏状态');
      
      // 检查游戏结束条件
      if (this.gameStarted && !this.gameOver) {
        this.checkGameEnd();
      }
      
      // 更新通知
      if (this.notifications.length > 10) {
        this.notifications = this.notifications.slice(-10);
      }
    }
  },
  
  getters: {
    /**
     * 获取游戏进度百分比
     * @returns {number} 进度百分比(0-100)
     */
    gameProgress() {
      return (this.currentWeek / this.maxWeeks) * 100;
    },
    
    /**
     * 判断游戏是否处于活跃状态
     * @returns {boolean} 游戏是否活跃
     */
    isGameActive() {
      return this.gameStarted && !this.gameOver && !this.gamePaused;
    },
    
    /**
     * 获取剩余周数
     * @returns {number} 剩余周数
     */
    remainingWeeks() {
      return this.maxWeeks - this.currentWeek;
    }
  }
}); 