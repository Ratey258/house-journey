/**
 * 图片路径工具
 * 管理游戏中各种图片资源的路径
 */

/**
 * 获取房屋图片路径
 * @param {string} houseId 房屋ID
 * @returns {string} 图片路径
 */
export function getHouseImagePath(houseId) {
  // 房屋ID与图片的映射关系
  const imageMap = {
    'apartment': './resources/assets/images/house_1.jpeg',
    'second_hand': './resources/assets/images/house_2.jpeg',
    'highend': './resources/assets/images/house_3.jpeg',
    'villa': './resources/assets/images/house_4.jpeg',
    'mansion': './resources/assets/images/house_5.jpeg'
  };

  // 返回对应的图片路径，如果没有找到则返回默认图片
  return imageMap[houseId] || './resources/assets/images/house_1.jpeg';
}

/**
 * 获取其他类型资源的图片路径
 * @param {string} type 资源类型
 * @param {string} id 资源ID
 * @returns {string} 图片路径
 */
export function getResourceImagePath(type, id) {
  // 未来可以扩展其他类型资源的图片路径处理
  const basePath = './resources/assets/images/';

  // 根据资源类型返回不同路径
  switch (type) {
  case 'house':
    return getHouseImagePath(id);
  case 'player':
    return `${basePath}player_${id || 'default'}.png`;
  default:
    return `${basePath}placeholder.png`;
  }
}
