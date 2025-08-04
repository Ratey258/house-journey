import { usePlayerStore } from './playerState';

/**
 * 库存管理相关操作
 * 提供添加和移除物品的功能
 */
export const useInventoryActions = () => {
  const playerStore = usePlayerStore();

  /**
   * 添加物品到库存
   * @param {Object} product - 产品对象
   * @param {number} quantity - 数量
   * @param {number} price - 购买价格
   * @returns {Object} 操作结果 {success, message}
   */
  const addToInventory = (product, quantity, price) => {
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
    const totalSpace = quantity; // 修改：不再使用product.size，每个物品固定占用1个空间
    if (playerStore.inventoryUsed + totalSpace > playerStore.capacity) {
      console.error(`InventoryActions - 背包容量不足: 当前已用=${playerStore.inventoryUsed}, 需要=${totalSpace}, 总容量=${playerStore.capacity}`);
      return { success: false, message: '背包容量不足' };
    }

    // 查找已有的同类商品（不再按价格区分）
    const productId = product.id;
    console.log('InventoryActions - 查找商品ID:', productId, '类型:', typeof productId);

    // 尝试多种匹配方式
    const existingIndex = playerStore.inventory.findIndex(item => {
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
    const purchaseValue = price * quantity;

    // 准备要添加/更新的物品数据
    let finalProductId = productId;
    if (typeof productId === 'string' && !isNaN(Number(productId))) {
      finalProductId = Number(productId);
    }

    const itemToAdd = {
      productId: finalProductId,
      name: product.name || `商品${finalProductId}`,
      quantity: quantity,
      purchasePrice: price,
      totalValue: purchaseValue,
      size: 1
    };

    // 使用playerStore的方法来安全地添加/更新库存
    const result = playerStore.addInventoryItem(itemToAdd);

    if (!result) {
      console.error('InventoryActions - 无法添加物品到玩家库存');
      return { success: false, message: '添加物品失败' };
    }

    console.log(`InventoryActions - 成功添加物品到背包`);
    console.log('InventoryActions - 当前背包物品:', playerStore.inventory.map(item => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity
    })));

    // 检查背包是否实际更新
    console.log('InventoryActions - 背包最终状态检查:', {
      inventoryArray: playerStore.inventory,
      isArray: Array.isArray(playerStore.inventory),
      length: playerStore.inventory.length
    });

    return { success: true };
  };

  /**
   * 从库存移除物品
   * @param {number} inventoryIndex - 库存中的物品索引
   * @param {number} quantity - 移除数量
   * @returns {Object} 操作结果 {success, message, product}
   */
  const removeFromInventory = (inventoryIndex, quantity) => {
    // 检查索引有效性
    if (inventoryIndex < 0 || inventoryIndex >= playerStore.inventory.length) {
      return { success: false, message: '无效的物品索引' };
    }

    const item = playerStore.inventory[inventoryIndex];
    // 检查数量有效性
    if (quantity <= 0 || quantity > item.quantity) {
      return { success: false, message: '无效的移除数量' };
    }

    // 创建要移除的物品数据
    const product = { ...item, quantity };

    // 使用playerStore的方法来安全地移除库存
    const result = playerStore.removeInventoryItem(item.productId, quantity);

    if (!result) {
      console.error('InventoryActions - 无法从玩家库存移除物品');
      return { success: false, message: '移除物品失败' };
    }

    return {
      success: true,
      product
    };
  };

  /**
   * 根据产品ID查找库存中的物品
   * @param {string} productId - 产品ID
   * @returns {Array} 满足条件的物品列表
   */
  const findByProductId = (productId) => {
    return playerStore.inventory.filter(item => item.productId === productId);
  };

  /**
   * 获取库存中某商品的总数量
   * @param {string} productId - 产品ID
   * @returns {number} 总数量
   */
  const getTotalQuantity = (productId) => {
    return playerStore.inventory
      .filter(item => item.productId === productId)
      .reduce((total, item) => total + item.quantity, 0);
  };

  /**
   * 获取库存总价值
   * @returns {number} 库存总价值
   */
  const getTotalValue = () => {
    return playerStore.inventory.reduce(
      (total, item) => total + (item.quantity * item.purchasePrice),
      0
    );
  };

  /**
   * 清空库存 - 已移除，使用playerStore的方法
   */
  const clearInventory = () => {
    // 注意：此功能应该通过playerStore的resetPlayer方法实现
    console.warn('clearInventory已弃用，请使用playerStore.resetPlayer()');
  };

  return {
    addToInventory,
    removeFromInventory,
    findByProductId,
    getTotalQuantity,
    getTotalValue,
    clearInventory
  };
};
