/**
 * 房屋领域模型
 * 管理游戏中的房屋及其属性
 */

import { getHouseImagePath } from '@/infrastructure/utils/imagePathUtils';

/**
 * 房屋类
 * 封装房屋的属性和行为
 */
export class House {
  /**
   * 创建房屋实例
   * @param {Object} options 房屋初始化选项
   * @param {string} options.id 房屋ID
   * @param {string} options.name 房屋名称
   * @param {number} options.price 房屋价格
   * @param {string} options.description 房屋描述
   * @param {string} options.specialFeature 特殊特性
   * @param {string} options.purchaseCondition 购买条件
   * @param {string} options.image 房屋图片
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
  }) {
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
   * @param {number} money 玩家拥有的资金
   * @returns {boolean} 是否能够购买
   */
  canBePurchasedWith(money) {
    return money >= this.price;
  }

  /**
   * 获取房屋的值/价比
   * @returns {number} 值/价比（1-10）
   */
  getValueRating() {
    // 简单算法，根据价格区间计算值/价比
    if (this.price < 400000) return 7; // 低价房性价比高
    if (this.price < 800000) return 6;
    if (this.price < 1500000) return 5;
    if (this.price < 2500000) return 4;
    return 3; // 高价房性价比较低但有其他优势
  }
}

/**
 * 创建房屋工厂函数 - 类型1（OOP风格）
 * @param {Object} options 房屋初始化选项
 * @returns {House} 新的房屋实例
 */
export function createHouse(options) {
  return new House(options);
}

/**
 * 创建房屋工厂函数 - 类型2（函数式风格，兼容旧版）
 * @param {string} id 房屋ID
 * @param {string} name 房屋名称
 * @param {number} price 房屋价格
 * @param {string} description 房屋描述
 * @param {string} specialFeature 特殊特性
 * @returns {House} 房屋实例
 */
export function createHouseLegacy(id, name, price, description, specialFeature) {
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

/**
 * 获取房屋图片路径
 * @param {string} houseId 房屋ID
 * @returns {string} 图片路径
 */
function getHouseImage(houseId) {
  try {
    // 使用导入的图片路径工具
    return getHouseImagePath(houseId);
  } catch (err) {
    // 如果出现异常，使用内置映射
    const imageMap = {
      'apartment': './resources/assets/images/house_1.jpeg',
      'second_hand': './resources/assets/images/house_2.jpeg',
      'highend': './resources/assets/images/house_3.jpeg',
      'villa': './resources/assets/images/house_4.jpeg',
      'mansion': './resources/assets/images/house_5.jpeg'
    };

    return imageMap[houseId] || './resources/assets/images/house_1.jpeg';
  }
}

// 预定义房屋列表
const predefinedHouses = [
  {
    id: 'apartment',
    name: '单身公寓',
    price: 350000,
    level: 1,
    description: '适合单身人士居住的小型公寓，位置便利但空间有限。这是迈向房产阶梯的第一步！',
    specialFeature: '交通便利，月供较低，首次置业的理想选择',
    image: './resources/assets/images/house_1.jpeg'
  },
  {
    id: 'second_hand',
    name: '二手旧房',
    price: 580000,
    level: 2,
    description: '年代较久的二手住宅，价格适中但可能需要装修。空间较大，非常适合改造成理想的家。',
    specialFeature: '空间较大，周边配套完善，性价比较高',
    image: './resources/assets/images/house_2.jpeg'
  },
  {
    id: 'highend',
    name: '高档小区',
    price: 800000,
    level: 3,
    description: '现代化高档住宅小区，环境优美，配套设施齐全。社区环境安全，是家庭居住的绝佳选择。',
    specialFeature: '环境优美，物业管理完善，社区活动丰富',
    image: './resources/assets/images/house_3.jpeg'
  },
  {
    id: 'villa',
    name: '现代别墅',
    price: 1500000,
    level: 4,
    description: '独栋现代别墅，拥有私家花园和车库。宽敞的空间和精致的设计，彰显主人的品味与地位。',
    specialFeature: '独立空间，居住品质高，是成功人士的标志',
    image: './resources/assets/images/house_4.jpeg'
  },
  {
    id: 'mansion',
    name: '私人庄园',
    price: 3000000,
    level: 5,
    description: '大型私人庄园，带有大片绿地和多功能区域。拥有这样的房产，代表你已达到人生巅峰！',
    specialFeature: '终极豪宅，私密性极佳，社会地位的象征',
    image: './resources/assets/images/house_5.jpeg'
  }
];

/**
 * 获取所有房屋列表
 * @returns {Array<House>} 房屋列表
 */
export function getAllHouses() {
  return predefinedHouses.map(houseData => createHouse(houseData));
}

/**
 * 根据ID获取房屋
 * @param {string} id 房屋ID
 * @returns {House|null} 房屋实例或null
 */
export function getHouseById(id) {
  const houseData = predefinedHouses.find(h => h.id === id);
  return houseData ? createHouse(houseData) : null;
}
