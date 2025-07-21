<!-- 
  音频管理器组件
  负责预加载和管理游戏音效
  这是一个无UI组件，仅处理音频逻辑
-->
<template>
  <div style="display: none;"></div>
</template>

<script>
import { ref, onMounted, provide, watch } from 'vue';
import { useSettingsStore } from '../../../stores/settingsStore';
import { handleError, ErrorType, ErrorSeverity } from '../../../infrastructure/utils/errorHandler';

export default {
  name: 'AudioManager',
  setup() {
    // 获取设置存储
    const settingsStore = useSettingsStore();
    
    // 创建音频管理对象
    const audio = ref({
      sounds: {},
      load: (id, path, options = {}) => {
        console.log(`模拟加载音效: ${id}, 路径: ${path}`);
        // 在实际项目中，这里应该使用Howler.js或Web Audio API加载音效
        audio.value.sounds[id] = {
          id,
          path,
          volume: (vol) => {
            console.log(`设置音效 ${id} 音量: ${vol}`);
            return audio.value.sounds[id];
          },
          play: () => {
            console.log(`播放音效: ${id}`);
            return audio.value.sounds[id];
          },
          stop: () => {
            console.log(`停止音效: ${id}`);
            return audio.value.sounds[id];
          }
        };
        
        // 调用加载成功回调
        if (options.onload && typeof options.onload === 'function') {
          setTimeout(options.onload, 100);
        }
        
        return audio.value.sounds[id];
      },
      play: (id, options = {}) => {
        if (audio.value.sounds[id]) {
          console.log(`播放音效: ${id}`);
          return audio.value.sounds[id].play();
        }
        return null;
      },
      stop: (id) => {
        if (audio.value.sounds[id]) {
          console.log(`停止音效: ${id}`);
          return audio.value.sounds[id].stop();
        }
        return null;
      }
    });
    
    // 提供音频管理器给其他组件
    provide('audio', audio.value);
    
    // 音效资源列表
    const soundResources = {
      // UI音效
      ui_click: '/sounds/ui/click.mp3',
      ui_hover: '/sounds/ui/hover.mp3',
      ui_back: '/sounds/ui/back.mp3',
      ui_error: '/sounds/ui/error.mp3',
      ui_success: '/sounds/ui/success.mp3',
      
      // 通知音效
      notify_info: '/sounds/notifications/info.mp3',
      notify_success: '/sounds/notifications/success.mp3',
      notify_warning: '/sounds/notifications/warning.mp3',
      notify_error: '/sounds/notifications/error.mp3',
      
      // 游戏音效
      game_buy: '/sounds/game/buy.mp3',
      game_sell: '/sounds/game/sell.mp3',
      game_level_up: '/sounds/game/level_up.mp3',
      game_week_change: '/sounds/game/week_change.mp3',
      game_event: '/sounds/game/event.mp3',
      
      // 背景音乐
      bgm_menu: '/sounds/music/menu_theme.mp3',
      bgm_game: '/sounds/music/game_theme.mp3'
    };
    
    // 预加载音效
    const preloadSounds = () => {
      console.log('预加载音效资源...');
      
      // 注意：实际项目中，这些音频文件应该存在于public/sounds目录下
      // 这里我们只是模拟预加载过程
      Object.entries(soundResources).forEach(([id, path]) => {
        try {
          // 判断是否为背景音乐
          const isBgm = id.startsWith('bgm_');
          
          // 加载音效
          audio.value.load(id, path, {
            volume: isBgm ? settingsStore.musicVolume : settingsStore.soundVolume,
            loop: isBgm,
            preload: true,
            html5: isBgm, // 背景音乐使用HTML5音频以支持流式加载
            onload: () => console.log(`音效加载完成: ${id}`),
            onloaderror: (error) => console.warn(`音效加载失败: ${id}`, error)
          });
        } catch (err) {
          handleError(err, 'AudioManager (common)', ErrorType.UNKNOWN, ErrorSeverity.WARNING);
          console.warn(`加载音效失败: ${id}`, err);
        }
      });
    };
    
    // 播放UI音效
    const playUISound = (type) => {
      if (!settingsStore.soundEnabled) return;
      
      const soundId = `ui_${type}`;
      if (audio.value.sounds[soundId]) {
        audio.value.play(soundId, { volume: settingsStore.soundVolume });
      }
    };
    
    // 播放背景音乐
    const playBackgroundMusic = (type) => {
      if (!settingsStore.musicEnabled) return;
      
      try {
        // 停止所有当前播放的背景音乐
        Object.keys(audio.value.sounds).forEach(id => {
          if (id.startsWith('bgm_')) {
            audio.value.stop(id);
          }
        });
        
        // 播放指定背景音乐
        const musicId = `bgm_${type}`;
        if (audio.value.sounds[musicId]) {
          audio.value.play(musicId, { 
            volume: settingsStore.musicVolume,
            loop: true
          });
        }
      } catch (err) {
        handleError(err, 'AudioManager (common)', ErrorType.UNKNOWN, ErrorSeverity.WARNING);
        console.warn('播放背景音乐失败:', err);
      }
    };

    // 监听音效音量变化
    watch(() => settingsStore.soundVolume, (newVolume) => {
      try {
        // 更新所有音效的音量
        Object.keys(audio.value.sounds).forEach(id => {
          if (!id.startsWith('bgm_')) {
            const sound = audio.value.sounds[id];
            if (sound) {
              sound.volume(newVolume);
            }
          }
        });
      } catch (err) {
        handleError(err, 'AudioManager (common)', ErrorType.UNKNOWN, ErrorSeverity.WARNING);
        console.warn('更新音效音量失败:', err);
      }
    });

    // 监听背景音乐音量变化
    watch(() => settingsStore.musicVolume, (newVolume) => {
      try {
        // 更新所有背景音乐的音量
        Object.keys(audio.value.sounds).forEach(id => {
          if (id.startsWith('bgm_')) {
            const sound = audio.value.sounds[id];
            if (sound) {
              sound.volume(newVolume);
            }
          }
        });
      } catch (err) {
        handleError(err, 'AudioManager (common)', ErrorType.UNKNOWN, ErrorSeverity.WARNING);
        console.warn('更新背景音乐音量失败:', err);
      }
    });

    // 监听音效开关变化
    watch(() => settingsStore.soundEnabled, (enabled) => {
      if (!enabled) {
        try {
          // 停止所有非背景音乐音效
          Object.keys(audio.value.sounds).forEach(id => {
            if (!id.startsWith('bgm_')) {
              audio.value.stop(id);
            }
          });
        } catch (err) {
          handleError(err, 'AudioManager (common)', ErrorType.UNKNOWN, ErrorSeverity.WARNING);
          console.warn('停止音效失败:', err);
        }
      }
    });

    // 监听背景音乐开关变化
    watch(() => settingsStore.musicEnabled, (enabled) => {
      try {
        if (!enabled) {
          // 停止所有背景音乐
          Object.keys(audio.value.sounds).forEach(id => {
            if (id.startsWith('bgm_')) {
              audio.value.stop(id);
            }
          });
        } else {
          // 恢复播放当前场景的背景音乐
          const currentScene = settingsStore.currentScene || 'menu';
          playBackgroundMusic(currentScene);
        }
      } catch (err) {
        handleError(err, 'AudioManager (common)', ErrorType.UNKNOWN, ErrorSeverity.WARNING);
        console.warn('处理背景音乐开关失败:', err);
      }
    });
    
    // 组件挂载时初始化
    onMounted(() => {
      try {
        // 预加载音效
        preloadSounds();
        
        // 全局挂载音频方法
        window.gameAudio = {
          playUI: playUISound,
          playBGM: playBackgroundMusic
        };
      } catch (err) {
        handleError(err, 'AudioManager (common)', ErrorType.UNKNOWN, ErrorSeverity.WARNING);
        console.warn('音频管理器初始化失败:', err);
      }
    });
    
    // 返回暴露的方法和对象
    return {
      audio,
      playUISound,
      playBackgroundMusic
    };
  }
};
</script> 