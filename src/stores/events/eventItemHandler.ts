import { usePlayerStore } from '../player';
import { useInventoryActions } from '../player/inventoryActions';

// 临时类型声明（待product.js转换为TypeScript后更新）
interface Product {
  id: string | number;
  name: string;
  basePrice: number;
  size: number;
  category: string;
  [key: string]: any;
}

// 临时require导入
const { getAllProducts: getProducts, getProductById: getProduct } = require('../../core/models/product');
const getAllProducts = getProducts as () => Product[];
const getProductById = getProduct as (id: string | number) => Product | null;

// ==================== 类型定义 ====================

/**
 * 物品操作结果接口
 */
export interface ItemOperationResult {
  success: boolean;
  reason?: string;
  message?: string;
  [key: string]: any;
}

/**
 * 背包物品接口
 */
export interface InventoryItem {
  productId: string | number;
  name: string;
  quantity: number;
  purchasePrice: number;
  totalValue: number;
  size: number;
  [key: string]: any;
}

// 添加调试标记
const DEBUG_EVENT_ITEMS = true;

// ==================== 事件物品处理器 ====================

/**
 * 事件物品处理器 - TypeScript版本
 * 用于处理事件中的物品添加和移除操作
 */
export const useEventItemHandler = () => {
  const playerStore = usePlayerStore();
  const { addToInventory, removeFromInventory, findByProductId } = useInventoryActions();

  /**
   * 添加物品到玩家背包
   * @param productId 产品ID
   * @param quantity 数量
   * @param price 价格
   * @returns 操作结果
   */
  const addItem = (
    productId: string | number,
    quantity: number,
    price: number
  ): ItemOperationResult => {
    // 调试信息：输出初始参数
    console.log(`EventItemHandler - 开始添加物品 - 参数: productId=${productId}, quantity=${quantity}, price=${price}`);

    // 调试信息：输出当前playerStore状态
    console.log('EventItemHandler - 当前playerStore状态:', {
      money: (playerStore as any).money,
      inventoryUsed: (playerStore as any).inventoryUsed,
      capacity: (playerStore as any).capacity,
      inventoryCount: (playerStore as any).inventory.length
    });

    // 尝试多种方式处理productId
    let normalizedProductId: string | number = productId;
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
    } : null);

    if (!product) {
      console.error('EventItemHandler - 找不到产品:', normalizedProductId);
      return { success: false, reason: 'product_not_found' };
    }

    // 检查背包空间
    const currentInventoryUsed = (playerStore as any).inventoryUsed;
    const capacity = (playerStore as any).capacity;
    const requiredSpace = quantity * (product.size || 1);

    console.log(`EventItemHandler - 空间检查: 当前使用=${currentInventoryUsed}, 容量=${capacity}, 需要空间=${requiredSpace}`);

    if (currentInventoryUsed + requiredSpace > capacity) {
      console.error('EventItemHandler - 背包空间不足');
      return { success: false, reason: 'insufficient_space' };
    }

    // 方式1: 使用inventoryActions
    console.log('EventItemHandler - 尝试使用addToInventory添加物品');
    let result = addToInventory(normalizedProductId, quantity, price);
    console.log('EventItemHandler - addToInventory结果:', result);

    // 方式2: 直接使用playerStore.addInventoryItem
    if (!result.success) {
      console.log('EventItemHandler - addToInventory失败，尝试直接添加物品');

      // 创建物品对象
      const inventoryItem: InventoryItem = {
        productId: product.id,
        name: product.name,
        quantity: quantity,
        purchasePrice: price,
        totalValue: price * quantity,
        size: 1
      };

      // 直接添加到背包
      const directResult = (playerStore as any).addInventoryItem(inventoryItem);
      console.log('EventItemHandler - 直接添加物品结果:', directResult);

      if (directResult) {
        return { success: true };
      }
    }

    // 调试信息：输出添加后的playerStore状态
    console.log('EventItemHandler - 添加后playerStore状态:', {
      money: (playerStore as any).money,
      inventoryUsed: (playerStore as any).inventoryUsed,
      capacity: (playerStore as any).capacity,
      inventoryCount: (playerStore as any).inventory.length,
      inventory: (playerStore as any).inventory.map((item: any) => ({
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
   * @param productId 产品ID
   * @param quantity 数量
   * @returns 操作结果
   */
  const removeItem = (productId: string | number, quantity: number): ItemOperationResult => {
    console.log(`EventItemHandler - 开始移除物品: productId=${productId}, quantity=${quantity}`);

    // 标准化productId
    let normalizedProductId: string | number = productId;
    if (typeof productId === 'string' && !isNaN(Number(productId))) {
      normalizedProductId = Number(productId);
    }

    // 查找物品
    const itemIndex = findByProductId(String(normalizedProductId));
    if (typeof itemIndex !== 'number' || itemIndex === -1) {
      console.error('EventItemHandler - 找不到指定物品');
      return { success: false, reason: 'item_not_found' };
    }

    const item = (playerStore as any).inventory[itemIndex];
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
   * @param category 物品类别
   * @param quantity 数量
   * @returns 操作结果
   */
  const removeItemByCategory = (category: string, quantity: number): ItemOperationResult => {
    console.log(`EventItemHandler - 按类别移除物品: category=${category}, quantity=${quantity}`);

    // 获取所有产品
    const allProducts = getAllProducts();

    // 查找背包中指定类别的物品
    const categoryItems = (playerStore as any).inventory.filter((item: any) => {
      const product = allProducts.find(p => String(p.id) === String(item.productId));
      return product && product.category === category;
    });

    if (categoryItems.length === 0) {
      console.error('EventItemHandler - 找不到指定类别的物品');
      return { success: false, reason: 'category_items_not_found' };
    }

    // 使用第一个符合条件的物品
    const item = categoryItems[0];
    const itemIndex = (playerStore as any).inventory.indexOf(item);

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

  /**
   * 检查背包中是否有足够的指定物品
   * @param productId 产品ID
   * @param quantity 需要的数量
   * @returns 是否有足够数量
   */
      const hasEnoughItems = (productId: string | number, quantity: number): boolean => {
    const itemIndex = findByProductId(String(productId));
    if (typeof itemIndex !== 'number' || itemIndex === -1) return false;

    const item = (playerStore as any).inventory[itemIndex];
    return item.quantity >= quantity;
  };

  /**
   * 检查背包中是否有指定类别的物品
   * @param category 物品类别
   * @param quantity 需要的数量
   * @returns 是否有足够数量
   */
  const hasEnoughItemsByCategory = (category: string, quantity: number): boolean => {
    const allProducts = getAllProducts();

    const categoryItems = (playerStore as any).inventory.filter((item: any) => {
      const product = allProducts.find(p => String(p.id) === String(item.productId));
      return product && product.category === category;
    });

    const totalQuantity = categoryItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
    return totalQuantity >= quantity;
  };

  /**
   * 获取背包中指定类别的物品总数
   * @param category 物品类别
   * @returns 总数量
   */
  const getCategoryItemCount = (category: string): number => {
    const allProducts = getAllProducts();

    const categoryItems = (playerStore as any).inventory.filter((item: any) => {
      const product = allProducts.find(p => String(p.id) === String(item.productId));
      return product && product.category === category;
    });

    return categoryItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
  };

  return {
    addItem,
    removeItem,
    removeItemByCategory,
    hasEnoughItems,
    hasEnoughItemsByCategory,
    getCategoryItemCount
  };
};
