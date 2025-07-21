<template>
  <div class="language-selector">
    <div class="current-language" @click="toggleDropdown">
      <span class="flag">{{ getCurrentLanguage().flag }}</span>
      <span class="name">{{ getCurrentLanguage().name }}</span>
      <span class="chevron">
        <i class="icon-chevron-down" :class="{ 'rotated': showDropdown }"></i>
      </span>
    </div>
    
    <transition name="dropdown">
      <div v-if="showDropdown" class="language-dropdown">
        <div 
          v-for="lang in supportedLanguages" 
          :key="lang.code"
          :class="['language-option', { active: isCurrentLanguage(lang.code) }]"
          @click="changeLanguage(lang.code)"
        >
          <span class="flag">{{ lang.flag }}</span>
          <span class="name">{{ lang.name }}</span>
          <span v-if="isCurrentLanguage(lang.code)" class="check">
            <i class="icon-check"></i>
          </span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { getSupportedLanguages, setLanguage } from '../../../i18n';

const i18n = useI18n();
const showDropdown = ref(false);

// 获取当前语言
const currentLocale = computed(() => i18n.locale.value);

// 获取支持的语言列表
const supportedLanguages = getSupportedLanguages();

// 获取当前语言对象
function getCurrentLanguage() {
  return supportedLanguages.find(lang => lang.code === currentLocale.value) || supportedLanguages[0];
}

// 判断是否为当前语言
function isCurrentLanguage(code) {
  return code === currentLocale.value;
}

// 切换下拉菜单
function toggleDropdown() {
  showDropdown.value = !showDropdown.value;
}

// 切换语言
function changeLanguage(langCode) {
  if (langCode !== currentLocale.value) {
    setLanguage(langCode);
  }
  showDropdown.value = false;
}

// 点击外部关闭下拉菜单
function closeOnOutsideClick(e) {
  if (showDropdown.value && !e.target.closest('.language-selector')) {
    showDropdown.value = false;
  }
}

// 添加和移除事件监听
onMounted(() => {
  document.addEventListener('click', closeOnOutsideClick);
});

onUnmounted(() => {
  document.removeEventListener('click', closeOnOutsideClick);
});
</script>

<style scoped>
.language-selector {
  position: relative;
  user-select: none;
  z-index: 100;
}

.current-language {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  cursor: pointer;
  min-width: 80px;
  transition: background-color 0.2s;
}

.current-language:hover {
  background: rgba(255, 255, 255, 0.2);
}

.flag {
  font-size: 18px;
  margin-right: 8px;
}

.name {
  font-size: 14px;
  flex: 1;
}

.chevron {
  margin-left: 6px;
  font-size: 12px;
  transition: transform 0.3s;
}

.chevron .rotated {
  transform: rotate(180deg);
}

.language-dropdown {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  width: 100%;
  min-width: 120px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.language-option {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.language-option:hover {
  background: rgba(0, 0, 0, 0.05);
}

.language-option.active {
  background: rgba(0, 0, 0, 0.1);
}

.check {
  margin-left: auto;
  color: #4CAF50;
}

/* 下拉动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style> 