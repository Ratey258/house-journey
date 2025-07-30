import { defineStore } from 'pinia';
import i18n from '../../i18n';
import { useGameCoreStore } from '../gameCore';

/**
 * 玩家状态管理
 * 负责管理玩家的基本信息、财产、库存等
 */
export const usePlayerStore = defineStore('player', {
  state: () => ({
    name: '',
    money: 2000,
    debt: 5000,
    loanPrincipal: 5000, // 添加贷款本金追踪，初始值与debt相同
    capacity: 100,
    inventoryUsed: 0,
    inventory: [], // 物品库存数组
    purchasedHouses: [],
    initialized: false, // 添加初始化标志
    // 添加银行相关状态
    bankDeposit: 0,
    maxLoanAmount: 20000,
    statistics: {
      weekCount: 1,
      transactionCount: 0,
      totalProfit: 0,
      maxMoney: 2000,
      visitedLocations: [],
      housePurchases: [], // 新增：记录所有已购房屋的购买信息
      firstHousePurchaseWeek: null, // 新增：记录首次购房的周数
      mostExpensiveHouse: null, // 新增：记录最贵的已购房屋
      highestLevelHouse: null // 新增：记录最高等级的已购房屋
    }
  }),

  actions: {
    /**
     * 直接添加物品到背包
     * @param {Object} item - 物品对象
     */
    addInventoryItem(item) {
      console.log('PlayerStore - 直接添加物品:', item);

      // 确保物品有必要的属性
      if (!item || !item.productId || !item.quantity) {
        console.error('PlayerStore - 无效的物品对象:', item);
        return false;
      }

      // 添加物品到背包
      this.inventory.push(item);

      // 更新已用容量
      this.inventoryUsed += item.quantity;

      console.log('PlayerStore - 背包更新后:', {
        inventoryCount: this.inventory.length,
        inventoryUsed: this.inventoryUsed
      });

      return true;
    },

    /**
     * 初始化玩家
     * @param {string} playerName - 玩家名称
     * @returns {Promise} 初始化完成的Promise
     */
    initializePlayer(playerName) {
      console.log('PlayerStore - 初始化玩家:', playerName);

      return new Promise((resolve) => {
        // 模拟加载过程
        setTimeout(() => {
          this.name = playerName || i18n.global.t('system.defaultPlayerName');
          this.money = 2000;
          this.debt = 5000;
          this.loanPrincipal = 5000; // 设置初始贷款本金
          this.capacity = 100;
          this.inventoryUsed = 0;
          this.inventory = [];
          console.log('PlayerStore - 初始化背包:', {
            capacity: this.capacity,
            inventoryUsed: this.inventoryUsed,
            inventory: this.inventory
          });

          this.purchasedHouses = [];
          this.initialized = true; // 设置初始化标志
          // 初始化银行状态
          this.bankDeposit = 0;
          this.maxLoanAmount = 20000;
          this.statistics = {
            weekCount: 1,
            transactionCount: 0,
            totalProfit: 0,
            maxMoney: 2000,
            visitedLocations: [],
            housePurchases: [],
            firstHousePurchaseWeek: null,
            mostExpensiveHouse: null,
            highestLevelHouse: null
          };

          console.log('PlayerStore - 玩家初始化完成');
          resolve();
        }, 400);
      });
    },

    /**
     * 更新每周玩家状态
     * @param {number} currentWeek - 当前周数
     */
    updateWeeklyPlayerState(currentWeek) {
      this.statistics.weekCount = currentWeek;

      // 更新债务（每周增加0.5%的利息）
      // 注意：利息只增加债务总额，不影响贷款本金
      if (this.debt > 0) {
        const interest = Math.floor(this.debt * 0.005);
        this.debt += interest;
      }

      // 更新银行存款利息（每周增加0.3%的利息 - 低于贷款利率）
      if (this.bankDeposit > 0) {
        const depositInterest = Math.floor(this.bankDeposit * 0.003);
        this.bankDeposit += depositInterest;
      }

      // 更新统计信息
      if (this.money > this.statistics.maxMoney) {
        this.statistics.maxMoney = this.money;
      }
    },

    /**
     * 添加资金
     * @param {number} amount - 金额
     * @returns {boolean} 是否成功
     */
    addMoney(amount) {
      if (amount <= 0) return false;

      this.money += amount;

      // 更新最大资金记录
      if (this.money > this.statistics.maxMoney) {
        this.statistics.maxMoney = this.money;
      }

      return true;
    },

    /**
     * 消费资金
     * @param {number} amount - 金额
     * @returns {boolean} 是否成功
     */
    spendMoney(amount) {
      if (amount <= 0 || amount > this.money) return false;

      this.money -= amount;
      return true;
    },

    /**
     * 偿还债务
     * @param {number} amount - 偿还金额
     * @returns {boolean} 是否成功偿还
     */
    repayDebt(amount) {
      // 检查金额有效性
      if (amount <= 0 || amount > this.money) {
        return false;
      }

      // 如果金额大于债务，只还清债务
      if (amount > this.debt) {
        amount = this.debt;
      }

      this.money -= amount;
      this.debt -= amount;

      // 更新贷款本金
      // 如果还款金额小于等于贷款本金，直接减少本金
      if (amount <= this.loanPrincipal) {
        this.loanPrincipal -= amount;
      } else {
        // 如果还款金额大于贷款本金，则本金归零
        this.loanPrincipal = 0;
      }

      return true;
    },

    /**
     * 添加已访问地点
     * @param {string} locationId - 地点ID
     * @returns {boolean} 是否为新地点
     */
    addVisitedLocation(locationId) {
      if (!this.statistics.visitedLocations.includes(locationId)) {
        this.statistics.visitedLocations.push(locationId);
        return true;
      }
      return false;
    },

    /**
     * 购买房产
     * @param {Object} house - 房屋对象
     * @returns {boolean} 是否购买成功
     */
    purchaseHouse(house) {
      // 严格检查参数
      if (!house || typeof house !== 'object') {
        console.error('无效的房屋对象传递给purchaseHouse');
        return false;
      }

      // 必需属性检查
      const requiredProps = ['id', 'name', 'level', 'price'];
      for (const prop of requiredProps) {
        if (!(prop in house)) {
          console.error(`购买房屋失败：房屋对象缺少必需属性 ${prop}`);
          return false;
        }
      }

      // 严格检查是否有足够资金（再次验证，双重保障）
      if (house.price > this.money) {
        console.warn(`购买失败：资金不足 (拥有: ${this.money}, 需要: ${house.price}, 差额: ${house.price - this.money})`);
        return false;
      }

      // 检查是否已拥有该房屋
      if (this.purchasedHouses.some(h => h.houseId === house.id)) {
        console.warn(`购买失败：已拥有ID为 ${house.id} 的房屋`);
        return false;
      }

      // 扣除资金
      this.money -= house.price;

      // 记录购买时间（游戏周数）
      const gameStore = useGameCoreStore();
      const purchaseWeek = gameStore.currentWeek;

      // 添加到已购房屋列表，包含更完整的信息
      const purchaseRecord = {
        houseId: house.id,
        name: house.name,
        level: house.level,
        purchasePrice: house.price,
        purchaseWeek,
        description: house.description || `${house.level}级房产`,
        purchaseDate: new Date().toISOString()
      };

      this.purchasedHouses.push(purchaseRecord);

      // 更新统计信息
      if (!this.statistics.housePurchases) {
        this.statistics.housePurchases = [];
      }

      this.statistics.housePurchases.push({
        houseId: house.id,
        name: house.name,
        level: house.level,
        price: house.price,
        week: purchaseWeek
      });

      // 如果这是第一套房产，记录首次购房时间
      if (this.statistics.firstHousePurchaseWeek === null) {
        this.statistics.firstHousePurchaseWeek = purchaseWeek;
      }

      // 记录最昂贵的房产购买
      if (!this.statistics.mostExpensiveHouse ||
          house.price > this.statistics.mostExpensiveHouse.price) {
        this.statistics.mostExpensiveHouse = {
          id: house.id,
          name: house.name,
          price: house.price,
          level: house.level,
          week: purchaseWeek
        };
      }

      // 记录最高等级的房产购买
      if (!this.statistics.highestLevelHouse ||
          house.level > this.statistics.highestLevelHouse.level) {
        this.statistics.highestLevelHouse = {
          id: house.id,
          name: house.name,
          price: house.price,
          level: house.level,
          week: purchaseWeek
        };
      }

      console.log(`成功购买房产: ${house.name} - ¥${house.price} (第${purchaseWeek}周)`);
      return true;
    },

    /**
     * 存款到银行
     * @param {number} amount - 存款金额
     * @returns {boolean} 是否成功
     */
    depositToBank(amount) {
      // 检查金额有效性
      if (amount <= 0 || amount > this.money) {
        return false;
      }

      this.money -= amount;
      this.bankDeposit += amount;
      return true;
    },

    /**
     * 从银行取款
     * @param {number} amount - 取款金额
     * @returns {boolean} 是否成功
     */
    withdrawFromBank(amount) {
      // 检查金额有效性
      if (amount <= 0 || amount > this.bankDeposit) {
        return false;
      }

      this.bankDeposit -= amount;
      this.money += amount;
      return true;
    },

    /**
     * 从银行贷款
     * @param {number} amount - 贷款金额
     * @returns {boolean} 是否成功
     */
    takeLoan(amount) {
      // 检查金额有效性和贷款上限
      // 使用 loanPrincipal 而不是 debt 来计算可贷款金额
      const availableLoanAmount = this.availableLoanAmount;
      if (amount <= 0 || amount > availableLoanAmount) {
        return false;
      }

      this.debt += amount;
      this.loanPrincipal += amount; // 更新贷款本金
      this.money += amount;
      return true;
    }
  },

  getters: {
    /**
     * 计算玩家净资产
     * @returns {number} 净资产
     */
    netWorth: (state) => {
      // 资金 + 银行存款 + 背包价值 + 房产价值 - 债务
      const inventoryValue = state.inventory.reduce(
        (total, item) => total + (item.quantity * item.purchasePrice), 0
      );

      const houseValue = state.purchasedHouses.reduce(
        (total, house) => total + house.purchasePrice, 0
      );

      return state.money + state.bankDeposit + inventoryValue + houseValue - state.debt;
    },

    /**
     * 计算玩家总资金（现金+背包商品价值）
     * @returns {number} 总资金
     */
    totalMoney: (state) => {
      // 资金 + 背包价值（按原价计算）
      const inventoryValue = state.inventory.reduce(
        (total, item) => total + (item.quantity * item.purchasePrice), 0
      );

      return state.money + inventoryValue;
    },

    /**
     * 判断是否拥有最高级别房屋
     * @returns {boolean} 是否拥有最高级别房屋
     */
    hasHighestHouse: (state) => {
      return state.purchasedHouses.some(house => house.level >= 5);
    },

    /**
     * 获取最贵的已购房屋
     * @returns {Object|null} 最贵的已购房屋
     */
    mostExpensiveHouse: (state) => {
      if (state.purchasedHouses.length === 0) return null;

      return state.purchasedHouses.reduce(
        (most, house) => house.purchasePrice > most.purchasePrice ? house : most,
        state.purchasedHouses[0]
      );
    },

    /**
     * 获取背包可用空间
     * @returns {number} 可用空间
     */
    availableCapacity: (state) => {
      return state.capacity - state.inventoryUsed;
    },

    /**
     * 获取可贷款金额
     * @returns {number} 可贷款金额
     */
    availableLoanAmount: (state) => {
      // 新的计算方法：不考虑利息影响，只考虑实际借贷本金
      // 添加一个新属性跟踪已借贷金额的本金部分（如果不存在）
      if (state.loanPrincipal === undefined) {
        state.loanPrincipal = state.debt; // 初始化为当前债务
      }

      // 直接使用固定的最大贷款额度，不考虑资产加成
      const maxLoanAmount = state.maxLoanAmount;

      // 可贷款金额 = 最大贷款额度 - 已借贷本金
      return Math.max(0, Math.floor(maxLoanAmount - state.loanPrincipal));
    },

    /**
     * 获取银行存款利率（周利率）
     * @returns {number} 银行存款利率
     */
    depositInterestRate: () => {
      return 0.003; // 0.3%/周
    },

    /**
     * 获取银行贷款利率（周利率）
     * @returns {number} 银行贷款利率
     */
    loanInterestRate: () => {
      return 0.005; // 0.5%/周
    }
  }
});
