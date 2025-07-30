import { usePlayerStore } from '../player';
import { useInventoryActions } from '../player/inventoryActions';
import { getAllProducts, getProductById } from '@/core/models/product';
// 添加调试标记
const DEBUG_EVENT_ITEMS = true;

/**
 * 事件物品处理器
 * 用于处理事件中的物品添加和移除操作
 */
export const useEventItemHandler = () => {
  const playerStore = usePlayerStore();
  const { addToInventory, removeFromInventory, findByProductId } = useInventoryActions();

  /**
   * 添加物品到玩家背包
   * @param {number} productId - 产品ID
   * @param {number} quantity - 数量
   * @param {number} price - 价格
   * @returns {Object} 操作结果
   */
  const addItem = (productId, quantity, price) => {
    // 调试信息：输出初始参数
    console.log(`EventItemHandler - 开始添加物品 - 参数: productId=${productId}, quantity=${quantity}, price=${price}`);

    // 调试信息：输出当前playerStore状态
    console.log('EventItemHandler - 当前playerStore状态:', {
      money: playerStore.money,
      inventoryUsed: playerStore.inventoryUsed,
      capacity: playerStore.capacity,
      inventoryCount: playerStore.inventory.length
    });

    // 尝试多种方式处理productId
    let normalizedProductId = productId;
    if (typeof productId === 'string' && !isNaN(Number(productId))) {
      normalizedProductId = Number(productId);
    }

    console.log(`EventItemHandler - 处理后的productId: ${normalizedProductId} (类型: ${typeof normalizedProductId})`);

    // 获取产品信息 - 使用getProductById函数直接获取产品对象
    const product = getProductById(normalizedProductId);

    console.log('EventItemHandler - 获取到的产品对象:', product ? {
      id: product.id,
      name: product.name,
      basePrice: product.basePrice,
      size: product.size,
      category: product.category
    } : 'null');

    if (!product) {
      // 如果找不到产品，尝试从所有产品中查找
      const allProducts = getAllProducts();
      console.log(`EventItemHandler - 尝试从${allProducts.length}个产品中查找ID为${normalizedProductId}的产品`);

      // 尝试多种匹配方式
      const foundProduct = allProducts.find(p =>
        p.id === normalizedProductId ||
        p.id === Number(normalizedProductId) ||
        String(p.id) === String(normalizedProductId)
      );

      if (foundProduct) {
        console.log('EventItemHandler - 通过替代方法找到产品:', {
          id: foundProduct.id,
          name: foundProduct.name
        });
        return addItem(foundProduct.id, quantity, price);
      }

      console.error('EventItemHandler - 找不到产品:', productId);
      return { success: false, reason: 'product_not_found' };
    }

    // 检查背包容量
    if (playerStore.inventoryUsed + quantity > playerStore.capacity) {
      console.error(`EventItemHandler - 背包容量不足: 当前已用=${playerStore.inventoryUsed}, 需要=${quantity}, 总容量=${playerStore.capacity}`);
      return { success: false, reason: 'inventory_full' };
    }

    // 尝试两种方式添加物品

    // 方式1: 使用addToInventory
    // 创建简化的产品对象，确保与addToInventory期望的格式一致
    const simplifiedProduct = {
      id: product.id,
      name: product.name,
      category: product.category,
      size: product.size || 1,
      basePrice: product.basePrice
    };

    // 添加到背包
    console.log(`EventItemHandler - 调用addToInventory: product=${simplifiedProduct.name}, quantity=${quantity}, price=${price}`);
    const result = addToInventory(simplifiedProduct, quantity, price);
    console.log('EventItemHandler - addToInventory返回结果:', result);

    // 方式2: 直接使用playerStore.addInventoryItem
    if (!result.success) {
      console.log('EventItemHandler - addToInventory失败，尝试直接添加物品');

      // 创建物品对象
      const inventoryItem = {
        productId: product.id,
        name: product.name,
        quantity: quantity,
        purchasePrice: price,
        totalValue: price * quantity,
        size: 1
      };

      // 直接添加到背包
      const directResult = playerStore.addInventoryItem(inventoryItem);
      console.log('EventItemHandler - 直接添加物品结果:', directResult);

      if (directResult) {
        return { success: true };
      }
    }

    // 调试信息：输出添加后的playerStore状态
    console.log('EventItemHandler - 添加后playerStore状态:', {
      money: playerStore.money,
      inventoryUsed: playerStore.inventoryUsed,
      capacity: playerStore.capacity,
      inventoryCount: playerStore.inventory.length,
      inventory: playerStore.inventory.map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity
      }))
    });

    if (result.success) {
      console.log(`EventItemHandler - 成功添加物品: ${product.name} x ${quantity}`);
    } else {
      console.error(`EventItemHandler - 添加物品失败: ${result.message}`);
    }

    return result;
  };

  /**
   * 从玩家背包移除物品
   * @param {number} productId - 产品ID
   * @param {number} quantity - 数量
   * @returns {Object} 操作结果
   */
  const removeItem = (productId, quantity) => {
    // 查找物品在背包中的索引
    const itemIndex = playerStore.inventory.findIndex(item => item.productId == productId);

    if (itemIndex === -1) {
      console.error('EventItemHandler - 背包中找不到产品:', productId);
      return { success: false, reason: 'product_not_found' };
    }

    const item = playerStore.inventory[itemIndex];

    // 检查数量是否足够
    if (item.quantity < quantity) {
      console.error('EventItemHandler - 物品数量不足');
      return { success: false, reason: 'insufficient_items' };
    }

    // 移除物品
    const result = removeFromInventory(itemIndex, quantity);

    if (result.success) {
      console.log(`EventItemHandler - 成功移除物品: ${item.name} x ${quantity}`);
    } else {
      console.error(`EventItemHandler - 移除物品失败: ${result.message}`);
    }

    return result;
  };

  /**
   * 按类别移除物品
   * @param {string} category - 产品类别
   * @param {number} quantity - 数量
   * @returns {Object} 操作结果
   */
  const removeItemByCategory = (category, quantity) => {
    // 获取所有产品信息
    const allProducts = getAllProducts();

    // 查找该类别的物品
    const categoryItems = playerStore.inventory.filter(item => {
      const product = allProducts.find(p => p.id == item.productId);
      return product && product.category === category;
    });

    if (categoryItems.length === 0) {
      console.error('EventItemHandler - 背包中找不到该类别的产品:', category);
      return { success: false, reason: 'category_not_found' };
    }

    // 使用第一个符合条件的物品
    const item = categoryItems[0];
    const itemIndex = playerStore.inventory.indexOf(item);

    // 检查数量是否足够
    if (item.quantity < quantity) {
      console.error('EventItemHandler - 物品数量不足');
      return { success: false, reason: 'insufficient_items' };
    }

    // 移除物品
    const result = removeFromInventory(itemIndex, quantity);

    if (result.success) {
      console.log(`EventItemHandler - 成功移除类别物品: ${item.name} x ${quantity}`);
    } else {
      console.error(`EventItemHandler - 移除类别物品失败: ${result.message}`);
    }

    return result;
  };

  return {
    addItem,
    removeItem,
    removeItemByCategory
  };
};
