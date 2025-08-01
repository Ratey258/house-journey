// 通用国际化文本类型定义
interface CommonTexts {
  common: {
    confirm: string;
    cancel: string;
    back: string;
    save: string;
    delete: string;
    loading: string;
    yes: string;
    no: string;
    ok: string;
    next: string;
    previous: string;
    close: string;
    edit: string;
    create: string;
    update: string;
    remove: string;
    search: string;
    filter: string;
    sort: string;
    refresh: string;
    retry: string;
    more: string;
  };
  time: {
    week: string;
    weeks: string;
    of: string;
    remaining: string;
    day: string;
    hour: string;
    minute: string;
    second: string;
  };
  system: {
    defaultPlayerName: string;
    autoSave: string;
    unknownError: string;
    criticalError: string;
    componentError: string;
    retry: string;
    errorLogs: string;
    exportLogs: string;
    clearLogs: string;
    severity: string;
    type: string;
    search: string;
  };
  currency: string;
  [key: string]: any;
}

const commonTexts: CommonTexts = {
  common: {
    confirm: '确认',
    cancel: '取消',
    back: '返回',
    save: '保存',
    delete: '删除',
    loading: '加载中...',
    yes: '是',
    no: '否',
    ok: '确定',
    next: '下一步',
    previous: '上一步',
    close: '关闭',
    edit: '编辑',
    create: '创建',
    update: '更新',
    remove: '移除',
    search: '搜索',
    filter: '筛选',
    sort: '排序',
    refresh: '刷新',
    retry: '重试',
    more: '更多'
  },
  
  time: {
    week: '第{week}周',
    weeks: '{count}周',
    of: '/',
    remaining: '剩余: {weeks}周',
    day: '天',
    hour: '小时',
    minute: '分钟',
    second: '秒'
  },
  
  system: {
    defaultPlayerName: '玩家',
    autoSave: '自动存档',
    unknownError: '发生未知错误',
    criticalError: '发生严重错误',
    componentError: '组件错误',
    retry: '重试',
    errorLogs: '错误日志',
    exportLogs: '导出日志',
    clearLogs: '清空日志',
    severity: '严重程度',
    type: '类型',
    search: '搜索'
  },
  
  currency: '元',
  
  // 设置相关翻译
  settings: {
    title: '游戏设置',
    game: '游戏设置',
    display: '显示设置',
    audio: '音频设置',
    language: '语言',
    difficulty: '游戏难度',
    difficulties: {
      easy: '简单',
      standard: '标准',
      hard: '困难'
    },
    autoSaveInterval: '自动保存间隔',
    autoSaveIntervals: {
      1: '每周',
      2: '每2周',
      5: '每5周',
      10: '每10周'
    },
    soundEnabled: '游戏音效',
    fullScreen: '全屏模式',
    textSpeed: '文本速度',
    textSpeeds: {
      slow: '慢速',
      normal: '正常',
      fast: '快速'
    },
    reset: '恢复默认设置',
    saveSuccess: '设置已保存',
    resetSuccess: '设置已重置',
    description: {
      difficulty: '调整游戏的整体难度，影响价格波动、事件触发概率等',
      autoSave: '设置游戏自动保存的频率',
      sound: '启用或禁用游戏音效',
      fullScreen: '以全屏模式运行游戏',
      textSpeed: '调整对话和提示文本的显示速度',
      language: '选择游戏界面语言'
    }
  },
  
  game: {
    title: '买房记',
    week: '周数',
    menu: '菜单',
    nextWeek: '进入下一周',
    tabs: {
      market: '市场',
      inventory: '背包',
      houses: '房屋'
    },
    marketStatus: {
      bull: '上涨(牛市)',
      bear: '下跌(熊市)',
      stable: '稳定',
      mixed: '混合'
    }
  },
  
  gameMenu: {
    title: '游戏菜单',
    save: '保存游戏',
    load: '读取游戏',
    mainMenu: '返回主菜单',
    settings: '设置',
    continue: '继续游戏'
  },
  
  saveDialog: {
    title: '保存游戏',
    namePlaceholder: '输入存档名称'
  },
  
  gameOver: {
    title: '游戏结束',
    victory: '恭喜！你成功购买了豪宅！',
    houseVictory: '恭喜！你已购买房产，完成游戏主要目标！',
    timeLimit: '时间已到！',
    weeksPlayed: '游戏周数',
    finalMoney: '最终资金',
    netWorth: '净资产',
    purchasedHouses: '已购房屋',
    backToMenu: '返回主菜单',
    continueGame: '继续游戏',
    continueDescription: '你可以选择继续游戏，直到第52周结束，或查看当前成绩',
    restartGame: '重新开始'
  },
  
  recovery: {
    title: '游戏恢复',
    defaultMessage: '检测到游戏意外中断。我们找到了您的游戏进度，是否恢复？',
    date: '日期',
    gameWeek: '游戏周',
    weekNumber: '第 {week} 周',
    playerName: '玩家名称',
    money: '资金',
    recover: '恢复游戏',
    cancel: '放弃恢复',
    success: '游戏状态已成功恢复',
    failed: '无法恢复游戏状态',
    noSnapshot: '没有可用的恢复点',
    automaticRecovery: '游戏将尝试自动恢复您的进度',
    currency: '元'
  },
  
  inventory: {
    title: '背包',
    capacityUsed: '容量: {used}/{total}',
    productName: '商品名称',
    quantity: '数量',
    purchasePrice: '购买价',
    currentPrice: '当前价',
    trend: '趋势',
    profit: '盈亏',
    action: '操作',
    sell: '出售',
    empty: '背包空空如也',
    full: '背包已满',
    almostFull: '背包即将装满'
  }
};

export default commonTexts; 