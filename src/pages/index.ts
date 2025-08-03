/**
 * Pages层统一导出
 * 提供所有页面组件的统一访问入口
 */

// === 游戏页面 ===
export * from './game';

// === 市场页面 ===
export * from './market';

// === 玩家页面 ===
export * from './player';

// === 设置页面 ===
export * from './settings';

// 页面路由配置
export const pageRoutes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('./game/ui/GamePage.vue'),
    meta: {
      title: '《买房记》- 游戏主界面',
      description: '经典房地产交易游戏，体验买房投资的乐趣',
      requiresAuth: false
    }
  },
  {
    path: '/game',
    name: 'Game',
    component: () => import('./game/ui/GamePage.vue'),
    meta: {
      title: '《买房记》- 游戏主界面',
      description: '游戏主界面，包含市场交易、背包管理、房产管理等功能',
      requiresAuth: false
    }
  },
  {
    path: '/market',
    name: 'Market',
    component: () => import('./market/ui/MarketPage.vue'),
    meta: {
      title: '《买房记》- 市场交易',
      description: '在各个市场中进行商品交易，赚取利润',
      requiresAuth: false
    }
  },
  {
    path: '/player',
    name: 'Player',
    component: () => import('./player/ui/PlayerPage.vue'),
    meta: {
      title: '《买房记》- 玩家信息',
      description: '查看玩家详细信息、库存管理、房产管理和游戏统计',
      requiresAuth: false
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('./settings/ui/SettingsPage.vue'),
    meta: {
      title: '《买房记》- 游戏设置',
      description: '自定义游戏体验和偏好设置',
      requiresAuth: false
    }
  }
];