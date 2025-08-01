/**
 * 房屋领域模型
 * 管理游戏中的房屋及其属性
 */

import { getHouseImagePath, type HouseId } from '../../infrastructure/utils/imagePathUtils';

// ==================== 类型定义 ====================

// 重新导出 HouseId 类型以保持向后兼容性
export type { HouseId } from '../../infrastructure/utils/imagePathUtils';

/**
 * 房屋初始化选项接口
 */
export interface HouseOptions {
  /** 房屋ID */
  id: HouseId;
  /** 房屋名称 */
  name: string;
  /** 房屋价格 */
  price: number;
  /** 房屋等级 */
  level?: number;
  /** 房屋描述 */
  description?: string;
  /** 特殊特性 */
  specialFeature?: string;
  /** 购买条件 */
  purchaseCondition?: string;
  /** 房屋图片路径 */
  image?: string;
}

/**
 * 房屋数据接口（用于预定义房屋列表）
 */
export interface HouseData {
  id: HouseId;
  name: string;
  price: number;
  level: number;
  description: string;
  specialFeature: string;
  image: string;
}

// ==================== 房屋类 ====================

/**
 * 房屋类
 * 封装房屋的属性和行为
 */
export class House {
  /** 房屋ID */
  public readonly id: HouseId;
  /** 房屋名称 */
  public readonly name: string;
  /** 房屋价格 */
  public readonly price: number;
  /** 房屋等级 */
  public readonly level: number;
  /** 房屋描述 */
  public readonly description: string;
  /** 特殊特性 */
  public readonly specialFeature: string;
  /** 购买条件 */
  public readonly purchaseCondition: string;
  /** 房屋图片路径 */
  public readonly image: string;

  /**
   * 创建房屋实例
   */
  constructor({
    id,
    name,
    price,
    level = 1,
    description = '',
    specialFeature = '',
    purchaseCondition = '',
    image = ''
  }: HouseOptions) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.level = level;
    this.description = description;
    this.specialFeature = specialFeature;
    this.purchaseCondition = purchaseCondition || `需要${price}元现金`;
    this.image = image || getHouseImage(id);
  }

  /**
   * 检查玩家是否能够购买此房屋
   */
  canBePurchasedWith(money: number): boolean {
    return money >= this.price;
  }

  /**
   * 获取房屋的值/价比
   * @returns 值/价比（1-10）
   */
  getValueRating(): number {
    // 简单算法，根据价格区间计算值/价比
    if (this.price < 400000) return 7; // 低价房性价比高
    if (this.price < 800000) return 6;
    if (this.price < 1500000) return 5;
    if (this.price < 2500000) return 4;
    return 3; // 高价房性价比较低但有其他优势
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建房屋工厂函数 - 类型1（OOP风格）
 */
export function createHouse(options: HouseOptions): House {
  return new House(options);
}

/**
 * 创建房屋工厂函数 - 类型2（函数式风格，兼容旧版）
 */
export function createHouseLegacy(
  id: HouseId,
  name: string,
  price: number,
  description: string,
  specialFeature: string
): House {
  return new House({
    id,
    name,
    price,
    description,
    specialFeature,
    purchaseCondition: `需要${price}元现金`,
    image: getHouseImage(id)
  });
}

// ==================== 工具函数 ====================

/**
 * 获取房屋图片路径
 */
function getHouseImage(houseId: HouseId): string {
  try {
    // 安全检查：如果houseId不是有效值，使用默认图片
    if (!houseId || houseId === 'undefined' || houseId === 'null') {
      return '/resources/assets/images/house_1.jpeg';
    }

    // 使用导入的图片路径工具
    return getHouseImagePath(houseId);
  } catch (err) {
    console.warn('获取房屋图片路径时出错:', err);

    // 如果出现异常，使用内置映射
    const imageMap: Record<string, string> = {
      'apartment': '/resources/assets/images/house_1.jpeg',
      'second_hand': '/resources/assets/images/house_2.jpeg',
      'highend': '/resources/assets/images/house_3.jpeg',
      'villa': '/resources/assets/images/house_4.jpeg',
      'mansion': '/resources/assets/images/house_5.jpeg'
    };

    // 如果是数字ID，使用模运算获取1-5之间的图片
    if (!isNaN(parseInt(houseId))) {
      // 确保解析出有效数字
      const parsedId = parseInt(houseId);
      // 防止NaN，使用有效默认值
      const imageIndex = parsedId ? Math.max(1, Math.min(5, (parsedId % 5) || 1)) : 1;
      return `/resources/assets/images/house_${imageIndex}.jpeg`;
    }

    return imageMap[houseId] || '/resources/assets/images/house_1.jpeg';
  }
}

// ==================== 预定义数据 ====================

/**
 * 预定义房屋列表
 */
const predefinedHouses: HouseData[] = [
  {
    id: 'apartment',
    name: '单身公寓',
    price: 350000,
    level: 1,
    description: '适合单身人士居住的小型公寓，位置便利但空间有限。这是迈向房产阶梯的第一步！',
    specialFeature: '交通便利，月供较低，首次置业的理想选择',
    image: '/resources/assets/images/house_1.jpeg'
  },
  {
    id: 'second_hand',
    name: '二手旧房',
    price: 580000,
    level: 2,
    description: '年代较久的二手住宅，价格适中但可能需要装修。空间较大，非常适合改造成理想的家。',
    specialFeature: '空间较大，周边配套完善，性价比较高',
    image: '/resources/assets/images/house_2.jpeg'
  },
  {
    id: 'highend',
    name: '高档小区',
    price: 800000,
    level: 3,
    description: '现代化高档住宅小区，环境优美，配套设施齐全。社区环境安全，是家庭居住的绝佳选择。',
    specialFeature: '环境优美，物业管理完善，社区活动丰富',
    image: '/resources/assets/images/house_3.jpeg'
  },
  {
    id: 'villa',
    name: '现代别墅',
    price: 1500000,
    level: 4,
    description: '独栋现代别墅，拥有私家花园和车库。宽敞的空间和精致的设计，彰显主人的品味与地位。',
    specialFeature: '独立空间，居住品质高，是成功人士的标志',
    image: '/resources/assets/images/house_4.jpeg'
  },
  {
    id: 'mansion',
    name: '私人庄园',
    price: 3000000,
    level: 5,
    description: '大型私人庄园，带有大片绿地和多功能区域。拥有这样的房产，代表你已达到人生巅峰！',
    specialFeature: '终极豪宅，私密性极佳，社会地位的象征',
    image: '/resources/assets/images/house_5.jpeg'
  }
];

// ==================== 导出函数 ====================

/**
 * 获取所有房屋列表
 */
export function getAllHouses(): House[] {
  return predefinedHouses.map(houseData => createHouse(houseData));
}

/**
 * 根据ID获取房屋
 */
export function getHouseById(id: HouseId): House | null {
  const houseData = predefinedHouses.find(h => h.id === id);
  return houseData ? createHouse(houseData) : null;
}
