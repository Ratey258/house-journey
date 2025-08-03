/**
 * 玩家页面组合函数
 */

import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import type { PlayerPageState, PlayerPageMeta } from './types';

export function usePlayerPage() {
  const router = useRouter();

  // 页面状态
  const state = ref<PlayerPageState>({
    activeSection: 'overview',
    isLoading: false,
    error: null
  });

  // 页面元信息
  const meta = computed<PlayerPageMeta>(() => ({
    title: '《买房记》- 玩家信息',
    description: '查看玩家详细信息、库存管理、房产管理和游戏统计'
  }));

  // 切换活动区域
  const setActiveSection = (section: PlayerPageState['activeSection']) => {
    state.value.activeSection = section;
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
    setActiveSection,
    backToGame
  };
}