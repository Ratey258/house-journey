/**
 * 玩家领域模型
 * 管理玩家状态和行为
 */

// ==================== 类型定义 ====================

/**
 * 库存商品接口
 */
export interface InventoryItem {
  /** 商品ID */
  productId: string | number;
  /** 商品名称 */
  name: string;
  /** 数量 */
  quantity: number;
  /** 购买价格 */
  purchasePrice: number;
  /** 商品大小 */
  size: number;
  /** 总成本 */
  totalCost: number;
}

/**
 * 购买的房屋信息接口
 */
export interface PurchasedHouse {
  /** 房屋ID */
  houseId: string;
  /** 房屋名称 */
  name: string;
  /** 购买价格 */
  purchasePrice: number;
  /** 购买日期 */
  purchaseDate: string;
  /** 购买周数 */
  purchaseWeek: number;
}

/**
 * 玩家统计信息接口
 */
export interface PlayerStatistics {
  /** 当前周数 */
  weekCount: number;
  /** 交易次数 */
  transactionCount: number;
  /** 总利润 */
  totalProfit: number;
  /** 最大资金 */
  maxMoney: number;
  /** 已访问地点 */
  visitedLocations: string[];
}

/**
 * 玩家初始化选项接口
 */
export interface PlayerOptions {
  /** 玩家名称 */
  name?: string;
  /** 初始资金 */
  money?: number;
  /** 初始债务 */
  debt?: number;
  /** 背包容量 */
  capacity?: number;
  /** 银行存款 */
  bankDeposit?: number;
  /** 最大贷款额度 */
  maxLoanAmount?: number;
  /** 贷款本金 */
  loanPrincipal?: number | null;
}

/**
 * 商品接口（用于类型约束）
 */
export interface Product {
  id: string | number;
  name: string;
  size: number;
  price?: number;
}

/**
 * 房屋接口（用于类型约束）
 */
export interface House {
  id: string;
  name: string;
  price: number;
  level?: number;
}

// ==================== 玩家类 ====================

/**
 * 玩家类
 * 封装玩家的属性和行为
 */
export class Player {
  /** 玩家名称 */
  public name: string;
  /** 当前资金 */
  public money: number;
  /** 当前债务 */
  public debt: number;
  /** 贷款本金 */
  public loanPrincipal: number;
  /** 背包容量 */
  public capacity: number;
  /** 已使用的库存空间 */
  public inventoryUsed: number;
  /** 库存商品列表 */
  public inventory: InventoryItem[];
  /** 购买的房屋列表 */
  public purchasedHouses: PurchasedHouse[];
  /** 银行存款 */
  public bankDeposit: number;
  /** 最大贷款额度 */
  public maxLoanAmount: number;
  /** 统计信息 */
  public statistics: PlayerStatistics;

  /**
   * 创建玩家实例
   */
  constructor({
    name = '玩家',
    money = 5000,
    debt = 2000,
    capacity = 100,
    bankDeposit = 0,
    maxLoanAmount = 20000,
    loanPrincipal = null
  }: PlayerOptions = {}) {
    this.name = name;
    this.money = money;
    this.debt = debt;
    // 初始化贷款本金，默认与债务相同
    this.loanPrincipal = loanPrincipal !== null ? loanPrincipal : debt;
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
   */
  addMoney(amount: number): boolean {
    if (amount <= 0) return false;
    this.money += amount;
    if (this.money > this.statistics.maxMoney) {
      this.statistics.maxMoney = this.money;
    }
    return true;
  }

  /**
   * 减少玩家资金
   */
  spendMoney(amount: number): boolean {
    if (amount <= 0 || amount > this.money) return false;
    this.money -= amount;
    return true;
  }

  /**
   * 还款
   */
  repayDebt(amount: number): boolean {
    if (amount <= 0 || amount > this.money) return false;
    if (amount > this.debt) {
      amount = this.debt; // 只还清债务
    }

    this.money -= amount;
    this.debt -= amount;

    // 更新贷款本金
    if (this.loanPrincipal === undefined) {
      this.loanPrincipal = this.debt;
    } else {
      // 如果还款金额小于等于贷款本金，直接减少本金
      if (amount <= this.loanPrincipal) {
        this.loanPrincipal -= amount;
      } else {
        // 如果还款金额大于贷款本金，则本金归零
        this.loanPrincipal = 0;
      }
    }

    return true;
  }

  /**
   * 添加商品到库存
   */
  addToInventory(product: Product, quantity: number, price: number): boolean {
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
   */
  removeFromInventory(productId: string | number, quantity: number): boolean {
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
   */
  purchaseHouse(house: House, week: number): boolean {
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
   */
  visitLocation(locationId: string): boolean {
    if (!this.statistics.visitedLocations.includes(locationId)) {
      this.statistics.visitedLocations.push(locationId);
      return true;
    }
    return false;
  }

  /**
   * 存款到银行
   */
  depositToBank(amount: number): boolean {
    if (amount <= 0 || amount > this.money) return false;
    this.money -= amount;
    this.bankDeposit += amount;
    return true;
  }

  /**
   * 从银行取款
   */
  withdrawFromBank(amount: number): boolean {
    if (amount <= 0 || amount > this.bankDeposit) return false;
    this.bankDeposit -= amount;
    this.money += amount;
    return true;
  }
  
  /**
   * 更新玩家每周状态
   */
  updateWeeklyState(currentWeek: number): void {
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
  }

  /**
   * 计算净资产
   */
  get netWorth(): number {
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
   */
  get availableLoanAmount(): number {
    // 初始化贷款本金（如果不存在）
    if (this.loanPrincipal === undefined) {
      this.loanPrincipal = this.debt;
    }

    // 计算可贷款额度 = 最大贷款额度 - 已借贷本金
    return Math.max(0, this.maxLoanAmount - this.loanPrincipal);
  }

  /**
   * 检查是否拥有最高级别房屋
   */
  hasHighestLevelHouse(allHouses: House[]): boolean {
    if (this.purchasedHouses.length === 0) return false;

    // 找出最高级别的房屋
    const highestHouse = allHouses.reduce((highest, house) => {
      return house.price > highest.price ? house : highest;
    }, { price: 0, id: '', name: '' });

    // 检查是否拥有该房屋
    return this.purchasedHouses.some(house => house.houseId === highestHouse.id);
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建玩家工厂函数
 */
export function createPlayer(options?: PlayerOptions): Player {
  return new Player(options);
}

/**
 * 创建玩家持有的商品对象
 */
export function createPlayerProduct(
  product: Product, 
  quantity: number, 
  purchasePrice: number
): InventoryItem {
  return {
    productId: product.id,
    name: product.name,
    quantity: quantity,
    purchasePrice: purchasePrice,
    totalCost: purchasePrice * quantity,
    size: product.size || 1
  };
}