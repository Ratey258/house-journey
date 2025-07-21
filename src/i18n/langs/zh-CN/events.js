export default {
  event: {
    title: '事件',
    debtIncrease: '债务增加',
    debtDecrease: '债务减少',
    gainProduct: '获得物品',
    loseProduct: '失去物品',
    moneyGain: '获得资金',
    moneyLoss: '失去资金',
    priceChange: '价格变动',
    capacityChange: '背包容量变化',
    specialEvent: '特殊事件',
    types: {
      positive: '正面事件',
      negative: '负面事件',
      neutral: '中性事件',
      mixed: '复合事件'
    },
    effects: {
      money: '资金 {change}',
      debt: '债务 {change}',
      capacity: '背包容量 {change}',
      product: '商品: {product} x {quantity}',
      price: '{product} 价格 {change}',
      location: '解锁地点: {location}'
    },
    choices: {
      accept: '接受',
      decline: '拒绝',
      option1: '选项1',
      option2: '选项2',
      option3: '选项3',
      continue: '继续'
    },
    notifications: {
      triggered: '触发事件: {name}',
      completed: '事件完成: {name}',
      reward: '获得奖励: {reward}',
      penalty: '受到惩罚: {penalty}',
      choiceMade: '已选择: {choice}'
    },
    common: {
      marketCrash: '市场崩盘',
      marketBoom: '市场繁荣',
      robbery: '遭遇抢劫',
      lottery: '中彩票',
      backpackUpgrade: '背包升级',
      backpackDamage: '背包损坏',
      investmentSuccess: '投资成功',
      investmentFailure: '投资失败',
      taxAudit: '税务审计',
      inheritance: '意外继承',
      donation: '慈善捐款',
      discount: '特别折扣',
      priceHike: '价格上涨',
      specialOffer: '特别优惠',
      blackMarket: '黑市交易'
    },
    descriptions: {
      marketCrash: '市场突然崩盘！所有商品价格大幅下跌。',
      marketBoom: '市场突然繁荣！所有商品价格大幅上涨。',
      robbery: '你被抢劫了！失去了一些资金和商品。',
      lottery: '恭喜你中了彩票！获得额外资金。',
      backpackUpgrade: '你找到了一个更大的背包，容量增加！',
      backpackDamage: '你的背包破损了，容量减少！',
      investmentSuccess: '你的投资获得了成功，获得额外收益。',
      investmentFailure: '你的投资失败了，损失了一些资金。',
      taxAudit: '税务部门对你进行了审计，你需要支付一些税款。',
      inheritance: '你意外继承了一笔财产，获得额外资金。',
      donation: '你决定为慈善事业捐款，失去一些资金但获得了好评。',
      discount: '商店推出了特别折扣，某些商品价格下降。',
      priceHike: '由于供应短缺，某些商品价格上涨。',
      specialOffer: '你收到了一个特别优惠，可以低价购买某些商品。',
      blackMarket: '你发现了一个黑市交易机会，可以高价出售某些商品。'
    }
  },
  
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
      bankrupt: '你已破产！游戏结束',
      weekProgress: '进入第 {week} 周',
      locationChange: '你已到达 {location}'
    },
    achievement: {
      earlyGoal: '提前达成目标',
      noDebtHouse: '零负债购房',
      victory: '恭喜！你成功购买了最贵的房产！',
      achieved: '你达成了成就: {name}'
    }
  }
}; 