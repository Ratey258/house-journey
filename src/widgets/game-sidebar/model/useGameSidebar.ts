/**
 * 游戏侧边栏组合函数
 */

import { ref, computed } from 'vue';
import { usePlayer } from '../../../entities/player';
import type { PlayerInfo, GameStats, SidebarSection } from './types';

export function useGameSidebar() {
  // 玩家数据
  const { player, isLoaded, error } = usePlayer();

  // 侧边栏状态
  const collapsedSections = ref<Set<string>>(new Set());

  // 计算属性 - 玩家信息
  const playerInfo = computed<PlayerInfo | null>(() => {
    if (!player.value) return null;

    return {
      name: player.value.name,
      money: player.value.money,
      debt: player.value.debt,
      netWorth: player.value.netWorth,
      currentWeek: player.value.statistics.weekCount,
      inventoryUsed: player.value.inventoryUsed,
      inventoryCapacity: player.value.capacity
    };
  });

  // 计算属性 - 游戏统计
  const gameStats = computed<GameStats | null>(() => {
    if (!player.value) return null;

    return {
      transactionCount: player.value.statistics.transactionCount,
      totalProfit: player.value.statistics.totalProfit,
      visitedLocations: player.value.statistics.visitedLocations,
      housesOwned: player.value.purchasedHouses.length
    };
  });

  // 侧边栏区域配置
  const sections = computed<SidebarSection[]>(() => [
    {
      id: 'player-info',
      title: '玩家信息',
      collapsed: collapsedSections.value.has('player-info')
    },
    {
      id: 'game-stats',
      title: '游戏统计',
      collapsed: collapsedSections.value.has('game-stats')
    },
    {
      id: 'quick-actions',
      title: '快捷操作',
      collapsed: collapsedSections.value.has('quick-actions')
    }
  ]);

  // 方法
  const toggleSection = (sectionId: string) => {
    if (collapsedSections.value.has(sectionId)) {
      collapsedSections.value.delete(sectionId);
    } else {
      collapsedSections.value.add(sectionId);
    }
  };

  const collapseAll = () => {
    sections.value.forEach(section => {
      collapsedSections.value.add(section.id);
    });
  };

  const expandAll = () => {
    collapsedSections.value.clear();
  };

  return {
    // 状态
    playerInfo,
    gameStats,
    sections,
    isLoaded,
    error,

    // 方法
    toggleSection,
    collapseAll,
    expandAll
  };
}