export default {
  common: {
    confirm: '确认',
    cancel: '取消',
    back: '返回',
    save: '保存',
    delete: '删除',
    loading: '加载中...'
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
  playerInfo: {
    title: '玩家信息',
    name: '姓名',
    money: '资金',
    debt: '债务',
    capacity: '背包容量',
    week: '周数',
    repayDebt: '还款'
  },
  market: {
    title: '{location}',
    selectLocation: '选择地点',
    productName: '商品名称',
    price: '价格',
    trend: '趋势',
    change: '涨跌',
    action: '操作',
    buy: '购买',
    noProducts: '当前地点没有可购买的商品',
    special: '特价商品',
    viewMode: {
      table: '表格视图',
      card: '卡片视图'
    },
    priceHistory: '价格历史',
    priceChart: {
      title: '价格走势图',
      weeks: '周数',
      price: '价格'
    }
  },
  inventory: {
    title: '背包',
    capacityUsed: '容量: {used}/{total}',
    productName: '商品名称',
    quantity: '数量',
    purchasePrice: '买入价',
    currentPrice: '当前价',
    trend: '趋势',
    profit: '盈亏',
    action: '操作',
    sell: '出售',
    empty: '背包是空的'
  },
  houseMarket: {
    title: '房产市场',
    affordable: '可购买',
    price: '价格',
    size: '面积',
    location: '位置',
    buy: '购买',
    noHouses: '没有可购买的房屋'
  },
  buyModal: {
    title: '购买 {product}',
    price: '单价',
    availableMoney: '可用资金',
    availableSpace: '可用空间',
    quantity: '购买数量',
    totalCost: '总花费',
    maxQuantity: '最大'
  },
  sellModal: {
    title: '出售 {product}',
    purchasePrice: '买入价',
    currentPrice: '当前价',
    quantity: '持有数量',
    sellQuantity: '出售数量',
    potentialProfit: '预计盈亏',
    totalIncome: '总收入',
    maxQuantity: '全部'
  },
  houseModal: {
    title: '购买 {house}',
    confirmPurchase: '确认购买此房屋吗？',
    price: '房屋价格',
    availableMoney: '可用资金',
    remainingMoney: '购买后剩余'
  },
  repayModal: {
    title: '偿还债务',
    currentDebt: '当前债务',
    availableMoney: '可用资金',
    repayAmount: '还款金额'
  },
  event: {
    debtIncrease: '债务增加',
    debtDecrease: '债务减少',
    gainProduct: '获得物品',
    loseProduct: '失去物品'
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
    timeLimit: '时间已到！',
    weeksPlayed: '游戏周数',
    finalMoney: '最终资金',
    netWorth: '净资产',
    purchasedHouses: '已购房屋',
    backToMenu: '返回主菜单'
  },
  trends: {
    rising_strong: '价格急剧上涨',
    rising: '价格上涨中',
    stable_high: '高位稳定',
    stable: '价格稳定',
    stable_low: '低位稳定',
    falling: '价格下跌中',
    falling_strong: '价格急剧下跌',
    volatile: '价格剧烈波动'
  },
  tutorial: {
    tips: {
      welcome: {
        title: '欢迎来到《买房记》',
        content: '在这个游戏中，你的目标是通过买卖商品赚取差价，最终积累足够的资金购买房产。<br><br>你有52周的时间来实现这个目标，祝你好运！'
      },
      market_intro: {
        title: '市场交易',
        content: '在市场标签页中，你可以购买各种商品。不同地点提供的商品和价格各不相同。<br><br>关注价格趋势，在价格低时购买，价格高时卖出，赚取差价。'
      },
      inventory_intro: {
        title: '库存管理',
        content: '在库存标签页中，你可以查看已购买的商品，并在合适的时机卖出。<br><br>注意背包容量有限，合理规划购买的商品数量。'
      },
      location_change: {
        title: '切换地点',
        content: '你可以在不同地点之间切换，每个地点都有不同的商品和价格。<br><br>利用不同地点之间的价格差异，可以赚取更多利润。'
      },
      price_trends: {
        title: '价格趋势',
        content: '商品价格会随时间波动，关注价格趋势是获利的关键。<br><br>上涨趋势表示价格可能继续上涨，下跌趋势表示价格可能继续下跌。'
      },
      special_products: {
        title: '特色商品',
        content: '每个地点都有特色商品，价格更优惠。特色商品在商品列表中会有特殊标记。<br><br>关注特色商品可以提高交易利润。'
      },
      houses: {
        title: '房产购买',
        content: '当你积累了足够的资金后，可以在房产标签页中购买房屋。<br><br>不同房屋有不同的价格，购买任意房屋都会结束游戏。'
      },
      events: {
        title: '随机事件',
        content: '游戏中会随机触发各种事件，这些事件可能会影响商品价格、你的资金或其他游戏状态。<br><br>做出明智的选择，可以获得额外收益或避免损失。'
      },
      mid_game: {
        title: '游戏进展',
        content: '你已经完成了游戏的四分之一！现在是时候制定更长远的计划了。<br><br>考虑积累更多资金，为购买房产做准备。'
      },
      late_game: {
        title: '游戏后期',
        content: '游戏已经过半，确保你的资金增长足够快，以便在游戏结束前购买理想的房产。<br><br>如果资金增长缓慢，可能需要调整交易策略或承担更多风险。'
      }
    },
    help: {
      title: '游戏帮助',
      basics: '游戏基础',
      trading: '交易技巧',
      events: '事件系统',
      settings: '游戏设置',
      gotIt: '知道了',
      dontShowAgain: '不再显示此提示',
      prev: '上一条',
      next: '下一条',
      shortcuts: {
        title: '键盘快捷键',
        space: '进入下一周',
        tab: '切换标签页',
        esc: '打开/关闭菜单',
        h: '打开帮助面板'
      }
    }
  },
  // 通知和错误消息
  notifications: {
    error: {
      inventoryFull: '背包空间不足',
      insufficientStock: '库存数量不足',
      houseNotFound: '找不到指定的房屋',
      alreadyOwned: '已经拥有此房屋',
      invalidRepayment: '还款金额无效',
      saveFailed: '保存游戏失败',
      loadFailed: '找不到存档或存档已损坏',
      insufficientFunds: '资金不足，无法购买',
      autoSaveFailed: '自动保存失败',
      autoSaveError: '自动保存过程出错'
    },
    success: {
      purchased: '成功购买',
      sold: '成功出售',
      housePurchased: '成功购买房屋',
      repaid: '成功还款',
      gameSaved: '游戏已保存',
      gameLoaded: '已加载游戏',
      autoSaved: '自动保存成功'
    },
    info: {
      endGame: '你选择了结束游戏',
      timeUp: '时间已到！游戏结束',
      bankrupt: '你已破产！游戏结束'
    },
    achievement: {
      earlyGoal: '提前达成目标',
      noDebtHouse: '零负债购房',
      victory: '恭喜！你成功购买了最贵的房产！',
      achieved: '你达成了成就'
    }
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
  
  errors: {
    defaultError: '发生了一个错误',
    severity: {
      fatal: '致命错误',
      error: '错误',
      warning: '警告',
      info: '提示'
    },
    type: {
      validation: {
        default: '数据验证错误: {message}'
      },
      network: {
        default: '网络错误: {message}'
      },
      storage: {
        default: '存储错误: {message}',
        specific: {
          file_not_found: '找不到文件',
          permission_denied: '没有足够权限',
          quota_exceeded: '存储空间不足',
          data_corrupt: '数据已损坏',
          unknown: '未知存储错误'
        }
      },
      game_logic: {
        default: '游戏逻辑错误: {message}'
      },
      system: {
        default: '系统错误: {message}'
      },
      unknown: {
        default: '{message}'
      }
    }
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
  
  // 新增设置相关翻译
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
  
  currency: '元'
}; 