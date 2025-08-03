/**
 * 房屋实体统一导出
 */

// 导出主要实体类
export { House, createHouse, createHouseLegacy, getAllHouses, getHouseById } from './model/House';

// 导出类型定义
export type {
  HouseId,
  HouseOptions,
  HouseData
} from './model/House';