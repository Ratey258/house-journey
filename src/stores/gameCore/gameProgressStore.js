import { defineStore } from 'pinia';
import { useGameCoreStore } from './index';

/**
 * 游戏进度状态管理
 * 从gameCore拆分出来，专门负责游戏周数和进度相关状态
 */
export const useGameProgressStore = defineStore('gameProgress', {
  state: () => ({
    currentWeek: 1,
    maxWeeks: 52,
    gameStarted: false,
    gamePaused: false,
    notifications: [],
    gameGoals: {
      requiredNetWorth: 400000,
      targetWeeks: 30,
      debtRatio: 0.4
    }
  }),
  
  actions: {
    /**
     * 初始化游戏进度
     */
    initializeProgress() {
      this.currentWeek = 1;
      this.gameStarted = true;
      this.gamePaused = false;
    },
    
    /**
     * 进入下一周
     * @returns {boolean} 是否成功进入下一周
     */
    advanceWeek() {
      const gameCore = useGameCoreStore();
      
      if (this.currentWeek < this.maxWeeks && !gameCore.gameOver) {
        this.currentWeek++;
        console.log(`GameProgress - 进入第 ${this.currentWeek} 周`);
        return true;
      }
      return false;
    },
    
    /**
     * 添加通知消息
     * @param {string} type - 通知类型
     * @param {string} message - 通知内容
     */
    addNotification(type, message) {
      this.notifications.push({
        id: Date.now(),
        type,
        message,
        timestamp: new Date().toISOString()
      });
      
      // 限制通知数量
      if (this.notifications.length > 10) {
        this.notifications.shift();
      }
    },
    
    /**
     * 暂停游戏
     */
    pauseGame() {
      if (this.gameStarted && !useGameCoreStore().gameOver) {
        this.gamePaused = true;
      }
    },
    
    /**
     * 继续游戏
     */
    resumeGame() {
      this.gamePaused = false;
    },
    
    /**
     * 重置游戏进度
     */
    resetProgress() {
      this.currentWeek = 1;
      this.gameStarted = false;
      this.gamePaused = false;
      this.notifications = [];
    }
  },
  
  getters: {
    /**
     * 获取游戏进度百分比
     * @returns {number} 进度百分比(0-100)
     */
    gameProgress() {
      return (this.currentWeek / this.maxWeeks) * 100;
    },
    
    /**
     * 判断游戏是否处于活跃状态
     * @returns {boolean} 游戏是否活跃
     */
    isGameActive() {
      return this.gameStarted && !useGameCoreStore().gameOver && !this.gamePaused;
    },
    
    /**
     * 获取剩余周数
     * @returns {number} 剩余周数
     */
    remainingWeeks() {
      return this.maxWeeks - this.currentWeek;
    }
  }
}); 