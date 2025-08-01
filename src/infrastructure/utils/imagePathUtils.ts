/**
 * 图片路径工具
 * 管理游戏中各种图片资源的路径
 */

// ==================== 类型定义 ====================

/**
 * 房屋ID类型
 */
export type HouseId = 'apartment' | 'second_hand' | 'highend' | 'villa' | 'mansion' | string;

/**
 * 资源类型
 */
export type ResourceType = 'house' | 'player' | string;

// ==================== 导出函数 ====================

/**
 * 获取房屋图片路径
 * @param houseId 房屋ID
 * @returns 图片路径
 */
export function getHouseImagePath(houseId: HouseId): string {
  // 安全检查：如果houseId不是有效值，返回默认图片
  if (!houseId || houseId === 'undefined' || houseId === 'null') {
    return './resources/assets/images/house_1.jpeg';
  }

  // 房屋ID与图片的映射关系
  const imageMap: Record<string, string> = {
    'apartment': './resources/assets/images/house_1.jpeg',
    'second_hand': './resources/assets/images/house_2.jpeg',
    'highend': './resources/assets/images/house_3.jpeg',
    'villa': './resources/assets/images/house_4.jpeg',
    'mansion': './resources/assets/images/house_5.jpeg'
  };

  // 如果是数字ID，使用模运算获取1-5之间的图片
  if (!isNaN(parseInt(houseId))) {
    // 确保使用有效的数值，避免NaN
    const parsedId = parseInt(houseId);
    const imageIndex = parsedId ? Math.max(1, Math.min(5, (parsedId % 5) || 1)) : 1;
    return `./resources/assets/images/house_${imageIndex}.jpeg`;
  }

  // 返回对应的图片路径，如果没有找到则返回默认图片
  return imageMap[houseId] || './resources/assets/images/house_1.jpeg';
}

/**
 * 获取其他类型资源的图片路径
 * @param type 资源类型
 * @param id 资源ID
 * @returns 图片路径
 */
export function getResourceImagePath(type: ResourceType, id: string): string {
  // 未来可以扩展其他类型资源的图片路径处理
  const basePath = './resources/assets/images/';
  // 确保id有效，避免生成带有NaN的路径
  const safeId = id && id !== 'undefined' && id !== 'null' ? id : 'default';

  // 根据资源类型返回不同路径
  switch (type) {
    case 'house':
      return getHouseImagePath(id);
    case 'player':
      return `${basePath}player_${safeId}.png`;
    default:
      return `${basePath}placeholder.png`;
  }
}
