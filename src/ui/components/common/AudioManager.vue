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
import { useSmartLogger } from '@/infrastructure/utils/smartLogger';

// 获取设置存储
const settingsStore = useSettingsStore();

// 初始化智能日志系统
const { ui } = useSmartLogger();

// 创建音频管理对象（仅提供模拟接口，不实际加载音频）
const audio = ref({
  sounds: {},
  load: (id, path) => {
    ui.debug(`模拟加载音效: ${id}`, { path, disabled: true }, 'audio-load');
    audio.value.sounds[id] = {
      id,
      path,
      volume: (vol) => {
        ui.debug(`模拟设置音效音量: ${id}`, { volume: vol, disabled: true }, 'audio-volume');
        return audio.value.sounds[id];
      },
      play: () => {
        ui.debug(`模拟播放音效: ${id}`, { disabled: true }, 'audio-play-method');
        return audio.value.sounds[id];
      },
      stop: () => {
        ui.debug(`模拟停止音效: ${id}`, { disabled: true }, 'audio-stop-method');
        return audio.value.sounds[id];
      }
    };

    return audio.value.sounds[id];
  },
  play: (id) => {
    ui.debug(`模拟播放音效: ${id}`, { disabled: true }, 'audio-play-global');
    return null;
  },
  stop: (id) => {
    ui.debug(`模拟停止音效: ${id}`, { disabled: true }, 'audio-stop-global');
    return null;
  },
  setVolume: (volume) => {
    ui.debug('模拟设置全局音量', { volume, disabled: true }, 'audio-global-volume');
  }
});

// 提供音频管理器给其他组件
provide('audio', audio.value);

// 初始化音频系统（仅提供模拟接口）
onMounted(() => {
  ui.info('AudioManager初始化', { disabled: true }, 'audio-manager-init');
});

// 监听音量变化（仅记录日志）
watch(() => settingsStore.soundVolume, (newVolume) => {
  ui.debug('音效音量变化', { volume: newVolume, disabled: true }, 'sound-volume-change');
});

watch(() => settingsStore.musicVolume, (newVolume) => {
  ui.debug('音乐音量变化', { volume: newVolume, disabled: true }, 'music-volume-change');
});

// 导出接口
defineExpose({
  playSound: (id) => {
    ui.debug(`模拟播放音效: ${id}`, { disabled: true }, 'play-sound-expose');
  },
  stopSound: (id) => {
    ui.debug(`模拟停止音效: ${id}`, { disabled: true }, 'stop-sound-expose');
  },
  playBackgroundMusic: (id) => {
    ui.debug(`模拟播放背景音乐: ${id}`, { disabled: true }, 'play-background-music');
  },
  stopBackgroundMusic: () => {
    ui.debug('模拟停止背景音乐', { disabled: true }, 'stop-background-music');
  },
  setMusicVolume: (volume) => {
    ui.debug('模拟设置背景音乐音量', { volume, disabled: true }, 'set-music-volume');
  },
  setSoundVolume: (volume) => {
    ui.debug('模拟设置音效音量', { volume, disabled: true }, 'set-sound-volume');
  },
  pauseAll: () => {
    ui.debug('模拟暂停所有音频', { disabled: true }, 'pause-all-audio');
  },
  resumeAll: () => {
    ui.debug('模拟恢复所有音频', { disabled: true }, 'resume-all-audio');
  }
});
</script>
