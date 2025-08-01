/**
 * models 模块索引文件
 * 
 * 该文件导出 core/models 目录下的所有模块
 */

// ==================== 事件模型 ====================
export {
  EventType,
  EventPhase,
  Event,
  EventOption,
  EventEffects,
  createEvent,
  createEventOption,
  createEventEffects,
  getAllEvents,
  getEventsByType,
  getEventById,
  type GameState,
  type PlayerState
} from './event';

// ==================== 房屋模型 ====================
export {
  House,
  createHouse,
  createHouseLegacy,
  getAllHouses,
  getHouseById,
  type HouseId,
  type HouseOptions,
  type HouseData
} from './house';

// ==================== 地点模型 ====================
export {
  Location,
  createLocation,
  createLocationLegacy,
  getAllLocations,
  getLocationById,
  type LocationId,
  type ProductId as LocationProductId,
  type LocationModifiers,
  type LocationOptions,
  type LocationData
} from './location';

// ==================== 玩家模型 ====================
export {
  Player,
  createPlayer,
  createPlayerProduct,
  type InventoryItem,
  type PurchasedHouse,
  type PlayerStatistics,
  type PlayerOptions,
  type Product as PlayerProduct,
  type House as PlayerHouse
} from './player';

// ==================== 产品模型 ====================
export {
  ProductCategory,
  Product,
  createProduct,
  createProductLegacy,
  getAvailableProducts,
  getAllProducts,
  getProductById,
  type ProductId,
  type PriceRange,
  type ProductOptions,
  type ProductData,
  type Location as ProductLocation
} from './product';

// ==================== 常用类型导出 ====================

// 重新导出常用类型，避免命名冲突
export type { HouseId } from './house';
export type { LocationId } from './location';
export type { ProductId } from './product';