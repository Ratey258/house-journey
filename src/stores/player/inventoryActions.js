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
    // 检查参数有效性
    if (!product || quantity <= 0 || price < 0) {
      return { success: false, message: '无效的产品数据' };
    }
    
    // 检查容量 - 修复：每件物品只占用1个空间
    const totalSpace = quantity; // 修改：不再使用product.size，每个物品固定占用1个空间
    if (playerStore.inventoryUsed + totalSpace > playerStore.capacity) {
      return { success: false, message: '背包容量不足' };
    }
    
    // 查找已有的同类商品（不再按价格区分）
    const existingIndex = playerStore.inventory.findIndex(
      item => item.productId === product.id
    );
    
    // 计算本次购买的总价值
    const purchaseValue = price * quantity;
    
    if (existingIndex !== -1) {
      // 更新已有条目，计算总价值和平均价格
      const existingItem = playerStore.inventory[existingIndex];
      
      // 如果存在totalValue字段，使用它；否则计算总价值
      const oldTotalValue = existingItem.totalValue || (existingItem.purchasePrice * existingItem.quantity);
      const newTotalQuantity = existingItem.quantity + quantity;
      const newTotalValue = oldTotalValue + (price * quantity);
      
      // 计算新的平均价格（四舍五入到整数）
      const newAveragePrice = Math.round(newTotalValue / newTotalQuantity);
      
      // 更新物品数量、总价值和平均价格
      playerStore.inventory[existingIndex].quantity = newTotalQuantity;
      playerStore.inventory[existingIndex].purchasePrice = newAveragePrice;
      playerStore.inventory[existingIndex].totalValue = newTotalValue; // 使用totalValue字段记录总价值
    } else {
      // 添加新条目
      playerStore.inventory.push({
        productId: product.id,
        name: product.name,
        quantity: quantity,
        purchasePrice: price,
        totalValue: purchaseValue, // 添加总价值字段
        size: 1 // 修改：固定设置size为1
      });
    }
    
    // 更新已用容量
    playerStore.inventoryUsed += totalSpace;
    
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
    
    // 移除物品 - 修复：每件物品只占用1个空间
    const spaceFreed = quantity; // 修改：不再使用item.size，每个物品固定占用1个空间
    const product = { ...item, quantity };
    
    // 更新数量
    item.quantity -= quantity;
    
    // 如果数量为0，删除该条目
    if (item.quantity <= 0) {
      playerStore.inventory.splice(inventoryIndex, 1);
    }
    
    // 更新容量
    playerStore.inventoryUsed -= spaceFreed;
    
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
   * 清空库存
   */
  const clearInventory = () => {
    playerStore.inventory = [];
    playerStore.inventoryUsed = 0;
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