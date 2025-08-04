import { defineStore } from 'pinia';
import { ref, computed, reactive, readonly } from 'vue';
import i18n from '../../i18n';

// 响应式数据设置辅助函数
function setReactiveValue(obj: any, key: string, value: any) {
  if (obj && typeof obj[key] === 'object' && 'value' in obj[key]) {
    obj[key].value = value;
  } else {
    obj[key] = value;
  }
}

/**
 * 玩家状态类型定义 - Pinia 3.0 增强的TypeScript支持
 */
export interface PlayerStatistics {
  weekCount: number;
  transactionCount: number;
  totalProfit: number;
  maxMoney: number;
  visitedLocations: string[];
  housePurchases: any[];
  firstHousePurchaseWeek: number | null;
  mostExpensiveHouse: any | null;
  highestLevelHouse: any | null;
}

export interface InventoryItem {
  productId: string;
  quantity: number;
  purchasePrice: number;
  [key: string]: any;
}

export interface HouseInfo {
  id: string;
  name: string;
  price: number;
  level: number;
  purchasePrice: number;
  purchaseWeek: number;
}

/**
 * 玩家状态管理 - Pinia 3.0 Setup Store
 * 负责管理玩家的基本信息、财产、库存等
 * 使用Composition API风格，提供更好的TypeScript支持和代码组织
 */
export const usePlayerStore = defineStore('player', () => {
  // === 状态定义 ===
  const name = ref<string>('');
  const money = ref<number>(2000);
  const debt = ref<number>(5000);
  const loanPrincipal = ref<number>(5000); // 贷款本金追踪
  const capacity = ref<number>(100);
  const inventoryUsed = ref<number>(0);
  const inventory = ref<InventoryItem[]>([]);
  const purchasedHouses = ref<HouseInfo[]>([]);
  const initialized = ref<boolean>(false);
  const bankDeposit = ref<number>(0);
  const maxLoanAmount = ref<number>(20000);

  // 使用reactive保持对象的响应性 - Pinia 3.0最佳实践
  const statistics = reactive<PlayerStatistics>({
    weekCount: 1,
    transactionCount: 0,
    totalProfit: 0,
    maxMoney: 2000,
    visitedLocations: [],
    housePurchases: [],
    firstHousePurchaseWeek: null,
    mostExpensiveHouse: null,
    highestLevelHouse: null
  });

  // === Getters (Computed) - Pinia 3.0 性能优化 ===
  const totalAssets = computed(() => money.value + bankDeposit.value);
  const netWorth = computed(() => totalAssets.value - debt.value);
  const availableCapacity = computed(() => capacity.value - inventoryUsed.value);
  const isInDebt = computed(() => debt.value > 0);
  const canTakeLoan = computed(() => debt.value < maxLoanAmount.value);

  // 库存价值计算 - 优化版本
  const inventoryValue = computed(() => {
    return inventory.value.reduce((total, item) => {
      return total + (item.quantity * item.purchasePrice);
    }, 0);
  });

  // 总资产（包含库存）
  const totalMoney = computed(() => money.value + inventoryValue.value);

  // 银行相关计算属性
  const weeklyInterest = computed(() => {
    const depositInterest = bankDeposit.value * 0.003; // 0.3% 存款利息
    const loanInterest = debt.value * 0.005; // 0.5% 贷款利息
    return depositInterest - loanInterest;
  });

  // 可贷款金额
  const availableLoanAmount = computed(() => {
    return Math.max(0, Math.floor(maxLoanAmount.value - loanPrincipal.value));
  });

  // 房产相关计算
  const hasHighestHouse = computed(() => {
    return purchasedHouses.value.some(house => house.level >= 5);
  });

  const mostExpensiveHouse = computed(() => {
    if (purchasedHouses.value.length === 0) return null;
    return purchasedHouses.value.reduce(
      (most, house) => house.purchasePrice > most.purchasePrice ? house : most,
      purchasedHouses.value[0]
    );
  });

  // 利率常量
  const depositInterestRate = computed(() => 0.003); // 0.3%/周
  const loanInterestRate = computed(() => 0.005); // 0.5%/周

  // === Actions (Functions) - Pinia 3.0 优化版本 ===

  /**
   * 初始化玩家 - 异步版本
   */
  const initializePlayer = async (playerName: string): Promise<void> => {
    console.log('PlayerStore - 初始化玩家:', playerName);

    try {
      // 重置所有状态
      setReactiveValue({ name }, 'name', playerName || i18n.global.t('system.defaultPlayerName'));
      money.value = 2000;
      debt.value = 5000;
      loanPrincipal.value = 5000;
      capacity.value = 100;
      inventoryUsed.value = 0;
      inventory.value = [];
      purchasedHouses.value = [];
      bankDeposit.value = 0;

      // 重置统计信息
      Object.assign(statistics, {
        weekCount: 1,
        transactionCount: 0,
        totalProfit: 0,
        maxMoney: 2000,
        visitedLocations: [],
        housePurchases: [],
        firstHousePurchaseWeek: null,
        mostExpensiveHouse: null,
        highestLevelHouse: null
      });

      initialized.value = true;
      console.log('PlayerStore - 玩家初始化完成');
    } catch (error) {
      console.error('PlayerStore - 初始化失败:', error);
      throw error;
    }
  };

  /**
   * 添加物品到背包 - 类型安全版本
   */
  const addInventoryItem = (item: InventoryItem): boolean => {
    console.log('PlayerStore - 添加物品:', item);

    // 类型安全验证
    if (!item?.productId || !item?.quantity || item.quantity <= 0) {
      console.error('PlayerStore - 无效的物品对象:', item);
      return false;
    }

    // 检查容量限制
    if (inventoryUsed.value + item.quantity > capacity.value) {
      console.warn('PlayerStore - 背包容量不足');
      return false;
    }

    // 查找是否已有相同物品
    const existingItemIndex = inventory.value.findIndex(
      existingItem => existingItem.productId === item.productId
    );

    if (existingItemIndex >= 0) {
      // 合并相同物品
      inventory.value[existingItemIndex].quantity += item.quantity;
    } else {
      // 添加新物品
      inventory.value.push({ ...item });
    }

    // 更新已用容量
    inventoryUsed.value += item.quantity;
    statistics.transactionCount++;

    return true;
  };

  /**
   * 移除背包物品 - 优化版本
   */
  const removeInventoryItem = (productId: string, quantity: number): boolean => {
    const itemIndex = inventory.value.findIndex(item => item.productId === productId);

    if (itemIndex === -1) {
      console.warn('PlayerStore - 物品不存在:', productId);
      return false;
    }

    const item = inventory.value[itemIndex];
    if (item.quantity < quantity) {
      console.warn('PlayerStore - 物品数量不足');
      return false;
    }

    // 更新数量
    item.quantity -= quantity;
    inventoryUsed.value -= quantity;

    // 如果数量为0，移除物品
    if (item.quantity <= 0) {
      inventory.value.splice(itemIndex, 1);
    }

    statistics.transactionCount++;
    return true;
  };

  /**
   * 更新金钱 - 安全版本
   */
  const updateMoney = (amount: number): boolean => {
    const newAmount = money.value + amount;
    if (newAmount < 0) {
      console.warn('PlayerStore - 资金不足，无法扣除');
      return false;
    }

    money.value = newAmount;
    statistics.maxMoney = Math.max(statistics.maxMoney, money.value);

    if (amount > 0) {
      statistics.totalProfit += amount;
    }

    return true;
  };

  /**
   * 银行存款
   */
  const deposit = (amount: number): boolean => {
    if (amount <= 0 || money.value < amount) {
      return false;
    }

    money.value -= amount;
    bankDeposit.value += amount;
    return true;
  };

  /**
   * 银行取款
   */
  const withdraw = (amount: number): boolean => {
    if (amount <= 0 || bankDeposit.value < amount) {
      return false;
    }

    bankDeposit.value -= amount;
    money.value += amount;
    return true;
  };

  /**
   * 贷款
   */
  const takeLoan = (amount: number): boolean => {
    if (amount <= 0 || amount > availableLoanAmount.value) {
      return false;
    }

    money.value += amount;
    debt.value += amount;
    loanPrincipal.value += amount;
    return true;
  };

  /**
   * 还贷
   */
  const repayLoan = (amount: number): boolean => {
    if (amount <= 0 || money.value < amount || debt.value < amount) {
      return false;
    }

    money.value -= amount;
    debt.value -= amount;
    loanPrincipal.value = Math.max(0, loanPrincipal.value - amount);
    return true;
  };

  /**
   * 购买房屋
   */
  const purchaseHouse = (house: Omit<HouseInfo, 'purchasePrice' | 'purchaseWeek'>): boolean => {
    if (money.value < house.price) {
      return false;
    }

    const houseInfo: HouseInfo = {
      ...house,
      purchasePrice: house.price,
      purchaseWeek: statistics.weekCount
    };

    money.value -= house.price;
    purchasedHouses.value.push(houseInfo);
    statistics.housePurchases.push(houseInfo);

    // 更新统计信息
    if (statistics.firstHousePurchaseWeek === null) {
      statistics.firstHousePurchaseWeek = statistics.weekCount;
    }

    return true;
  };

  /**
   * 处理每周利息
   */
  const processWeeklyInterest = (): void => {
    const interest = weeklyInterest.value;
    money.value += interest;

    if (interest > 0) {
      statistics.totalProfit += interest;
    }
  };

  /**
   * 更新周数
   */
  const incrementWeek = (): void => {
    statistics.weekCount++;
    processWeeklyInterest();
  };

  /**
   * 更新玩家每周状态 - 兼容旧版本API
   * @param currentWeek 当前周数
   */
  const updateWeeklyPlayerState = (currentWeek: number): void => {
    console.log(`PlayerStore - 更新玩家每周状态，周数: ${currentWeek}`);

    // 更新周数统计
    statistics.weekCount = currentWeek;

    // 处理债务利息（每周增加0.5%）
    if (debt.value > 0) {
      const interest = Math.floor(debt.value * 0.005);
      debt.value += interest;
      console.log(`PlayerStore - 债务利息: ${interest}, 总债务: ${debt.value}`);
    }

    // 处理银行存款利息（每周增加0.3%）
    if (bankDeposit.value > 0) {
      const depositInterest = Math.floor(bankDeposit.value * 0.003);
      bankDeposit.value += depositInterest;
      console.log(`PlayerStore - 存款利息: ${depositInterest}, 总存款: ${bankDeposit.value}`);
    }

    // 更新最高金额记录
    const currentTotal = money.value + bankDeposit.value;
    if (currentTotal > statistics.maxMoney) {
      statistics.maxMoney = currentTotal;
    }
  };

  /**
   * 重置玩家数据
   */
  const resetPlayer = (): void => {
    initializePlayer('');
  };

  // === 返回 store 接口 - Pinia 3.0 完整类型支持 ===
  return {
    // 状态
    name: readonly(name),
    money: readonly(money),
    debt: readonly(debt),
    loanPrincipal: readonly(loanPrincipal),
    capacity: readonly(capacity),
    inventoryUsed: readonly(inventoryUsed),
    inventory: readonly(inventory),
    purchasedHouses: readonly(purchasedHouses),
    initialized: readonly(initialized),
    bankDeposit: readonly(bankDeposit),
    maxLoanAmount: readonly(maxLoanAmount),
    statistics: readonly(statistics),

    // 计算属性
    totalAssets,
    netWorth,
    availableCapacity,
    isInDebt,
    canTakeLoan,
    inventoryValue,
    totalMoney,
    weeklyInterest,
    availableLoanAmount,
    hasHighestHouse,
    mostExpensiveHouse,
    depositInterestRate,
    loanInterestRate,

    // 方法
    initializePlayer,
    addInventoryItem,
    removeInventoryItem,
    updateMoney,
    deposit,
    withdraw,
    takeLoan,
    repayLoan,
    purchaseHouse,
    processWeeklyInterest,
    incrementWeek,
    updateWeeklyPlayerState,
    resetPlayer
  };
});
