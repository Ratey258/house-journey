export default {
  ui: {
    mainMenu: {
      title: '买房记',
      newGame: '新游戏',
      loadGame: '加载游戏',
      settings: '设置',
      exit: '退出',
      version: '版本 {version}',
      credits: '制作团队'
    },
    
    saveMenu: {
      title: '存档管理',
      newSave: '新建存档',
      loadSave: '加载存档',
      deleteSave: '删除存档',
      back: '返回',
      noSaves: '没有找到存档',
      saveDate: '保存日期: {date}',
      saveWeek: '游戏周: {week}',
      playerName: '玩家: {name}',
      playerMoney: '资金: {money}',
      confirmDelete: '确定要删除这个存档吗？',
      overwriteConfirm: '存档已存在，是否覆盖？',
      invalidSave: '无效的存档文件'
    },
    
    gameView: {
      nextWeek: '下一周',
      menu: '菜单',
      tabs: {
        market: '市场',
        inventory: '背包',
        houses: '房屋'
      },
      weekDisplay: '第 {current}/{total} 周',
      moneyDisplay: '{amount} 元',
      debtDisplay: '债务: {amount} 元',
      loading: '加载中...',
      saving: '保存中...'
    },
    
    dialogs: {
      confirm: {
        title: '确认',
        ok: '确定',
        cancel: '取消'
      },
      alert: {
        title: '提示',
        ok: '确定'
      },
      input: {
        title: '输入',
        ok: '确定',
        cancel: '取消'
      },
      error: {
        title: '错误',
        ok: '确定',
        details: '详细信息'
      }
    },
    
    toast: {
      success: '成功',
      error: '错误',
      info: '提示',
      warning: '警告'
    },
    
    loading: {
      initializing: '初始化游戏...',
      loadingAssets: '加载资源...',
      loadingGame: '加载游戏...',
      savingGame: '保存游戏...',
      processingTurn: '处理游戏回合...',
      generatingWorld: '生成游戏世界...',
      ready: '准备就绪'
    },
    
    devTools: {
      title: '开发工具',
      addMoney: '添加资金',
      removeMoney: '减少资金',
      addDebt: '添加债务',
      removeDebt: '减少债务',
      skipWeek: '跳过周数',
      unlockAllLocations: '解锁所有地点',
      resetPrices: '重置价格',
      triggerEvent: '触发事件',
      amount: '数量',
      apply: '应用',
      cancel: '取消',
      eventType: '事件类型',
      warning: '警告：使用开发工具可能会影响游戏平衡和体验'
    },
    
    charts: {
      title: '图表',
      priceHistory: '价格历史',
      playerNetWorth: '玩家净资产',
      weeklyProfit: '每周利润',
      zoom: '缩放',
      period: '周期',
      showAll: '显示全部',
      last10Weeks: '最近10周',
      last20Weeks: '最近20周',
      custom: '自定义',
      noData: '暂无数据',
      exportData: '导出数据',
      importData: '导入数据'
    },
    
    errorHandling: {
      title: '错误处理',
      message: '发生错误',
      details: '详细信息',
      stackTrace: '堆栈跟踪',
      retry: '重试',
      ignore: '忽略',
      report: '报告问题',
      close: '关闭',
      errorBoundary: {
        title: '组件错误',
        message: '组件渲染出错',
        reset: '重置组件'
      }
    }
  }
}; 