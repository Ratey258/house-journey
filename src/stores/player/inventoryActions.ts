/**
 * 库存管理相关操作 - TypeScript版本
 * 提供添加和移除物品的功能
 */

import { usePlayerStore } from './playerState';

// ==================== 类型定义 ====================

/**
 * 产品对象接口
 */
export interface Product {
  id: string | number;
  name: string;
  category?: string;
  [key: string]: any;
}

/**
 * 库存物品接口
 */
export interface InventoryItem {
  productId: string | number;
  name: string;
  quantity: number;
  purchasePrice: number;
  totalValue?: number;
  size: number;
}

/**
 * 操作结果接口
 */
export interface OperationResult {
  success: boolean;
  message?: string;
  product?: InventoryItem;
}

// ==================== 库存操作服务 ====================

/**
 * 库存管理相关操作服务
 */
export const useInventoryActions = () => {
  const playerStore = usePlayerStore();

  /**
   * 添加物品到库存
   * @param product 产品对象
   * @param quantity 数量
   * @param price 购买价格
   * @returns 操作结果
   */
  const addToInventory = (product: Product, quantity: number, price: number): OperationResult => {
    console.log('InventoryActions - addToInventory开始 - 参数:', {
      product: product ? {
        id: product.id,
        name: product.name,
        category: product.category
      } : 'null',
      quantity,
      price
    });

    console.log('InventoryActions - 当前背包状态:', {
      inventoryUsed: playerStore.inventoryUsed,
      capacity: playerStore.capacity,
      inventoryCount: playerStore.inventory.length
    });

    // 检查参数有效性
    if (!product || quantity <= 0 || price < 0) {
      console.error('InventoryActions - 参数无效:', { product, quantity, price });
      return { success: false, message: '无效的产品数据' };
    }

    // 确保产品对象有必要的属性
    if (!product.id) {
      console.error('InventoryActions - 产品对象缺少id属性:', product);
      return { success: false, message: '产品对象缺少id属性' };
    }

    // 输出产品对象的详细信息
    console.log('InventoryActions - 产品对象详情:', {
      id: product.id,
      name: product.name,
      hasToString: typeof product.toString === 'function',
      prototype: Object.getPrototypeOf(product),
      ownProperties: Object.keys(product)
    });

    // 检查容量 - 修复：每件物品只占用1个空间
    const totalSpace: number = quantity; // 修改：不再使用product.size，每个物品固定占用1个空间
    if (playerStore.inventoryUsed + totalSpace > playerStore.capacity) {
      console.error(`InventoryActions - 背包容量不足: 当前已用=${playerStore.inventoryUsed}, 需要=${totalSpace}, 总容量=${playerStore.capacity}`);
      return { success: false, message: '背包容量不足' };
    }

    // 查找已有的同类商品（不再按价格区分）
    const productId: string | number = product.id;
    console.log('InventoryActions - 查找商品ID:', productId, '类型:', typeof productId);

    // 尝试多种匹配方式
    const existingIndex: number = playerStore.inventory.findIndex((item: any) => {
      // 直接比较
      if (item.productId === productId) return true;

      // 数字比较
      if (typeof productId === 'number' && Number(item.productId) === productId) return true;

      // 字符串比较
      if (String(item.productId) === String(productId)) return true;

      return false;
    });

    console.log(`InventoryActions - 查找结果: ${existingIndex !== -1 ? '找到' : '未找到'}, 索引=${existingIndex}`);

    // 计算本次购买的总价值
    const purchaseValue: number = price * quantity;

    if (existingIndex !== -1) {
      // 更新已有条目，计算总价值和平均价格
      const existingItem: any = playerStore.inventory[existingIndex];

      console.log('InventoryActions - 更新已有物品:', {
        existingItem: {
          productId: existingItem.productId,
          name: existingItem.name,
          quantity: existingItem.quantity,
          purchasePrice: existingItem.purchasePrice
        }
      });

      // 如果存在totalValue字段，使用它；否则计算总价值
      const oldTotalValue = existingItem.totalValue || (existingItem.purchasePrice * existingItem.quantity);
      const newTotalQuantity = existingItem.quantity + quantity;
      const newTotalValue = oldTotalValue + (price * quantity);

      // 计算新的平均价格（四舍五入到整数）
      const newAveragePrice = Math.round(newTotalValue / newTotalQuantity);

      console.log('InventoryActions - 计算新价格:', {
        oldTotalValue,
        newTotalQuantity,
        newTotalValue,
        newAveragePrice
      });

      // 更新物品数量、总价值和平均价格
      playerStore.inventory[existingIndex].quantity = newTotalQuantity;
      playerStore.inventory[existingIndex].purchasePrice = newAveragePrice;
      playerStore.inventory[existingIndex].totalValue = newTotalValue; // 使用totalValue字段记录总价值

      console.log('InventoryActions - 已更新物品:', playerStore.inventory[existingIndex]);
    } else {
      // 添加新条目
      // 确保productId的一致性 - 优先使用数字类型
      let finalProductId = productId;
      if (typeof productId === 'string' && !isNaN(Number(productId))) {
        finalProductId = Number(productId);
      }

      const newItem = {
        productId: finalProductId,
        name: product.name || `商品${finalProductId}`,
        quantity: quantity,
        purchasePrice: price,
        totalValue: purchaseValue, // 添加总价值字段
        size: 1 // 修改：固定设置size为1
      };

      console.log('InventoryActions - 添加新物品:', newItem);
      playerStore.inventory.push(newItem);

      console.log('InventoryActions - 添加后背包物品数量:', playerStore.inventory.length);
      console.log('InventoryActions - 添加后背包物品列表:', playerStore.inventory.map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity
      })));
    }

    // 更新已用容量
    const oldInventoryUsed = playerStore.inventoryUsed;
    playerStore.updateInventoryUsed(totalSpace);

    console.log(`InventoryActions - 更新背包容量: ${oldInventoryUsed} -> ${playerStore.inventoryUsed}`);
    console.log('InventoryActions - 当前背包物品:', playerStore.inventory.map(item => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity
    })));

    // 检查背包是否实际更新
    console.log('InventoryActions - 背包最终状态检查:', {
      inventoryArray: playerStore.inventory,
      isArray: Array.isArray(playerStore.inventory),
      length: playerStore.inventory.length,
      isReactive: typeof playerStore.inventory === 'object' && playerStore.inventory.__v_isReactive
    });

    // 强制触发更新
    playerStore.forceUpdateInventory();

    return { success: true };
  };

  /**
   * 从库存移除物品
   * @param inventoryIndex 库存中的物品索引
   * @param quantity 移除数量
   * @returns 操作结果
   */
  const removeFromInventory = (inventoryIndex: number, quantity: number): OperationResult => {
    // 检查索引有效性
    if (inventoryIndex < 0 || inventoryIndex >= playerStore.inventory.length) {
      return { success: false, message: '无效的物品索引' };
    }

    const item: any = playerStore.inventory[inventoryIndex];
    // 检查数量有效性
    if (quantity <= 0 || quantity > item.quantity) {
      return { success: false, message: '无效的移除数量' };
    }

    // 移除物品 - 修复：每件物品只占用1个空间
    const spaceFreed: number = quantity; // 修改：不再使用item.size，每个物品固定占用1个空间
    const product: InventoryItem = { ...item, quantity };

    // 更新数量
    item.quantity -= quantity;

    // 如果数量为0，删除该条目
    if (item.quantity <= 0) {
      playerStore.inventory.splice(inventoryIndex, 1);
    }

    // 更新容量
    playerStore.updateInventoryUsed(-spaceFreed);

    return {
      success: true,
      product
    };
  };

  /**
   * 根据产品ID查找库存中的物品
   * @param productId 产品ID
   * @returns 满足条件的物品列表
   */
  const findByProductId = (productId: string | number): any[] => {
    return playerStore.inventory.filter((item: any) => item.productId === productId);
  };

  /**
   * 获取库存中某商品的总数量
   * @param productId 产品ID
   * @returns 总数量
   */
  const getTotalQuantity = (productId: string | number): number => {
    return playerStore.inventory
      .filter((item: any) => item.productId === productId)
      .reduce((total: number, item: any) => total + item.quantity, 0);
  };

  /**
   * 获取库存总价值
   * @returns 库存总价值
   */
  const getTotalValue = (): number => {
    return playerStore.inventory.reduce(
      (total: number, item: any) => total + (item.quantity * item.purchasePrice),
      0
    );
  };

  /**
   * 清空库存
   */
  const clearInventory = (): void => {
    playerStore.clearInventory();
  };

  // ==================== 返回服务接口 ====================

  return {
    addToInventory,
    removeFromInventory,
    findByProductId,
    getTotalQuantity,
    getTotalValue,
    clearInventory
  };
};

// ==================== 服务类型导出 ====================

/**
 * 库存操作服务返回类型
 */
export type InventoryActionsService = ReturnType<typeof useInventoryActions>;
