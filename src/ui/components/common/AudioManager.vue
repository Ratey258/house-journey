<!--
  音频管理器组件
  负责预加载和管理游戏音效
  这是一个无UI组件，仅处理音频逻辑
-->
<template>
  <!-- 这个组件没有UI渲染，它只是提供音频管理服务 -->
  <div class="audio-manager" style="display:none;"></div>
</template>

<script setup>
import { ref, provide, onMounted, watch } from 'vue';
import { useSettingsStore } from '@/stores/settingsStore';

// 获取设置存储
const settingsStore = useSettingsStore();

// 创建音频管理对象（仅提供模拟接口，不实际加载音频）
const audio = ref({
  sounds: {},
  load: (id, path) => {
    console.log(`模拟加载音效: ${id}, 路径: ${path}（音频功能已禁用）`);
    audio.value.sounds[id] = {
      id,
      path,
      volume: (vol) => {
        console.log(`模拟设置音效 ${id} 音量: ${vol}`);
        return audio.value.sounds[id];
      },
      play: () => {
        console.log(`模拟播放音效: ${id}（音频功能已禁用）`);
        return audio.value.sounds[id];
      },
      stop: () => {
        console.log(`模拟停止音效: ${id}（音频功能已禁用）`);
        return audio.value.sounds[id];
      }
    };

    return audio.value.sounds[id];
  },
  play: (id) => {
    console.log(`模拟播放音效: ${id}（音频功能已禁用）`);
    return null;
  },
  stop: (id) => {
    console.log(`模拟停止音效: ${id}（音频功能已禁用）`);
    return null;
  },
  setVolume: (volume) => {
    console.log(`模拟设置全局音量: ${volume}（音频功能已禁用）`);
  }
});

// 提供音频管理器给其他组件
provide('audio', audio.value);

// 初始化音频系统（仅提供模拟接口）
onMounted(() => {
  console.log('AudioManager初始化（音频功能已禁用）');
});

// 监听音量变化（仅记录日志）
watch(() => settingsStore.soundVolume, (newVolume) => {
  console.log(`音效音量变化: ${newVolume}（音频功能已禁用）`);
});

watch(() => settingsStore.musicVolume, (newVolume) => {
  console.log(`音乐音量变化: ${newVolume}（音频功能已禁用）`);
});

// 导出接口
defineExpose({
  playSound: (id) => {
    console.log(`模拟播放音效: ${id}（音频功能已禁用）`);
  },
  stopSound: (id) => {
    console.log(`模拟停止音效: ${id}（音频功能已禁用）`);
  },
  playBackgroundMusic: (id) => {
    console.log(`模拟播放背景音乐: ${id}（音频功能已禁用）`);
  },
  stopBackgroundMusic: () => {
    console.log(`模拟停止背景音乐（音频功能已禁用）`);
  },
  setMusicVolume: (volume) => {
    console.log(`模拟设置背景音乐音量: ${volume}（音频功能已禁用）`);
  },
  setSoundVolume: (volume) => {
    console.log(`模拟设置音效音量: ${volume}（音频功能已禁用）`);
  },
  pauseAll: () => {
    console.log(`模拟暂停所有音频（音频功能已禁用）`);
  },
  resumeAll: () => {
    console.log(`模拟恢复所有音频（音频功能已禁用）`);
  }
});
</script>
