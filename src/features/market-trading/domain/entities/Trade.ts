/**
 * 交易实体 - Trade Entity
 * 市场交易特性的核心领域实体
 */

import type { BaseEntity, Timestamps } from '../../../../shared/types';

// === 交易相关类型定义 ===

/**
 * 交易ID类型
 */
export type TradeId = string;

/**
 * 交易类型枚举
 */
export enum TradeType {
  BUY = 'buy',
  SELL = 'sell'
}

/**
 * 交易状态枚举
 */
export enum TradeStatus {
  PENDING = 'pending',
  EXECUTED = 'executed',
  CANCELLED = 'cancelled',
  FAILED = 'failed'
}

/**
 * 交易结果
 */
export interface TradeResult {
  success: boolean;
  tradeId: TradeId;
  executedAt: Date;
  actualPrice: number;
  actualQuantity: number;
  totalAmount: number;
  commission: number;
  netAmount: number;
  message?: string;
}

/**
 * 市场条件
 */
export interface MarketConditions {
  currentWeek: number;
  season: string;
  marketTrend: 'bull' | 'bear' | 'sideways';
  volatilityIndex: number;
  liquidityIndex: number;
  demandIndex: number;
  supplyIndex: number;
}

/**
 * 交易验证结果
 */
export interface TradeValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 交易创建选项
 */
export interface TradeCreateOptions {
  id?: TradeId;
  playerId: string;
  productId: string;
  marketId: string;
  type: TradeType;
  quantity: number;
  requestedPrice: number;
  marketConditions: MarketConditions;
}

// === 交易实体类 ===

/**
 * 交易实体
 * 记录和管理单次市场交易的完整生命周期
 */
export class Trade implements BaseEntity, Timestamps {
  public readonly id: TradeId;
  public readonly createdAt: Date;
  public updatedAt: Date;

  // 交易基本信息
  public readonly playerId: string;
  public readonly productId: string;
  public readonly marketId: string;
  public readonly type: TradeType;
  public readonly quantity: number;
  public readonly requestedPrice: number;

  // 交易状态
  public status: TradeStatus;
  public statusMessage: string;

  // 执行信息
  public executedAt?: Date;
  public actualPrice?: number;
  public actualQuantity?: number;
  public totalAmount?: number;
  public commission?: number;
  public netAmount?: number;

  // 市场环境
  public readonly marketConditions: MarketConditions;

  // 交易元数据
  public attempts: number;
  public lastAttemptAt?: Date;
  public failureReason?: string;
  public profit?: number; // 仅对卖出交易有效

  constructor(options: TradeCreateOptions) {
    this.id = options.id || this.generateId();
    this.createdAt = new Date();
    this.updatedAt = new Date();

    // 基本信息
    this.playerId = options.playerId;
    this.productId = options.productId;
    this.marketId = options.marketId;
    this.type = options.type;
    this.quantity = options.quantity;
    this.requestedPrice = options.requestedPrice;

    // 状态初始化
    this.status = TradeStatus.PENDING;
    this.statusMessage = '等待执行';

    // 市场环境
    this.marketConditions = { ...options.marketConditions };

    // 元数据初始化
    this.attempts = 0;
  }

  // === 交易执行方法 ===

  /**
   * 执行交易
   */
  public execute(actualPrice: number, actualQuantity: number, commissionRate: number): TradeResult {
    if (this.status !== TradeStatus.PENDING) {
      throw new Error(`交易状态错误: ${this.status}`);
    }

    this.attempts++;
    this.lastAttemptAt = new Date();

    try {
      // 验证执行参数
      if (actualPrice <= 0 || actualQuantity <= 0) {
        throw new Error('无效的执行参数');
      }

      if (actualQuantity > this.quantity) {
        throw new Error('执行数量超过请求数量');
      }

      // 计算交易金额
      this.actualPrice = actualPrice;
      this.actualQuantity = actualQuantity;
      this.totalAmount = actualPrice * actualQuantity;
      this.commission = this.totalAmount * commissionRate;

      // 计算净金额
      if (this.type === TradeType.BUY) {
        this.netAmount = this.totalAmount + this.commission; // 买入需要支付手续费
      } else {
        this.netAmount = this.totalAmount - this.commission; // 卖出扣除手续费
      }

      // 标记为已执行
      this.status = TradeStatus.EXECUTED;
      this.statusMessage = '交易成功';
      this.executedAt = new Date();

      this.updateTimestamp();

      return {
        success: true,
        tradeId: this.id,
        executedAt: this.executedAt,
        actualPrice: this.actualPrice,
        actualQuantity: this.actualQuantity,
        totalAmount: this.totalAmount,
        commission: this.commission,
        netAmount: this.netAmount
      };

    } catch (error) {
      this.status = TradeStatus.FAILED;
      this.failureReason = error instanceof Error ? error.message : '交易执行失败';
      this.statusMessage = this.failureReason;

      this.updateTimestamp();

      return {
        success: false,
        tradeId: this.id,
        executedAt: new Date(),
        actualPrice: 0,
        actualQuantity: 0,
        totalAmount: 0,
        commission: 0,
        netAmount: 0,
        message: this.failureReason
      };
    }
  }

  /**
   * 取消交易
   */
  public cancel(reason: string = '用户取消'): void {
    if (this.status === TradeStatus.EXECUTED) {
      throw new Error('已执行的交易无法取消');
    }

    this.status = TradeStatus.CANCELLED;
    this.statusMessage = reason;
    this.failureReason = reason;

    this.updateTimestamp();
  }

  /**
   * 计算预期成本（买入交易）
   */
  public calculateExpectedCost(commissionRate: number): number {
    const totalAmount = this.requestedPrice * this.quantity;
    const commission = totalAmount * commissionRate;
    return totalAmount + commission;
  }

  /**
   * 计算预期收益（卖出交易）
   */
  public calculateExpectedRevenue(commissionRate: number): number {
    const totalAmount = this.requestedPrice * this.quantity;
    const commission = totalAmount * commissionRate;
    return totalAmount - commission;
  }

  /**
   * 计算利润（仅适用于卖出交易）
   */
  public calculateProfit(purchasePrice: number): number {
    if (this.type !== TradeType.SELL || this.status !== TradeStatus.EXECUTED) {
      return 0;
    }

    if (!this.actualPrice || !this.actualQuantity) {
      return 0;
    }

    const purchaseCost = purchasePrice * this.actualQuantity;
    const saleRevenue = this.netAmount || 0;

    this.profit = saleRevenue - purchaseCost;
    return this.profit;
  }

  // === 验证方法 ===

  /**
   * 验证交易请求
   */
  public static validateTradeRequest(
    type: TradeType,
    quantity: number,
    price: number,
    playerMoney: number,
    productStock: number,
    minOrderValue: number,
    maxOrderValue: number
  ): TradeValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 基本参数验证
    if (quantity <= 0) {
      errors.push('数量必须大于0');
    }

    if (price <= 0) {
      errors.push('价格必须大于0');
    }

    const orderValue = quantity * price;

    // 订单金额验证
    if (orderValue < minOrderValue) {
      errors.push(`订单金额不能低于${minOrderValue}元`);
    }

    if (orderValue > maxOrderValue) {
      errors.push(`订单金额不能超过${maxOrderValue}元`);
    }

    // 特定交易类型验证
    if (type === TradeType.BUY) {
      // 买入验证
      if (orderValue > playerMoney) {
        errors.push('资金不足');
      }

      if (quantity > productStock) {
        errors.push('库存不足');
      }

      // 资金接近上限警告
      if (orderValue > playerMoney * 0.8) {
        warnings.push('此交易将消耗大部分资金');
      }

    } else if (type === TradeType.SELL) {
      // 卖出验证 - 这里需要检查玩家库存
      // 注意：实际实现中需要传入玩家库存数据
      if (quantity > productStock) {
        errors.push('持有数量不足');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // === 查询方法 ===

  /**
   * 是否为买入交易
   */
  public isBuyTrade(): boolean {
    return this.type === TradeType.BUY;
  }

  /**
   * 是否为卖出交易
   */
  public isSellTrade(): boolean {
    return this.type === TradeType.SELL;
  }

  /**
   * 是否已执行
   */
  public isExecuted(): boolean {
    return this.status === TradeStatus.EXECUTED;
  }

  /**
   * 是否可取消
   */
  public isCancellable(): boolean {
    return this.status === TradeStatus.PENDING;
  }

  /**
   * 获取交易描述
   */
  public getDescription(): string {
    const action = this.type === TradeType.BUY ? '购买' : '出售';
    return `${action} ${this.quantity} 件商品，单价 ${this.requestedPrice} 元`;
  }

  /**
   * 获取状态描述
   */
  public getStatusDescription(): string {
    switch (this.status) {
      case TradeStatus.PENDING:
        return '等待执行';
      case TradeStatus.EXECUTED:
        return '交易成功';
      case TradeStatus.CANCELLED:
        return '已取消';
      case TradeStatus.FAILED:
        return '交易失败';
      default:
        return '未知状态';
    }
  }

  // === 私有辅助方法 ===

  private generateId(): TradeId {
    return `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateTimestamp(): void {
    this.updatedAt = new Date();
  }

  // === 序列化方法 ===

  /**
   * 转换为JSON对象
   */
  public toJSON(): any {
    return {
      id: this.id,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      playerId: this.playerId,
      productId: this.productId,
      marketId: this.marketId,
      type: this.type,
      quantity: this.quantity,
      requestedPrice: this.requestedPrice,
      status: this.status,
      statusMessage: this.statusMessage,
      executedAt: this.executedAt?.toISOString(),
      actualPrice: this.actualPrice,
      actualQuantity: this.actualQuantity,
      totalAmount: this.totalAmount,
      commission: this.commission,
      netAmount: this.netAmount,
      marketConditions: this.marketConditions,
      attempts: this.attempts,
      lastAttemptAt: this.lastAttemptAt?.toISOString(),
      failureReason: this.failureReason,
      profit: this.profit
    };
  }

  /**
   * 从JSON对象恢复
   */
  public static fromJSON(data: any): Trade {
    const trade = new Trade({
      id: data.id,
      playerId: data.playerId,
      productId: data.productId,
      marketId: data.marketId,
      type: data.type,
      quantity: data.quantity,
      requestedPrice: data.requestedPrice,
      marketConditions: data.marketConditions
    });

    // 恢复时间戳
    trade.createdAt = new Date(data.createdAt);
    trade.updatedAt = new Date(data.updatedAt);

    // 恢复状态和执行信息
    trade.status = data.status;
    trade.statusMessage = data.statusMessage;
    trade.executedAt = data.executedAt ? new Date(data.executedAt) : undefined;
    trade.actualPrice = data.actualPrice;
    trade.actualQuantity = data.actualQuantity;
    trade.totalAmount = data.totalAmount;
    trade.commission = data.commission;
    trade.netAmount = data.netAmount;
    trade.attempts = data.attempts || 0;
    trade.lastAttemptAt = data.lastAttemptAt ? new Date(data.lastAttemptAt) : undefined;
    trade.failureReason = data.failureReason;
    trade.profit = data.profit;

    return trade;
  }
}

// === 工厂函数 ===

/**
 * 创建买入交易
 */
export function createBuyTrade(
  playerId: string,
  productId: string,
  marketId: string,
  quantity: number,
  price: number,
  marketConditions: MarketConditions
): Trade {
  return new Trade({
    playerId,
    productId,
    marketId,
    type: TradeType.BUY,
    quantity,
    requestedPrice: price,
    marketConditions
  });
}

/**
 * 创建卖出交易
 */
export function createSellTrade(
  playerId: string,
  productId: string,
  marketId: string,
  quantity: number,
  price: number,
  marketConditions: MarketConditions
): Trade {
  return new Trade({
    playerId,
    productId,
    marketId,
    type: TradeType.SELL,
    quantity,
    requestedPrice: price,
    marketConditions
  });
}