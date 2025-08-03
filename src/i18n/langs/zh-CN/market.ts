export default {
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
      price: '价格',
      high: '最高价',
      low: '最低价',
      average: '平均价',
      currentPrice: '当前价格',
      historicalPrices: '历史价格',
      priceRange: '价格区间',
      weekRange: '周数区间',
      noData: '暂无价格数据'
    },
    filter: {
      all: '全部商品',
      special: '特价商品',
      rising: '上涨商品',
      falling: '下跌商品',
      stable: '稳定商品'
    },
    sort: {
      default: '默认排序',
      priceAsc: '价格从低到高',
      priceDesc: '价格从高到低',
      changeAsc: '涨幅从低到高',
      changeDesc: '涨幅从高到低',
      nameAsc: '名称正序',
      nameDesc: '名称倒序'
    },
    location: {
      travel: '前往',
      currentLocation: '当前地点',
      travelCost: '旅行费用',
      travelTime: '旅行时间',
      travelConfirm: '确认前往{location}吗？',
      travelSuccess: '你已到达{location}',
      // 新地点名称
      second_hand_market: '二手市场',
      premium_mall: '高端商城',
      electronics_hub: '电子科技城',
      black_market: '地下黑市',
      commodity_market: '大宗商品交易所',
      // 地点描述
      second_hand_market_desc: '各类二手物品和低价生活必需品的集散地，价格便宜但品质参差不齐',
      premium_mall_desc: '汇聚各类高端品牌和奢侈品的购物中心，价格昂贵但品质优良',
      electronics_hub_desc: '各类电子产品和数码设备的专业交易市场，价格适中且品种齐全',
      black_market_desc: '隐蔽的非法交易场所，各类珍稀收藏品和奇特商品云集，风险与机遇并存',
      commodity_market_desc: '批发市场和大宗商品交易的集中地，价格低廉但需要大量采购'
    },

    // 房屋市场相关翻译
    houseMarket: {
      title: '房产市场',
      affordable: '可购买',
      purchased: '已购买',
      alreadyOwned: '已拥有',
      price: '价格',
      level: '等级',
      size: '面积',
      location: '位置',
      buyButton: '购买',
      noHouses: '没有可购买的房屋',
      notEnoughMoney: '资金不足！您需要¥{price}，但只有¥{money}，还差¥{shortfall}',
      fundsChanged: '您的资金已发生变化！需要¥{price}，但只有¥{money}，还差¥{shortfall}',
      significantConfirm: '这笔交易将花费您{percent}%的资金，确定要购买吗？',
      purchaseSuccess: '恭喜！您已成功购买{house}',
      purchaseFailed: '购买失败，请稍后重试',
      confirmTitle: '确认购买房产',
      confirmMessage: '您确定要购买"{house}"吗？',
      yourMoney: '您的资金',
      remaining: '购买后剩余',
      significantWarning: '注意：这是一笔大额交易，将耗费您大部分资金！',

      // 修改胜利相关翻译
      victoryPurchase: '恭喜！您已成功购买房产',
      victoryMessage: '恭喜您购买了房产：{house}！\n\n您当前处于第{week}周，游戏总共有{maxWeek}周。',
      continuePrompt: '您想要结束游戏并查看结果，还是继续游戏争取更高分数？',
      continuePlaying: '您选择了继续游戏，争取更高分数！游戏将继续进行到第52周。',
      endGameNow: '结束游戏并查看成绩',
      continueGame: '继续游戏',

      details: {
        title: '房屋详情',
        price: '价格',
        size: '面积',
        location: '位置',
        type: '类型',
        features: '特色',
        description: '描述'
      },
      types: {
        apartment: '公寓',
        house: '独栋别墅',
        villa: '豪华别墅',
        mansion: '豪宅',
        penthouse: '顶层公寓'
      },
      features: {
        garden: '花园',
        pool: '游泳池',
        garage: '车库',
        security: '安保系统',
        view: '景观视野',
        central: '中心位置',
        quiet: '安静社区',
        modern: '现代装修',
        classic: '经典风格',
        luxury: '豪华装修'
      }
    }
  },

  // 添加房屋名称和描述
  houses: {
    small: {
      name: '单身公寓',
      description: '适合单身人士居住的小型公寓，位置便利但空间有限。'
    },
    medium: {
      name: '二手旧房',
      description: '年代较久的二手住宅，价格适中但可能需要装修。空间较大，非常适合改造成理想的家。'
    },
    large: {
      name: '高档小区',
      description: '现代化高档住宅小区，环境优美，配套设施齐全。社区环境安全，是家庭居住的绝佳选择。'
    },
    luxury: {
      name: '现代别墅',
      description: '独栋现代别墅，拥有私家花园和车库。宽敞的空间和精致的设计，彰显主人的品味与地位。'
    },
    mansion: {
      name: '私人庄园',
      description: '大型私人庄园，带有大片绿地和多功能区域。拥有这样的房产，代表你已达到人生巅峰！'
    }
  },

  buyModal: {
    title: '购买 {product}',
    price: '单价',
    availableMoney: '可用资金',
    availableSpace: '可用空间',
    quantity: '购买数量',
    totalCost: '总花费',
    maxQuantity: '最大',
    confirm: '确认购买',
    cancel: '取消'
  },

  sellModal: {
    title: '出售 {product}',
    purchasePrice: '买入价',
    currentPrice: '当前价',
    quantity: '持有数量',
    sellQuantity: '出售数量',
    potentialProfit: '预计盈亏',
    totalIncome: '总收入',
    maxQuantity: '全部',
    confirm: '确认出售',
    cancel: '取消'
  },

  houseModal: {
    title: '购买 {house}',
    confirmPurchase: '确认购买此房屋吗？',
    price: '房屋价格',
    availableMoney: '可用资金',
    remainingMoney: '购买后剩余',
    confirm: '确认购买',
    cancel: '取消',
    endGame: '购买此房屋将结束游戏'
  },

  trends: {
    rising_strong: '价格急剧上涨',
    rising: '价格上涨中',
    stable_high: '高位稳定',
    stable: '价格稳定',
    stable_low: '低位稳定',
    falling: '价格下跌中',
    falling_strong: '价格急剧下跌',
    volatile: '价格剧烈波动',
    trendAnalysis: {
      title: '趋势分析',
      shortTerm: '短期趋势',
      midTerm: '中期趋势',
      longTerm: '长期趋势',
      prediction: '预测',
      confidence: '置信度',
      high: '高',
      medium: '中',
      low: '低'
    }
  }
} as const;