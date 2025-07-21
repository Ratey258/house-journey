import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ErrorBoundary from '../../../src/components/ErrorBoundary.vue';

// 模拟错误处理工具
vi.mock('../../../src/utils/errorHandler', () => ({
  handleError: vi.fn(),
  ErrorType: {
    SYSTEM: 'system'
  }
}));

// 创建正常的测试组件
const NormalComponent = {
  template: '<div>正常组件</div>'
};

describe('ErrorBoundary组件', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('正常渲染子组件', () => {
    const wrapper = mount(ErrorBoundary, {
      slots: {
        default: NormalComponent
      },
      global: {
        mocks: {
          $t: (key) => key
        }
      }
    });
    
    expect(wrapper.text()).toContain('正常组件');
    expect(wrapper.find('.error-boundary').exists()).toBe(false);
  });
  
  it('当hasError为true时显示错误界面', () => {
    // 直接设置组件内部状态
    const wrapper = mount(ErrorBoundary, {
      global: {
        mocks: {
          $t: (key) => key
        }
      }
    });
    
    // 手动设置错误状态
    wrapper.vm.hasError = true;
    wrapper.vm.errorMessage = '测试错误';
    
    // 等待DOM更新
    wrapper.vm.$nextTick();
    
    // 验证错误UI被显示
    expect(wrapper.find('.error-boundary').exists()).toBe(true);
    expect(wrapper.text()).toContain('system.componentError');
    expect(wrapper.text()).toContain('system.retry');
  });
  
  it('点击重试按钮应重置错误状态', async () => {
    const wrapper = mount(ErrorBoundary, {
      global: {
        mocks: {
          $t: (key) => key
        }
      }
    });
    
    // 手动设置错误状态
    wrapper.vm.hasError = true;
    wrapper.vm.errorMessage = '测试错误';
    
    await wrapper.vm.$nextTick();
    
    // 验证错误UI被显示
    expect(wrapper.find('.error-boundary').exists()).toBe(true);
    
    // 点击重试按钮
    await wrapper.find('button.retry-button').trigger('click');
    
    // 验证组件已重置
    expect(wrapper.vm.hasError).toBe(false);
    expect(wrapper.find('.error-boundary').exists()).toBe(false);
  });
  
  it('errorCaptured钩子应正确处理错误', () => {
    const wrapper = mount(ErrorBoundary, {
      props: {
        componentId: 'test-component'
      },
      global: {
        mocks: {
          $t: (key) => key
        }
      }
    });
    
    const mockError = new Error('测试错误');
    const mockInstance = { $options: { name: 'TestComponent' } };
    const mockInfo = 'test';
    
    // 手动调用errorCaptured钩子
    const result = wrapper.vm.errorCaptured(mockError, mockInstance, mockInfo);
    
    // 验证错误状态被正确设置
    expect(wrapper.vm.hasError).toBe(true);
    expect(wrapper.vm.errorMessage).toBe('测试错误');
    
    // 验证handleError被调用
    const { handleError } = require('../../../src/utils/errorHandler');
    expect(handleError).toHaveBeenCalled();
    
    // 验证钩子返回false以阻止错误继续传播
    expect(result).toBe(false);
  });
}); 