<!--
  404 页面
-->
<template>
  <div class="not-found-page">
    <div class="not-found-container">
      <div class="not-found-icon">🏠</div>
      <h1 class="not-found-title">页面未找到</h1>
      <p class="not-found-message">
        抱歉，您要查找的页面不存在。
        <br>
        可能是链接有误或页面已被移动。
      </p>
      
      <div class="not-found-actions">
        <button @click="goHome" class="action-button primary">
          🏠 返回首页
        </button>
        
        <button @click="goBack" class="action-button secondary">
          ← 返回上页
        </button>
      </div>
      
      <div class="quick-links">
        <h3>快速导航</h3>
        <div class="links-grid">
          <router-link to="/game" class="quick-link">
            🎮 开始游戏
          </router-link>
          <router-link to="/market" class="quick-link">
            🏪 市场交易
          </router-link>
          <router-link to="/player" class="quick-link">
            👤 玩家信息
          </router-link>
          <router-link to="/settings" class="quick-link">
            ⚙️ 游戏设置
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

// 返回首页
const goHome = () => {
  router.push('/');
};

// 返回上一页
const goBack = () => {
  router.back();
};

// 页面元信息
defineOptions({
  name: 'NotFoundView'
});
</script>

<style scoped>
.not-found-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%);
  padding: 2rem;
}

.not-found-container {
  text-align: center;
  max-width: 600px;
  width: 100%;
  background: var(--color-bg-secondary);
  border-radius: 12px;
  padding: 3rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.not-found-icon {
  font-size: 6rem;
  margin-bottom: 2rem;
  opacity: 0.8;
}

.not-found-title {
  font-size: 2.5rem;
  color: var(--color-text-primary);
  margin-bottom: 1rem;
  font-weight: 600;
}

.not-found-message {
  font-size: 1.1rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-bottom: 3rem;
}

.not-found-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 3rem;
}

.action-button {
  padding: 0.875rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.action-button.primary {
  background: var(--color-primary);
  color: white;
}

.action-button.primary:hover {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);
}

.action-button.secondary {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.action-button.secondary:hover {
  background: var(--color-bg-hover);
  transform: translateY(-2px);
}

.quick-links {
  border-top: 1px solid var(--color-border);
  padding-top: 2rem;
}

.quick-links h3 {
  color: var(--color-text-primary);
  margin-bottom: 1.5rem;
  font-size: 1.2rem;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

.quick-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  text-decoration: none;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  transition: all 0.2s ease;
  font-weight: 500;
}

.quick-link:hover {
  background: var(--color-bg-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .not-found-container {
    padding: 2rem;
    margin: 1rem;
  }

  .not-found-icon {
    font-size: 4rem;
  }

  .not-found-title {
    font-size: 2rem;
  }

  .not-found-actions {
    flex-direction: column;
    align-items: center;
  }

  .action-button {
    width: 100%;
    max-width: 200px;
  }

  .links-grid {
    grid-template-columns: 1fr;
  }
}
</style>