/**
 * 市场页面组合函数
 */

import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import type { MarketPageState, MarketPageMeta } from './types';

export function useMarketPage() {
  const router = useRouter();

  // 页面状态
  const state = ref<MarketPageState>({
    currentLocation: 'commodity_market',
    selectedProduct: null,
    isTrading: false,
    error: null
  });

  // 页面元信息
  const meta = computed<MarketPageMeta>(() => ({
    title: '《买房记》- 市场交易',
    description: '在各个市场中进行商品交易，赚取利润',
    currentLocationName: getLocationName(state.value.currentLocation)
  }));

  // 获取地点名称
  const getLocationName = (locationId: string): string => {
    const locationNames: Record<string, string> = {
      'commodity_market': '商品市场',
      'second_hand_market': '二手市场',
      'electronics_hub': '电子产品中心',
      'premium_mall': '高端商城',
      'black_market': '黑市'
    };
    return locationNames[locationId] || '未知地点';
  };

  // 返回游戏主页
  const backToGame = () => {
    router.push('/game');
  };

  return {
    // 状态
    state: computed(() => state.value),
    meta,

    // 方法
    backToGame,
    getLocationName
  };
}