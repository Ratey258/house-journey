export default {
  playerInfo: {
    title: '玩家信息',
    name: '姓名',
    money: '资金',
    debt: '债务',
    capacity: '背包容量',
    week: '周数',
    repayDebt: '还款',
    bank: '银行',
    stats: {
      title: '玩家统计',
      totalProfit: '总利润',
      transactions: '交易次数',
      visitedLocations: '已访问地点',
      eventsTriggered: '触发事件数',
      highestSingleProfit: '单笔最高利润',
      mostProfitableProduct: '最赚钱商品',
      mostVisitedLocation: '最常去地点'
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
    empty: '背包是空的',
    sort: {
      default: '默认排序',
      profitDesc: '利润从高到低',
      profitAsc: '利润从低到高',
      quantityDesc: '数量从多到少',
      quantityAsc: '数量从少到多',
      nameAsc: '名称正序',
      nameDesc: '名称倒序'
    },
    filter: {
      all: '全部商品',
      profitable: '盈利商品',
      unprofitable: '亏损商品'
    },
    details: {
      title: '商品详情',
      purchaseInfo: '购买信息',
      purchaseDate: '购买日期',
      purchaseLocation: '购买地点',
      currentInfo: '当前信息',
      potentialProfit: '潜在利润',
      profitPercentage: '利润率'
    }
  },

  repayModal: {
    title: '偿还债务',
    currentDebt: '当前债务',
    availableMoney: '可用资金',
    repayAmount: '还款金额',
    remainingDebt: '剩余债务',
    remainingMoney: '剩余资金',
    fullRepay: '全部还清',
    confirm: '确认还款',
    cancel: '取消'
  },

  debtSystem: {
    title: '债务系统',
    currentDebt: '当前债务',
    interestRate: '利率',
    nextInterest: '下次利息',
    paymentDue: '应付金额',
    warning: {
      high: '警告：债务过高',
      critical: '危险：债务即将触发破产',
      bankrupt: '您已破产！'
    },
    interestApplied: '已收取{amount}元利息'
  },

  bank: {
    title: '银行服务',
    deposit: '存款',
    withdraw: '取款',
    loan: '贷款',
    repay: '还款',
    currentDeposit: '当前存款',
    currentLoan: '当前贷款',
    interestRate: '利率',
    depositInterest: '存款利率',
    loanInterest: '贷款利率',
    maxLoan: '最大贷款额度',
    availableLoan: '可贷款额度',
    amountToDeposit: '存款金额',
    amountToWithdraw: '取款金额',
    amountToLoan: '贷款金额',
    amountToRepay: '还款金额',
    confirmDeposit: '确认存款',
    confirmWithdraw: '确认取款',
    confirmLoan: '确认贷款',
    confirmRepay: '确认还款',
    interestInfo: '每周结算一次利息',
    notEnoughMoney: '资金不足',
    depositSuccess: '存款成功',
    withdrawSuccess: '取款成功',
    loanSuccess: '贷款成功',
    repaySuccess: '还款成功',
    weeklyInterest: '每周利息',
    remainingMoney: '剩余资金',
    remainingDeposit: '剩余存款',
    remainingLoan: '剩余贷款',
    remainingDebt: '剩余债务'
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
  }
} as const;