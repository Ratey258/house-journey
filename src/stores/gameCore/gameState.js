import { defineStore } from 'pinia';
import { usePlayerStore } from '../player';
import { useMarketStore } from '../market';
import { useEventStore } from '../events';
import { handleError, ErrorType, ErrorSeverity } from '../../infrastructure/utils/errorHandler';

// 响应式数据设置辅助函数
function setReactiveValue(obj, key, value) {
  if (obj && typeof obj[key] === 'object' && 'value' in obj[key]) {
    obj[key].value = value;
  } else {
    obj[key] = value;
  }
}

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
      targetWeeks: 30
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
          setReactiveValue(playerStore, 'name', playerName);
        }

        marketStore.initializeMarket().then(() => {
          // 确保市场初始化完成后立即更新当前地点的商品
          marketStore.updateLocationProducts();
          console.log('GameCore - 市场商品已更新');
        });

        // 重置事件系统并清除所有事件状态
        eventStore.resetEvents();
        eventStore.activeEvent = null;
        eventStore.activeEvents = [];

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
      // 允许当前周数等于最大周数，只有超过时才无法继续
      if (this.currentWeek <= this.maxWeeks && !this.gameOver) {
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
        // 只有在经典模式下（maxWeeks为52）才设置游戏结束状态
        // 修改逻辑：currentWeek > maxWeeks 时才设置游戏结束状态
        if (this.maxWeeks === 52 && this.currentWeek > this.maxWeeks) {
          this.gameOver = true;
        } else {
          // 无尽模式下继续游戏
          this.currentWeek++;

          // 同样需要更新玩家和市场状态
          const playerStore = usePlayerStore();
          const marketStore = useMarketStore();
          const eventStore = useEventStore();

          // 更新玩家信息（债务等）
          playerStore.updateWeeklyPlayerState(this.currentWeek);

          // 更新市场
          marketStore.updateMarketState(this.currentWeek);

          // 生成随机事件 - 无尽模式下仍然保持事件生成
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

          const marketData = {
            marketModifiers: marketStore.marketModifiers,
            currentLocation: marketStore.currentLocation,
            productPrices: marketStore.productPrices,
            products: marketStore.products,
            locations: marketStore.locations
          };

          // 调用事件系统生成随机事件
          let event = eventStore.generateRandomEvent(
            this.currentWeek,
            playerData,
            marketData
          );

          // 如果第一次没有生成事件，并且当前周数是3的倍数，再尝试一次
          if (!event && this.currentWeek % 3 === 0) {
            event = eventStore.generateRandomEvent(
              this.currentWeek,
              playerData,
              marketData
            );
          }

          if (event) {
            if (!eventStore.activeEvents.includes(event)) {
              eventStore.activeEvents.push(event);
            }
          }

          // 检查游戏结束条件（破产等）
          this.checkGameEnd();

          return true;
        }
        return false;
      }
    },

    /**
     * 检查是否有可购买的商品
     * @param {boolean} [includeBankDeposit=true] - 是否考虑银行存款作为可用资金
     * @returns {boolean} 是否有可购买的商品
     */
    hasAffordableProducts(includeBankDeposit = true) {
      const playerStore = usePlayerStore();
      const marketStore = useMarketStore();
      // 考虑银行存款作为可用资金
      const playerMoney = includeBankDeposit ? playerStore.money + playerStore.bankDeposit : playerStore.money;

      // 如果玩家背包中有物品，则认为仍然有能力参与市场，不算破产
      if (playerStore.inventoryUsed > 0) {
        return true;
      }

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
      // 如果游戏已经结束，不再检查
      if (this.gameOver) return;

      // 检查是否达到52周
      if (this.currentWeek > this.maxWeeks) {
        // 游戏时间限制到达
        this.endGameWithTimeLimit();
        return;
      }

      const playerStore = usePlayerStore();
      const netWorth = playerStore.netWorth;

      // 资产达到胜利条件 - 100万净资产
      if (netWorth >= 1000000 && !this.victoryAchieved) {
        // 触发胜利成就，但不结束游戏
        this.achieveVictory();
        return;
      }

      // 破产条件 - 只有在第一周之后才检查破产条件
      // 这样可以避免游戏一开始就因为初始资金小于债务而直接判定破产
      // 1. 第一周之后
      // 2. 净资产为负（考虑银行存款和贷款）
      // 3. 玩家无法购买任何商品（考虑银行存款）
      if (this.currentWeek > 1 && netWorth < 0 && !this.hasAffordableProducts(true)) {
        this.endGame('bankruptcy');
        return;
      }
    },

    /**
     * 游戏时间限制达到时结束游戏
     */
    endGameWithTimeLimit() {
      const playerStore = usePlayerStore();
      const hasHouses = playerStore.purchasedHouses && playerStore.purchasedHouses.length > 0;

      console.log('游戏时间限制达到 - endGameWithTimeLimit', {
        victoryAchieved: this.victoryAchieved,
        hasHouses,
        purchasedHouses: playerStore.purchasedHouses?.length,
        netWorth: playerStore.netWorth
      });

      // 如果玩家已经购买了房产，就是完美胜利
      if (this.victoryAchieved || hasHouses) {
        // 完美胜利 - 购买房产并坚持到游戏结束

        // 直接在这里计算得分，避免endGame函数中可能的问题
        const finalScore = this.calculateGameScore('victoryTimeLimit');
        const scoreRank = this.calculateRank(finalScore);
        const scoreDetails = this.calculateScoreDetails('victoryTimeLimit');

        console.log('时间限制胜利 - 直接计算得分', {
          finalScore,
          rank: scoreRank
        });

        // 完美胜利结果对象
        this.gameResult = {
          reason: 'victoryTimeLimit',
          week: this.maxWeeks, // 固定为最大周数
          weeksPassed: this.maxWeeks, // 固定为最大周数
          score: finalScore, // 直接设置得分
          achievementName: null,
          victoryAchieved: true,
          firstVictoryWeek: this.gameResult?.firstVictoryWeek || this.currentWeek,
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
          scoreDetails: {
            score: finalScore,
            rank: scoreRank,
            details: scoreDetails
          },
          endReason: 'victoryTimeLimit'
        };

        // 标记游戏结束
        this.gameOver = true;

        // 更新房产信息，确保所有房产数据都会在结算时显示
        if (playerStore.purchasedHouses.length > 0) {
          // 添加多房产信息
          this.gameResult.allPurchasedHouses = playerStore.purchasedHouses;
          this.gameResult.houseCount = playerStore.purchasedHouses.length;

          // 记录最贵和最高级别的房产
          let mostExpensiveHouse = playerStore.purchasedHouses[0];
          let highestLevelHouse = playerStore.purchasedHouses[0];

          playerStore.purchasedHouses.forEach(house => {
            if (house.purchasePrice > mostExpensiveHouse.purchasePrice) {
              mostExpensiveHouse = house;
            }
            if (house.level > highestLevelHouse.level ||
               (house.level === highestLevelHouse.level && house.purchasePrice > highestLevelHouse.purchasePrice)) {
              highestLevelHouse = house;
            }
          });

          this.gameResult.mostExpensiveHouse = mostExpensiveHouse;
          this.gameResult.highestLevelHouse = highestLevelHouse;
        }

        console.log('时间限制胜利 - 游戏结果对象已创建', {
          score: this.gameResult.score,
          scoreDetails: this.gameResult.scoreDetails
        });
      } else {
        // 标准结束 - 未能购买房产
        this.endGame('timeLimit');
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
     * 购买房屋后的胜利，并显示通关页面，但允许继续游戏
     * @param {Object} house - 购买的房屋对象
     */
    achieveVictoryWithHouse(house) {
      // 标记玩家已达到胜利条件
      this.victoryAchieved = true;

      const playerStore = usePlayerStore();
      console.log('购房胜利 - 开始计算结果', {
        houseCount: playerStore.purchasedHouses.length,
        netWorth: playerStore.netWorth
      });

      // 确保房屋数据存在并设置默认图片路径
      if (house) {
        if (!house.image) {
          house.image = '/resources/assets/images/house_1.jpeg';
        } else if (house.image.startsWith('./')) {
          house.image = house.image.replace('./', '/');
        } else if (!house.image.startsWith('/')) {
          house.image = `/${house.image}`;
        }
      }

      // 移除重复添加房屋的代码，因为playerStore.purchaseHouse已经添加了房屋
      // 只检查房屋是否已添加，而不再重复添加
      const houseExists = playerStore.purchasedHouses.some(h => h.houseId === house.id || h.id === house.id);

      if (!houseExists) {
        console.warn('房屋购买记录不一致，这种情况不应该出现');
        // 如果发现不一致，记录日志但不再重复添加
      }

      // 计算得分
      const finalScore = this.calculateGameScore('houseVictory');
      const scoreRank = this.calculateRank(finalScore);
      const scoreDetails = this.calculateScoreDetails('houseVictory');

      console.log('购房胜利 - 计算得分结果', {
        finalScore,
        scoreRank,
        details: scoreDetails
      });

      // 确保房屋图片路径正确
      const safeHouse = { ...house };
      if (!safeHouse.image || safeHouse.image.includes('NaN')) {
        console.warn('房屋图片路径无效，使用默认值');
        safeHouse.image = '/resources/assets/images/house_1.jpeg';
      }

      // 准备游戏结果数据，包含完整的统计信息
      this.gameResult = {
        reason: 'houseVictory', // 自定义的胜利原因：购买房屋
        week: this.currentWeek,
        weeksPassed: this.currentWeek,
        score: finalScore,
        victoryAchieved: true,
        firstVictoryWeek: this.currentWeek,
        firstVictoryHouse: safeHouse,
        canContinue: true, // 标记可继续游戏
        finalMoney: playerStore.money,
        finalAssets: playerStore.netWorth,
        debt: playerStore.debt,
        purchasedHouse: safeHouse,
        // 确保包含交易统计数据
        tradeStats: {
          totalTrades: playerStore.statistics?.transactionCount || 0,
          totalProfit: playerStore.statistics?.totalProfit || 0,
          averageProfit: playerStore.statistics?.transactionCount > 0
            ? (playerStore.statistics?.totalProfit || 0) / playerStore.statistics.transactionCount
            : 0
        },
        scoreDetails: {
          score: finalScore,
          rank: scoreRank,
          details: scoreDetails
        },
        endReason: 'houseVictory'
      };

      // 设置游戏为结束状态，但可继续游戏
      this.gameOver = true;

      console.log('购房胜利 - 游戏结果对象创建完成', {
        score: this.gameResult.score,
        scoreDetails: this.gameResult.scoreDetails
      });
    },

    /**
     * 继续游戏（通关后选择继续）
     */
    continueGame() {
      // 重置游戏结束标志，但保持胜利状态
      this.gameOver = false;

      // 保留已经达成的胜利状态
      this.victoryAchieved = true;

      // 删除显示继续游戏的消息，避免重复显示
      // this.addNotification('success', '您选择继续游戏！您可以继续赚钱并购买更多房产，直到第52周游戏结束。');
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
      console.log('游戏结束 - endGame', {
        reason,
        week: this.currentWeek,
        netWorth: playerStore.netWorth,
        houseCount: playerStore.purchasedHouses?.length || 0
      });

      // 预先计算游戏得分，避免重复计算
      const gameScore = this.calculateGameScore(reason);
      const scoreRank = this.calculateRank(gameScore);
      const scoreDetails = this.calculateScoreDetails(reason);

      console.log('endGame得分计算完成', {
        score: gameScore,
        rank: scoreRank,
        details: scoreDetails
      });

      // 构建完整的游戏结果对象，包含所有可能需要的统计数据
      this.gameResult = {
        reason,
        week: reason === 'timeLimit' ? this.maxWeeks : this.currentWeek, // 时间限制时使用最大周数
        weeksPassed: reason === 'timeLimit' ? this.maxWeeks : this.currentWeek, // 时间限制时使用最大周数
        score: gameScore,
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
        scoreDetails: {
          score: gameScore,
          rank: scoreRank,
          details: scoreDetails
        },
        endReason: reason,
        data: {
          debt: playerStore.debt,
          firstVictoryWeek: this.gameResult?.firstVictoryWeek || this.currentWeek
        }
      };

      console.log('游戏结果对象已创建', {
        score: this.gameResult.score,
        scoreInDetails: this.gameResult.scoreDetails.score
      });
    },

    /**
     * 计算游戏得分
     * @param {string} endReason - 结束原因
     * @returns {number} 得分
     */
    calculateGameScore(endReason) {
      const playerStore = usePlayerStore();

      try {
        // 记录输入数据
        console.log('计算游戏得分 - 原始数据', {
          netWorth: playerStore.netWorth,
          money: playerStore.money,
          debt: playerStore.debt,
          week: this.currentWeek,
          endReason,
          purchasedHouses: playerStore.purchasedHouses?.length || 0
        });

        // 基础分数 = 净资产 / 1000
        // 确保净资产是有效数字，否则使用默认值
        let netWorth = playerStore.netWorth;
        if (isNaN(netWorth) || netWorth === undefined) {
          console.warn('计算游戏得分 - 净资产无效，使用备用计算');
          // 使用备用计算：钱 - 债务
          netWorth = (playerStore.money || 0) - (playerStore.debt || 0);
        }

        // 确保不为0或负数
        netWorth = Math.max(1000, netWorth);
        const baseScore = netWorth / 1000;

        // 根据结束原因调整分数
        let multiplier = 1;
        switch (endReason) {
          case 'victory':
          case 'houseVictory':
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
          default:
            multiplier = 1.0;
            break;
        }

        // 根据完成速度调整分数
        let speedMultiplier = 1;
        const isVictory = endReason.includes('victory');

        if (isVictory) {
          // 速度系数：越早越高
          const currentWeek = Math.max(1, this.currentWeek);
          speedMultiplier = Math.max(0.5, 1.0 + (10.0 / currentWeek));
        }

        // 根据拥有的房产数量调整
        let houseBonus = 1;
        const houseCount = playerStore.purchasedHouses?.length || 0;

        if (houseCount > 0) {
          houseBonus = 1 + (houseCount * 0.2); // 每套房产增加20%分数
        }

        // 计算总分并取整
        let totalScore = baseScore * multiplier * speedMultiplier * houseBonus;

        // 确保得分至少为1
        totalScore = Math.max(1, Math.floor(totalScore));

        console.log('计算游戏得分 - 最终结果', {
          baseScore,
          multiplier,
          speedMultiplier,
          houseBonus,
          totalScore
        });

        return totalScore;
      } catch (error) {
        console.error('计算游戏得分时发生错误:', error);
        // 发生错误时返回默认分数
        return Math.max(1, Math.floor(playerStore.netWorth / 1000));
      }
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
      try {
        const playerStore = usePlayerStore();
        console.log('计算得分明细 - 开始', {
          endReason,
          playerNetWorth: playerStore.netWorth
        });

        // 资产得分 - 基于净资产
        let assetsScore = 0;
        try {
          assetsScore = Math.max(0, Math.floor(playerStore.netWorth / 800));
          console.log('资产得分计算', { netWorth: playerStore.netWorth, assetsScore });
        } catch (err) {
          console.error('资产得分计算错误:', err);
          assetsScore = 100; // 默认值
        }

        // 时间效率得分 - 基于完成时间
        let timeScore = 0;
        try {
          // 任何胜利结局都给予时间效率得分
          if (endReason.includes('victory')) {
            const currentWeek = Math.max(1, this.currentWeek);
            timeScore = Math.round(500000 / currentWeek);
            console.log('时间效率得分计算', { week: currentWeek, timeScore });
          }
        } catch (err) {
          console.error('时间效率得分计算错误:', err);
          timeScore = 50; // 默认值
        }

        // 房产得分 - 基于房产价值和等级
        let houseScore = 0;
        try {
          if (playerStore.purchasedHouses && playerStore.purchasedHouses.length > 0) {
            let totalHouseValue = 0;
            // 遍历所有房产，累计总价值
            playerStore.purchasedHouses.forEach(house => {
              // 使用购买价格或默认价格
              const housePrice = house.purchasePrice || house.price || 0;
              totalHouseValue += housePrice;
            });

            // 计算房产得分
            houseScore = Math.floor(totalHouseValue / 5000);

            // 多房产奖励
            if (playerStore.purchasedHouses.length > 1) {
              houseScore *= (1 + (playerStore.purchasedHouses.length - 1) * 0.2);
            }

            console.log('房产得分计算', {
              houseCount: playerStore.purchasedHouses.length,
              totalHouseValue,
              houseScore
            });
          }
        } catch (err) {
          console.error('房产得分计算错误:', err);
          houseScore = 100; // 默认值
        }

        // 交易得分 - 基于交易次数和利润
        let tradeScore = 0;
        try {
          const totalProfit = playerStore.statistics?.totalProfit || 0;
          const tradeCount = playerStore.statistics?.transactionCount || 0;

          if (tradeCount > 0) {
            // 基本交易得分
            tradeScore = Math.floor(totalProfit / 1000);

            // 交易次数加成
            if (tradeCount > 10) {
              tradeScore *= (1 + (tradeCount - 10) * 0.02);
            }
          }

          console.log('交易得分计算', {
            tradeCount,
            totalProfit,
            tradeScore
          });
        } catch (err) {
          console.error('交易得分计算错误:', err);
          tradeScore = 50; // 默认值
        }

        // 银行管理得分 - 基于存款利息
        let bankScore = 0;
        try {
          const totalInterest = playerStore.statistics?.totalInterestEarned || 0;
          // 确保存在交易利润数据
          if (totalInterest > 0) {
            bankScore = Math.floor(totalInterest / 500);
          } else {
            // 提供最低分数
            bankScore = Math.floor(playerStore.bankDeposit / 10000);
          }

          console.log('银行得分计算', {
            totalInterest,
            bankDeposit: playerStore.bankDeposit,
            bankScore
          });
        } catch (err) {
          console.error('银行得分计算错误:', err);
          bankScore = 10; // 默认值
        }

        // 总得分
        const totalScore = assetsScore + timeScore + houseScore + tradeScore + bankScore;
        console.log('得分明细总结', {
          assetsScore,
          timeScore,
          houseScore,
          tradeScore,
          bankScore,
          totalScore
        });

        return {
          assetsScore,
          timeScore,
          houseScore,
          tradeScore,
          bankScore,
          totalScore
        };
      } catch (error) {
        console.error('计算得分明细时出错:', error);
        // 返回默认得分明细
        return {
          assetsScore: 100,
          timeScore: 50,
          houseScore: 100,
          tradeScore: 50,
          bankScore: 10,
          totalScore: 310
        };
      }
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
      const playerStore = usePlayerStore();

      // 确定结束原因：如果购买了任何房产，视为胜利结局
      let reason = 'playerChoice';

      // 如果玩家已购买任何房产，视为购房胜利
      if (playerStore.purchasedHouses && playerStore.purchasedHouses.length > 0) {
        reason = 'victory';

        // 如果之前没有标记胜利状态，现在标记
        if (!this.victoryAchieved) {
          this.victoryAchieved = true;
          this.gameResult = {
            firstVictoryWeek: this.currentWeek,
            firstVictoryHouse: playerStore.purchasedHouses[playerStore.purchasedHouses.length - 1]
          };
        }
      }

      // 结束游戏
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
      // 判断是否为无尽模式
      if (this.maxWeeks > 52) {
        // 无尽模式下，不显示进度条，或者显示一个固定的低值
        return Math.min(5, (this.currentWeek / 1000) * 100);
      }
      // 经典模式下，正常计算进度
      // 修正计算逻辑，使第一周显示为0%，最后一周(52)显示为约98%，超过52周才显示100%
      const progress = ((this.currentWeek - 1) / this.maxWeeks) * 100;
      // 限制在0-100之间
      return Math.max(0, Math.min(100, progress));
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
      // 无尽模式下显示"无限"
      if (this.maxWeeks > 52) {
        return '∞';
      }
      // 确保第52周显示剩余0周，而不是-1周
      const remaining = this.maxWeeks - this.currentWeek + 1;
      return Math.max(0, remaining);
    },

    /**
     * 判断当前是否为无尽模式
     * @returns {boolean} 是否为无尽模式
     */
    isEndlessMode() {
      return this.maxWeeks > 52;
    }
  }
});
