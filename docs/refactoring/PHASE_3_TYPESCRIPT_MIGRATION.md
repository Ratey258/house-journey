# 重构阶段3：TypeScript渐进式迁移详细指南

## 🎯 阶段目标

将项目从JavaScript逐步迁移到TypeScript，提升代码质量和开发体验，重点关注核心业务模块。

## 📋 当前状态分析

### TypeScript现状评估
```bash
# 项目文件统计
JavaScript文件: ~85个 (.js)
TypeScript文件: ~15个 (.ts)
Vue文件: ~25个 (.vue)
总体TS覆盖率: ~30%
```

### 已迁移的模块
- ✅ `src/stores/player/playerState.ts` - 玩家状态管理
- ✅ `src/types/` - 部分类型定义
- ✅ 部分工具函数

### 待迁移的关键模块
- 🔲 游戏核心逻辑 (`src/core/`)
- 🔲 事件系统 (`src/stores/events/`)
- 🔲 市场系统 (`src/stores/market/`)
- 🔲 UI组件 (`src/ui/components/`)

## 🚀 渐进式迁移策略

### 迁移优先级划分

#### 第一优先级：核心类型定义
```typescript
// src/types/game.ts - 游戏核心类型
export interface GameState {
  currentWeek: number;
  maxWeeks: number;
  gameStarted: boolean;
  gamePaused: boolean;
  gameOver: boolean;
  victoryAchieved: boolean;
  gameResult: GameResult | null;
}

export interface Player {
  id: string;
  name: string;
  money: number;
  debt: number;
  capacity: number;
  inventoryUsed: number;
  inventory: InventoryItem[];
  purchasedHouses: HouseInfo[];
  statistics: PlayerStatistics;
  bankDeposit: number;
  loanPrincipal: number;
  maxLoanAmount: number;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  basePrice: number;
  currentPrice: number;
  priceHistory: PriceHistoryEntry[];
  description: string;
  weight: number;
  rarity: ProductRarity;
  locationModifiers: Record<string, number>;
}

export interface Market {
  currentLocation: Location | null;
  products: Product[];
  locations: Location[];
  productPrices: Map<string, ProductPrice>;
  marketModifiers: MarketModifier[];
  priceFluctuations: Map<string, PriceFluctuation>;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  specialProducts: string[];
  priceModifiers: Record<string, number>;
  unlockConditions?: LocationUnlockConditions;
}

// 枚举类型
export enum ProductCategory {
  ELECTRONICS = 'electronics',
  FOOD = 'food',
  CLOTHING = 'clothing',
  LUXURY = 'luxury',
  MATERIALS = 'materials',
  SPECIALTY = 'specialty'
}

export enum ProductRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export enum GameDifficulty {
  EASY = 'easy',
  STANDARD = 'standard',
  HARD = 'hard'
}

export enum EventType {
  MARKET = 'market',
  PERSONAL = 'personal',
  LOCATION = 'location',
  RANDOM = 'random'
}

// 工具类型
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type GameEventHandler<T = any> = (data: T) => void | Promise<void>;

export type StoreState = {
  gameCore: GameState;
  player: Player;
  market: Market;
  events: EventState;
};
```

#### 第二优先级：业务模型迁移

```typescript
// src/core/models/Player.ts - 迁移玩家模型
import type { 
  Player as IPlayer, 
  PlayerStatistics, 
  InventoryItem, 
  HouseInfo 
} from '@/types/game';

export class Player implements IPlayer {
  public id: string;
  public name: string;
  public money: number;
  public debt: number;
  public capacity: number;
  public inventoryUsed: number;
  public inventory: InventoryItem[];
  public purchasedHouses: HouseInfo[];
  public statistics: PlayerStatistics;
  public bankDeposit: number;
  public loanPrincipal: number;
  public maxLoanAmount: number;

  constructor(data: Partial<IPlayer> = {}) {
    this.id = data.id || this.generateId();
    this.name = data.name || '玩家';
    this.money = data.money ?? 2000;
    this.debt = data.debt ?? 5000;
    this.capacity = data.capacity ?? 100;
    this.inventoryUsed = data.inventoryUsed ?? 0;
    this.inventory = data.inventory ?? [];
    this.purchasedHouses = data.purchasedHouses ?? [];
    this.bankDeposit = data.bankDeposit ?? 0;
    this.loanPrincipal = data.loanPrincipal ?? 5000;
    this.maxLoanAmount = data.maxLoanAmount ?? 20000;
    
    this.statistics = {
      weekCount: 1,
      transactionCount: 0,
      totalProfit: 0,
      maxMoney: this.money,
      visitedLocations: [],
      housePurchases: [],
      firstHousePurchaseWeek: null,
      mostExpensiveHouse: null,
      highestLevelHouse: null,
      ...data.statistics
    };
  }

  // 类型安全的方法
  public addMoney(amount: number): boolean {
    if (amount <= 0) return false;
    
    this.money += amount;
    this.statistics.maxMoney = Math.max(this.statistics.maxMoney, this.money);
    this.statistics.totalProfit += amount;
    
    return true;
  }

  public subtractMoney(amount: number): boolean {
    if (amount <= 0 || this.money < amount) return false;
    
    this.money -= amount;
    return true;
  }

  public addInventoryItem(item: InventoryItem): boolean {
    if (this.inventoryUsed + item.quantity > this.capacity) {
      return false;
    }

    const existingItem = this.inventory.find(inv => inv.productId === item.productId);
    
    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      this.inventory.push({ ...item });
    }

    this.inventoryUsed += item.quantity;
    this.statistics.transactionCount++;
    
    return true;
  }

  public removeInventoryItem(productId: string, quantity: number): boolean {
    const itemIndex = this.inventory.findIndex(item => item.productId === productId);
    
    if (itemIndex === -1) return false;
    
    const item = this.inventory[itemIndex];
    if (item.quantity < quantity) return false;

    item.quantity -= quantity;
    this.inventoryUsed -= quantity;

    if (item.quantity <= 0) {
      this.inventory.splice(itemIndex, 1);
    }

    this.statistics.transactionCount++;
    return true;
  }

  public get netWorth(): number {
    const inventoryValue = this.inventory.reduce(
      (total, item) => total + (item.quantity * item.purchasePrice), 
      0
    );
    return this.money + this.bankDeposit + inventoryValue - this.debt;
  }

  public get availableCapacity(): number {
    return this.capacity - this.inventoryUsed;
  }

  public get isInDebt(): boolean {
    return this.debt > 0;
  }

  public toJSON(): IPlayer {
    return {
      id: this.id,
      name: this.name,
      money: this.money,
      debt: this.debt,
      capacity: this.capacity,
      inventoryUsed: this.inventoryUsed,
      inventory: [...this.inventory],
      purchasedHouses: [...this.purchasedHouses],
      statistics: { ...this.statistics },
      bankDeposit: this.bankDeposit,
      loanPrincipal: this.loanPrincipal,
      maxLoanAmount: this.maxLoanAmount
    };
  }

  private generateId(): string {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

#### 第三优先级：Store迁移

```typescript
// src/stores/gameCore/gameState.ts - 游戏核心状态迁移
import { defineStore } from 'pinia';
import { ref, computed, reactive } from 'vue';
import type { 
  GameState, 
  GameResult, 
  GameDifficulty,
  Notification 
} from '@/types/game';

interface GameCoreStoreState {
  currentWeek: number;
  maxWeeks: number;
  gameStarted: boolean;
  gamePaused: boolean;
  gameOver: boolean;
  victoryAchieved: boolean;
  gameResult: GameResult | null;
  notifications: Notification[];
  initialized: boolean;
  gameGoals: {
    requiredNetWorth: number;
    targetWeeks: number;
  };
}

export const useGameCoreStore = defineStore('gameCore', () => {
  // 状态定义
  const state = reactive<GameCoreStoreState>({
    currentWeek: 1,
    maxWeeks: 52,
    gameStarted: false,
    gamePaused: false,
    gameOver: false,
    victoryAchieved: false,
    gameResult: null,
    notifications: [],
    initialized: false,
    gameGoals: {
      requiredNetWorth: 400000,
      targetWeeks: 30
    }
  });

  // 计算属性
  const gameProgress = computed((): number => {
    if (state.maxWeeks === Infinity) return 0;
    return Math.min((state.currentWeek / state.maxWeeks) * 100, 100);
  });

  const isEndlessMode = computed((): boolean => {
    return state.maxWeeks === Infinity;
  });

  const canAdvanceWeek = computed((): boolean => {
    return state.gameStarted && !state.gameOver && !state.gamePaused;
  });

  const gameStatus = computed((): 'not_started' | 'playing' | 'paused' | 'victory' | 'defeat' => {
    if (!state.gameStarted) return 'not_started';
    if (state.gamePaused) return 'paused';
    if (state.victoryAchieved) return 'victory';
    if (state.gameOver) return 'defeat';
    return 'playing';
  });

  // Actions
  const startNewGame = async (
    playerName: string, 
    difficulty: GameDifficulty = GameDifficulty.STANDARD
  ): Promise<void> => {
    try {
      console.log(`GameCore - 开始新游戏: ${playerName}, 难度: ${difficulty}`);
      
      // 重置状态
      Object.assign(state, {
        currentWeek: 1,
        maxWeeks: 52,
        gameStarted: true,
        gamePaused: false,
        gameOver: false,
        victoryAchieved: false,
        gameResult: null,
        notifications: [],
        initialized: true
      });

      // 根据难度调整参数
      applyDifficultySettings(difficulty);
      
      console.log('GameCore - 新游戏初始化完成');
    } catch (error) {
      console.error('GameCore - 开始新游戏失败:', error);
      throw error;
    }
  };

  const advanceWeek = (): boolean => {
    if (!canAdvanceWeek.value) {
      console.warn('GameCore - 无法进入下一周');
      return false;
    }

    try {
      if (state.currentWeek < state.maxWeeks || isEndlessMode.value) {
        state.currentWeek++;
        console.log(`GameCore - 进入第 ${state.currentWeek} 周`);
        
        // 检查胜利条件
        checkVictoryConditions();
        
        return true;
      } else {
        // 游戏结束
        endGame('timeLimit');
        return false;
      }
    } catch (error) {
      console.error('GameCore - 进入下一周失败:', error);
      return false;
    }
  };

  const pauseGame = (): void => {
    if (state.gameStarted && !state.gameOver) {
      state.gamePaused = true;
      console.log('GameCore - 游戏已暂停');
    }
  };

  const resumeGame = (): void => {
    if (state.gameStarted && state.gamePaused) {
      state.gamePaused = false;
      console.log('GameCore - 游戏已恢复');
    }
  };

  const endGame = (reason: 'victory' | 'defeat' | 'timeLimit' | 'bankruptcy'): void => {
    state.gameOver = true;
    state.victoryAchieved = reason === 'victory';
    
    // 生成游戏结果
    state.gameResult = generateGameResult(reason);
    
    console.log(`GameCore - 游戏结束: ${reason}`, state.gameResult);
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>): void => {
    const newNotification: Notification = {
      id: generateNotificationId(),
      timestamp: Date.now(),
      ...notification
    };
    
    state.notifications.push(newNotification);
    
    // 限制通知数量
    if (state.notifications.length > 10) {
      state.notifications.shift();
    }
  };

  const removeNotification = (id: string): void => {
    const index = state.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      state.notifications.splice(index, 1);
    }
  };

  const clearNotifications = (): void => {
    state.notifications.length = 0;
  };

  // 私有方法
  const applyDifficultySettings = (difficulty: GameDifficulty): void => {
    switch (difficulty) {
      case GameDifficulty.EASY:
        state.gameGoals.requiredNetWorth = 300000;
        state.gameGoals.targetWeeks = 40;
        break;
      case GameDifficulty.HARD:
        state.gameGoals.requiredNetWorth = 500000;
        state.gameGoals.targetWeeks = 25;
        break;
      case GameDifficulty.STANDARD:
      default:
        state.gameGoals.requiredNetWorth = 400000;
        state.gameGoals.targetWeeks = 30;
        break;
    }
  };

  const checkVictoryConditions = (): void => {
    // 这里需要访问玩家store检查胜利条件
    // 实际实现中会从usePlayerStore获取玩家状态
  };

  const generateGameResult = (endReason: string): GameResult => {
    return {
      endReason,
      finalWeek: state.currentWeek,
      score: calculateFinalScore(),
      achievements: [],
      statistics: {},
      timestamp: Date.now()
    };
  };

  const calculateFinalScore = (): number => {
    // 基础分数计算逻辑
    return Math.max(0, 1000 - (state.currentWeek * 10));
  };

  const generateNotificationId = (): string => {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // 返回store接口
  return {
    // 状态（只读）
    currentWeek: computed(() => state.currentWeek),
    maxWeeks: computed(() => state.maxWeeks),
    gameStarted: computed(() => state.gameStarted),
    gamePaused: computed(() => state.gamePaused),
    gameOver: computed(() => state.gameOver),
    victoryAchieved: computed(() => state.victoryAchieved),
    gameResult: computed(() => state.gameResult),
    notifications: computed(() => state.notifications),
    initialized: computed(() => state.initialized),
    gameGoals: computed(() => state.gameGoals),

    // 计算属性
    gameProgress,
    isEndlessMode,
    canAdvanceWeek,
    gameStatus,

    // 方法
    startNewGame,
    advanceWeek,
    pauseGame,
    resumeGame,
    endGame,
    addNotification,
    removeNotification,
    clearNotifications
  };
});

// 类型导出
export type GameCoreStore = ReturnType<typeof useGameCoreStore>;
```

#### 第四优先级：Vue组件迁移

```vue
<!-- src/ui/components/player/PlayerInfo.vue -->
<template>
  <div class="player-info">
    <div class="player-header">
      <h2 class="player-name">{{ playerName }}</h2>
      <div class="player-level">第 {{ currentWeek }} 周</div>
    </div>
    
    <div class="player-stats">
      <div class="stat-item">
        <label>现金</label>
        <span class="money-value" :class="moneyClass">
          ¥{{ formatNumber(money) }}
        </span>
      </div>
      
      <div class="stat-item">
        <label>债务</label>
        <span class="debt-value">¥{{ formatNumber(debt) }}</span>
      </div>
      
      <div class="stat-item">
        <label>净资产</label>
        <span class="net-worth-value" :class="netWorthClass">
          ¥{{ formatNumber(netWorth) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { usePlayerStore } from '@/stores/player/playerState';
import { useGameCoreStore } from '@/stores/gameCore/gameState';
import { formatNumber } from '@/utils/formatters';

// Props类型定义
interface Props {
  showDetails?: boolean;
  compact?: boolean;
}

// Props with defaults
const props = withDefaults(defineProps<Props>(), {
  showDetails: true,
  compact: false
});

// Emits类型定义
interface Emits {
  playerClick: [playerId: string];
  statChange: [stat: string, value: number];
}

const emit = defineEmits<Emits>();

// Store引用
const playerStore = usePlayerStore();
const gameCoreStore = useGameCoreStore();

// 响应式数据解构
const { name: playerName, money, debt, netWorth } = storeToRefs(playerStore);
const { currentWeek } = storeToRefs(gameCoreStore);

// 计算属性
const moneyClass = computed((): string => {
  if (money.value >= 50000) return 'money-high';
  if (money.value >= 10000) return 'money-medium';
  if (money.value >= 1000) return 'money-low';
  return 'money-critical';
});

const netWorthClass = computed((): string => {
  return netWorth.value >= 0 ? 'positive' : 'negative';
});

// 方法
const handlePlayerClick = (): void => {
  emit('playerClick', playerStore.id);
};

// 类型安全的格式化函数
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};
</script>

<style scoped>
.player-info {
  @apply bg-white rounded-lg shadow-md p-4;
}

.player-header {
  @apply flex justify-between items-center mb-4;
}

.player-name {
  @apply text-xl font-bold text-gray-800;
}

.player-level {
  @apply text-sm text-gray-600;
}

.player-stats {
  @apply space-y-2;
}

.stat-item {
  @apply flex justify-between items-center;
}

.money-value.money-high {
  @apply text-green-600 font-bold;
}

.money-value.money-medium {
  @apply text-blue-600;
}

.money-value.money-low {
  @apply text-orange-600;
}

.money-value.money-critical {
  @apply text-red-600 font-bold;
}

.net-worth-value.positive {
  @apply text-green-600;
}

.net-worth-value.negative {
  @apply text-red-600;
}
</style>
```

### TypeScript配置优化

```json
// tsconfig.json - 项目TypeScript配置
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "strict": true,
    "noEmit": true,
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    
    /* 路径映射 */
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@ui/*": ["src/ui/*"],
      "@core/*": ["src/core/*"],
      "@stores/*": ["src/stores/*"],
      "@utils/*": ["src/infrastructure/utils/*"],
      "@types/*": ["src/types/*"]
    },
    
    /* Vue支持 */
    "jsx": "preserve",
    "jsxFactory": "h",
    "jsxFragmentFactory": "Fragment",
    
    /* 类型检查强化 */
    "noUnusedLocals": false, // 开发阶段设为false
    "noUnusedParameters": false,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    
    /* 输出配置 */
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    
    /* 高级选项 */
    "resolveJsonModule": true,
    "isolatedModules": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    
    /* 实验性功能 */
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  
  "include": [
    "src/**/*.ts",
    "src/**/*.vue",
    "src/**/*.js", // 逐步迁移时保留
    "*.d.ts"
  ],
  
  "exclude": [
    "node_modules",
    "dist",
    "build-output",
    "**/*.spec.ts",
    "**/*.test.ts"
  ],
  
  "ts-node": {
    "esm": true
  }
}
```

### VSCode配置优化

```json
// .vscode/settings.json - 项目级VS Code配置
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "typescript.inlayHints.parameterNames.enabled": "all",
  "typescript.inlayHints.variableTypes.enabled": true,
  "typescript.inlayHints.functionLikeReturnTypes.enabled": true,
  
  // Vue支持
  "vetur.experimental.templateInterpolationService": true,
  "vetur.validation.template": false,
  "vetur.validation.script": false,
  "vetur.validation.style": false,
  
  // Volar配置
  "vue.server.hybridMode": true,
  "vue.splitEditors.icon": true,
  "vue.splitEditors.layout.left": ["script", "scriptSetup", "styles"],
  "vue.splitEditors.layout.right": ["template", "customBlocks"],
  
  // 自动保存和格式化
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  
  // 文件关联
  "files.associations": {
    "*.vue": "vue"
  },
  
  // 智能提示
  "editor.suggest.insertMode": "replace",
  "editor.acceptSuggestionOnCommitCharacter": false,
  "editor.acceptSuggestionOnEnter": "on"
}
```

## 📊 迁移进度跟踪

### 迁移检查清单

```typescript
// scripts/migration-tracker.ts - 迁移进度跟踪脚本
import fs from 'fs';
import path from 'path';
import glob from 'glob';

interface MigrationStatus {
  totalFiles: number;
  jsFiles: number;
  tsFiles: number;
  vueFiles: number;
  migrationProgress: number;
  moduleStatus: Record<string, {
    totalFiles: number;
    migratedFiles: number;
    progress: number;
  }>;
}

class MigrationTracker {
  private srcDir = path.join(process.cwd(), 'src');

  async generateReport(): Promise<MigrationStatus> {
    const allFiles = glob.sync('**/*.{js,ts,vue}', { cwd: this.srcDir });
    
    const jsFiles = allFiles.filter(f => f.endsWith('.js'));
    const tsFiles = allFiles.filter(f => f.endsWith('.ts'));
    const vueFiles = allFiles.filter(f => f.endsWith('.vue'));
    
    const moduleStatus = await this.analyzeModules();
    
    const migrationProgress = tsFiles.length / (jsFiles.length + tsFiles.length) * 100;
    
    return {
      totalFiles: allFiles.length,
      jsFiles: jsFiles.length,
      tsFiles: tsFiles.length,
      vueFiles: vueFiles.length,
      migrationProgress: Math.round(migrationProgress),
      moduleStatus
    };
  }

  private async analyzeModules(): Promise<Record<string, any>> {
    const modules = ['core', 'stores', 'ui/components', 'infrastructure'];
    const status: Record<string, any> = {};
    
    for (const module of modules) {
      const modulePath = path.join(this.srcDir, module);
      if (fs.existsSync(modulePath)) {
        const files = glob.sync('**/*.{js,ts}', { cwd: modulePath });
        const tsFiles = files.filter(f => f.endsWith('.ts'));
        
        status[module] = {
          totalFiles: files.length,
          migratedFiles: tsFiles.length,
          progress: Math.round((tsFiles.length / files.length) * 100)
        };
      }
    }
    
    return status;
  }

  async printReport(): Promise<void> {
    const status = await this.generateReport();
    
    console.log('\n📊 TypeScript迁移进度报告');
    console.log('================================');
    console.log(`总体进度: ${status.migrationProgress}%`);
    console.log(`总文件数: ${status.totalFiles}`);
    console.log(`JavaScript文件: ${status.jsFiles}`);
    console.log(`TypeScript文件: ${status.tsFiles}`);
    console.log(`Vue文件: ${status.vueFiles}`);
    
    console.log('\n📂 模块迁移状态:');
    Object.entries(status.moduleStatus).forEach(([module, info]) => {
      console.log(`  ${module}: ${info.progress}% (${info.migratedFiles}/${info.totalFiles})`);
    });
    
    // 保存报告到文件
    const reportPath = path.join(process.cwd(), 'migration-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(status, null, 2));
    console.log(`\n📋 详细报告已保存到: ${reportPath}`);
  }
}

// 运行脚本
if (require.main === module) {
  const tracker = new MigrationTracker();
  tracker.printReport().catch(console.error);
}

export default MigrationTracker;
```

## 🎯 预期收益

### 开发体验提升
- **类型安全**: 编译时错误检查，减少运行时错误
- **智能提示**: 更好的IDE支持和代码补全
- **重构安全**: 类型系统保证重构的正确性
- **文档化**: 类型即文档，提升代码可读性

### 代码质量提升
- **接口约束**: 明确的API契约
- **null安全**: 避免undefined/null错误
- **枚举类型**: 更好的常量管理
- **泛型支持**: 可复用的类型安全组件

### 维护性改善
- **重构友好**: 大规模重构时的安全保障
- **团队协作**: 统一的类型规范
- **版本兼容**: 类型定义的版本控制

## ⚠️ 风险控制

### 迁移风险
1. **构建时间增加**: TypeScript编译开销
2. **学习成本**: 团队TypeScript技能要求
3. **第三方库兼容性**: 类型定义不完整

### 缓解策略
1. **渐进迁移**: 不破坏现有功能
2. **类型覆盖**: 为缺失类型的库提供声明
3. **性能监控**: 监控构建性能影响

## 📅 实施计划

### 第一周：基础设施
- [x] TypeScript配置优化
- [ ] 核心类型定义
- [ ] 构建流程调整

### 第二周：核心模块
- [ ] Player模型迁移
- [ ] Game状态迁移
- [ ] Market系统迁移

### 第三周：UI组件
- [ ] 关键组件迁移
- [ ] 类型安全的props
- [ ] 事件类型定义

### 第四周：完善优化
- [ ] 类型检查强化
- [ ] 文档更新
- [ ] 性能优化

## 🎉 完成标准

- [ ] 核心业务模块100%迁移到TypeScript
- [ ] 类型覆盖率达到80%以上
- [ ] 所有编译错误和类型错误已解决
- [ ] 开发体验明显改善
- [ ] 构建性能无显著影响
- [ ] 团队成员能熟练使用TypeScript开发
