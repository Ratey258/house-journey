/**
 * 智能主题系统 Composable
 * 基于@vueuse/core的useDark()和设置Store实现
 * 支持亮色/暗色/自动三种模式
 */

import { computed, watch, nextTick, readonly } from 'vue';
import { useDark, useToggle, usePreferredDark, useStorage } from '@vueuse/core';
import { useSettingsStore } from '../../stores/settingsStore';
import { useSmartLogger } from '../../infrastructure/utils/smartLogger';

export interface ThemeConfig {
  theme: 'light' | 'dark' | 'auto';
  isDark: boolean;
  systemPrefersDark: boolean;
  effectiveTheme: 'light' | 'dark';
}

export function useTheme() {
  const settingsStore = useSettingsStore();
  const logger = useSmartLogger();

  // 系统偏好暗色主题检测
  const systemPrefersDark = usePreferredDark();

  // 当前是否使用暗色主题的响应式状态
  const isDark = useDark({
    selector: 'html',
    attribute: 'data-theme',
    valueDark: 'dark',
    valueLight: 'light',
  });

  // 主题切换方法
  const toggleTheme = useToggle(isDark);

  // 计算有效主题（解析auto模式）
  const effectiveTheme = computed((): 'light' | 'dark' => {
    const theme = settingsStore.theme;
    if (theme === 'auto') {
      return systemPrefersDark.value ? 'dark' : 'light';
    }
    return theme;
  });

  // 主题配置对象
  const themeConfig = computed((): ThemeConfig => ({
    theme: settingsStore.theme,
    isDark: isDark.value,
    systemPrefersDark: systemPrefersDark.value,
    effectiveTheme: effectiveTheme.value,
  }));

    /**
   * 设置主题模式
   */
  function setTheme(theme: 'light' | 'dark' | 'auto'): void {
    logger.debug('主题切换', { from: settingsStore.theme, to: theme });

    // 更新设置Store中的主题
    settingsStore.updateSetting('theme', theme);

    // 根据新主题设置更新实际显示
    nextTick(() => {
      const shouldBeDark = theme === 'auto'
        ? systemPrefersDark.value
        : theme === 'dark';
      isDark.value = shouldBeDark;
    });

    logger.info('主题已切换', {
      theme,
      isDark: isDark.value,
      systemPrefersDark: systemPrefersDark.value
    });
  }

  /**
   * 切换到下一个主题模式
   */
  function cycleTheme(): void {
    const currentTheme = settingsStore.theme;
    const themes: Array<'light' | 'dark' | 'auto'> = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];

    setTheme(nextTheme);

    logger.debug('主题循环切换', {
      from: currentTheme,
      to: nextTheme,
      sequence: themes
    });
  }

  /**
   * 获取主题显示名称
   */
  function getThemeDisplayName(theme?: 'light' | 'dark' | 'auto'): string {
    const targetTheme = theme || settingsStore.theme;
    const names = {
      light: '亮色主题',
      dark: '暗色主题',
      auto: '跟随系统'
    };
    return names[targetTheme];
  }

  /**
   * 获取主题图标
   */
  function getThemeIcon(theme?: 'light' | 'dark' | 'auto'): string {
    const targetTheme = theme || settingsStore.theme;
    const icons = {
      light: '☀️',
      dark: '🌙',
      auto: '🔄'
    };
    return icons[targetTheme];
  }

    // 监听系统主题变化，当设置为auto时自动更新
  watch(systemPrefersDark, (newPrefersDark) => {
    if (settingsStore.theme === 'auto') {
      isDark.value = newPrefersDark;
      logger.debug('系统主题变化，自动更新', {
        systemPrefersDark: newPrefersDark,
        isDark: isDark.value
      });
    }
  });

  // 监听设置Store的主题变化
  watch(() => settingsStore.theme, (newTheme) => {
    const shouldBeDark = newTheme === 'auto'
      ? systemPrefersDark.value
      : newTheme === 'dark';
    isDark.value = shouldBeDark;

    logger.debug('设置主题变化', {
      theme: newTheme,
      isDark: isDark.value,
      effectiveTheme: effectiveTheme.value
    });
  });

    // 页面加载时应用保存的主题设置
  function initTheme(): void {
    const savedTheme = settingsStore.theme;
    logger.info('初始化主题系统', {
      savedTheme,
      systemPrefersDark: systemPrefersDark.value
    });

    // 应用HTML data-theme属性
    const htmlElement = document.documentElement;
    const shouldBeDark = savedTheme === 'auto'
      ? systemPrefersDark.value
      : savedTheme === 'dark';

    htmlElement.setAttribute('data-theme', shouldBeDark ? 'dark' : 'light');
    isDark.value = shouldBeDark;

    logger.debug('主题初始化完成', {
      htmlDataTheme: htmlElement.getAttribute('data-theme'),
      isDark: isDark.value
    });
  }

  return {
    // 状态
    isDark: readonly(isDark),
    systemPrefersDark: readonly(systemPrefersDark),
    effectiveTheme: readonly(effectiveTheme),
    themeConfig: readonly(themeConfig),

    // 方法
    setTheme,
    toggleTheme,
    cycleTheme,
    getThemeDisplayName,
    getThemeIcon,
    initTheme,
  };
}

export type UseThemeReturn = ReturnType<typeof useTheme>;
