/**
 * 玩家领域模型
 * 管理玩家状态和行为
 */

/**
 * 玩家类
 * 封装玩家的属性和行为
 */
export class Player {
  /**
   * 创建玩家实例
   * @param {Object} options 玩家初始化选项
   * @param {string} options.name 玩家名称
   * @param {number} options.money 初始资金
   * @param {number} options.debt 初始债务
   * @param {number} options.capacity 背包容量
   * @param {number} options.bankDeposit 银行存款
   * @param {number} options.maxLoanAmount 最大贷款额度
   */
  constructor({
    name = '玩家',
    money = 5000,
    debt = 2000,
    capacity = 100,
    bankDeposit = 0,
    maxLoanAmount = 20000
  } = {}) {
    this.name = name;
    this.money = money;
    this.debt = debt;
    this.capacity = capacity;
    this.inventoryUsed = 0;
    this.inventory = [];
    this.purchasedHouses = [];
    this.bankDeposit = bankDeposit;
    this.maxLoanAmount = maxLoanAmount;
    this.statistics = {
      weekCount: 1,
      transactionCount: 0,
      totalProfit: 0,
      maxMoney: money,
      visitedLocations: []
    };
  }

  /**
   * 增加玩家资金
   * @param {number} amount 增加的金额
   * @returns {boolean} 操作是否成功
   */
  addMoney(amount) {
    if (amount <= 0) return false;
    this.money += amount;
    if (this.money > this.statistics.maxMoney) {
      this.statistics.maxMoney = this.money;
    }
    return true;
  }

  /**
   * 减少玩家资金
   * @param {number} amount 减少的金额
   * @returns {boolean} 操作是否成功
   */
  spendMoney(amount) {
    if (amount <= 0 || amount > this.money) return false;
    this.money -= amount;
    return true;
  }

  /**
   * 还款
   * @param {number} amount 还款金额
   * @returns {boolean} 操作是否成功
   */
  repayDebt(amount) {
    if (amount <= 0 || amount > this.money) return false;
    if (amount > this.debt) {
      amount = this.debt; // 只还清债务
    }
    this.money -= amount;
    this.debt -= amount;
    return true;
  }

  /**
   * 添加商品到库存
   * @param {Object} product 商品对象
   * @param {number} quantity 数量
   * @param {number} price 购买价格
   * @returns {boolean} 操作是否成功
   */
  addToInventory(product, quantity, price) {
    const requiredSpace = product.size * quantity;
    if (this.inventoryUsed + requiredSpace > this.capacity) {
      return false;
    }

    // 查找现有条目
    const existingIndex = this.inventory.findIndex(
      item => item.productId === product.id && item.purchasePrice === price
    );

    if (existingIndex !== -1) {
      // 更新现有条目
      this.inventory[existingIndex].quantity += quantity;
    } else {
      // 添加新条目
      this.inventory.push({
        productId: product.id,
        name: product.name,
        quantity,
        purchasePrice: price,
        size: product.size,
        totalCost: price * quantity // 添加来自game_core_player.js的总成本字段
      });
    }

    this.inventoryUsed += requiredSpace;
    return true;
  }

  /**
   * 从库存移除商品
   * @param {string} productId 商品ID
   * @param {number} quantity 数量
   * @returns {boolean} 操作是否成功
   */
  removeFromInventory(productId, quantity) {
    const index = this.inventory.findIndex(item => item.productId === productId);
    if (index === -1) return false;

    const item = this.inventory[index];
    if (quantity > item.quantity) return false;

    const spaceFreed = item.size * quantity;
    item.quantity -= quantity;

    if (item.quantity <= 0) {
      this.inventory.splice(index, 1);
    }

    this.inventoryUsed -= spaceFreed;
    return true;
  }

  /**
   * 购买房产
   * @param {Object} house 房屋对象
   * @param {number} week 当前周数
   * @returns {boolean} 操作是否成功
   */
  purchaseHouse(house, week) {
    if (house.price > this.money) return false;

    this.money -= house.price;
    this.purchasedHouses.push({
      houseId: house.id,
      name: house.name,
      purchasePrice: house.price,
      purchaseDate: new Date().toISOString(),
      purchaseWeek: week // 添加来自game_core_player.js的购买周数
    });

    return true;
  }

  /**
   * 访问新地点
   * @param {string} locationId 地点ID
   * @returns {boolean} 是否为首次访问
   */
  visitLocation(locationId) {
    if (!this.statistics.visitedLocations.includes(locationId)) {
      this.statistics.visitedLocations.push(locationId);
      return true;
    }
    return false;
  }

  /**
   * 存款到银行
   * @param {number} amount 存款金额
   * @returns {boolean} 操作是否成功
   */
  depositToBank(amount) {
    if (amount <= 0 || amount > this.money) return false;
    this.money -= amount;
    this.bankDeposit += amount;
    return true;
  }

  /**
   * 从银行取款
   * @param {number} amount 取款金额
   * @returns {boolean} 操作是否成功
   */
  withdrawFromBank(amount) {
    if (amount <= 0 || amount > this.bankDeposit) return false;
    this.bankDeposit -= amount;
    this.money += amount;
    return true;
  }

  /**
   * 从银行借款
   * @param {number} amount 借款金额
   * @returns {boolean} 操作是否成功
   */
  takeNewLoan(amount) {
    // 计算当前可贷款额度
    const availableLoanAmount = this.maxLoanAmount - this.debt;
    if (amount <= 0 || amount > availableLoanAmount) return false;
    this.debt += amount;
    this.money += amount;
    return true;
  }

  /**
   * 更新玩家每周状态
   * @param {number} currentWeek 当前周数
   */
  updateWeeklyState(currentWeek) {
    this.statistics.weekCount = currentWeek;

    // 更新债务（每周增加0.5%的利息）
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
  }

  /**
   * 计算净资产
   * @returns {number} 净资产值
   */
  get netWorth() {
    // 资金 + 银行存款 + 背包价值 + 房产价值 - 债务
    const inventoryValue = this.inventory.reduce(
      (total, item) => total + (item.quantity * item.purchasePrice), 0
    );

    const houseValue = this.purchasedHouses.reduce(
      (total, house) => total + house.purchasePrice, 0
    );

    return this.money + this.bankDeposit + inventoryValue + houseValue - this.debt;
  }

  /**
   * 获取可贷款额度
   * @returns {number} 可贷款金额
   */
  get availableLoanAmount() {
    return Math.max(0, this.maxLoanAmount - this.debt);
  }

  /**
   * 检查是否拥有最高级别房屋
   * @param {Array} allHouses 所有房屋列表
   * @returns {boolean} 是否拥有最高级别房屋
   */
  hasHighestLevelHouse(allHouses) {
    if (this.purchasedHouses.length === 0) return false;

    // 找出最高级别的房屋
    const highestHouse = allHouses.reduce((highest, house) => {
      return house.price > highest.price ? house : highest;
    }, { price: 0 });

    // 检查是否拥有该房屋
    return this.purchasedHouses.some(house => house.houseId === highestHouse.id);
  }
}

/**
 * 创建玩家工厂函数
 * @param {Object} options 玩家初始化选项
 * @returns {Player} 新的玩家实例
 */
export function createPlayer(options) {
  return new Player(options);
}

/**
 * 创建玩家持有的商品对象
 * @param {Object} product 商品对象
 * @param {number} quantity 商品数量
 * @param {number} purchasePrice 购买价格
 * @returns {Object} 玩家商品对象
 */
export function createPlayerProduct(product, quantity, purchasePrice) {
  return {
    productId: product.id,
    name: product.name,
    quantity: quantity,
    purchasePrice: purchasePrice,
    totalCost: purchasePrice * quantity,
    size: product.size || 1
  };
}
