export default {
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
        default: '数据验证错误: {message}',
        specific: {
          required_field: '必填字段不能为空',
          invalid_format: '数据格式不正确',
          out_of_range: '数值超出允许范围',
          invalid_type: '数据类型不正确',
          duplicate_entry: '数据已存在',
          too_short: '输入内容过短',
          too_long: '输入内容过长'
        }
      },
      network: {
        default: '网络错误: {message}',
        specific: {
          connection_failed: '连接服务器失败，请检查您的网络连接',
          timeout: '请求超时，请稍后重试',
          server_error: '服务器错误',
          api_error: 'API错误',
          invalid_response: '无效的服务器响应',
          offline: '您当前处于离线状态'
        }
      },
      storage: {
        default: '存储错误: {message}',
        specific: {
          file_not_found: '找不到文件',
          permission_denied: '没有足够权限',
          quota_exceeded: '存储空间不足',
          data_corrupt: '数据已损坏',
          unknown: '未知存储错误',
          save_failed: '保存游戏失败',
          load_failed: '加载游戏失败',
          file_io_error: '文件读写错误',
          invalid_format: '无效的文件格式',
          version_mismatch: '版本不兼容'
        }
      },
      game_logic: {
        default: '游戏逻辑错误: {message}',
        specific: {
          invalid_operation: '无效的操作',
          insufficient_funds: '资金不足',
          inventory_full: '背包已满',
          invalid_state: '无效的游戏状态',
          invalid_transition: '无效的状态转换',
          out_of_bounds: '超出边界',
          dependency_missing: '缺少依赖项',
          invalid_parameter: '无效的参数',
          calculation_error: '计算错误',
          rule_violation: '违反游戏规则'
        }
      },
      system: {
        default: '系统错误: {message}',
        specific: {
          initialization_failed: '初始化游戏失败',
          resource_not_found: '找不到需要的资源',
          memory_error: '内存错误',
          performance_issue: '性能问题',
          render_error: '渲染错误',
          audio_error: '音频错误',
          plugin_error: '插件错误',
          compatibility_issue: '兼容性问题',
          unexpected_state: '意外的系统状态',
          critical_failure: '严重故障'
        }
      },
      unknown: {
        default: '{message}'
      }
    },
    recovery: {
      title: '错误恢复',
      message: '游戏遇到了一个问题，正在尝试恢复...',
      success: '恢复成功',
      failed: '恢复失败',
      options: {
        retry: '重试',
        reload: '重新加载',
        reset: '重置游戏',
        ignore: '忽略并继续',
        report: '报告问题'
      },
      autoSave: {
        corrupted: '自动存档已损坏',
        notFound: '找不到自动存档',
        incompatible: '自动存档与当前版本不兼容',
        loadFailed: '加载自动存档失败'
      },
      stateSnapshot: {
        restoring: '正在恢复游戏状态...',
        noValidSnapshot: '没有可用的游戏状态快照',
        partialRestore: '部分游戏状态已恢复',
        fullRestore: '游戏状态已完全恢复'
      }
    },
    errorLog: {
      title: '错误日志',
      empty: '没有记录的错误',
      timestamp: '时间',
      message: '消息',
      type: '类型',
      severity: '严重程度',
      details: '详细信息',
      actions: {
        clear: '清空日志',
        export: '导出日志',
        filter: '筛选日志',
        search: '搜索',
        showDetails: '显示详情',
        hideDetails: '隐藏详情'
      }
    }
  }
}; 