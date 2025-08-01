/**
 * 延迟启动 Electron 脚本
 * 确保 Vite 开发服务器完全启动后再启动 Electron
 */
import { spawn } from 'child_process';

console.log('🚀 等待 Vite 服务器启动...');

// 等待3秒后启动 Electron，给 Vite 服务器足够的启动时间
setTimeout(() => {
  console.log('🖥️  启动 Electron...');

  const electron = spawn('electron', ['.'], {
    stdio: 'inherit',
    shell: true
  });

  electron.on('close', (code) => {
    console.log(`Electron 进程退出，代码: ${code}`);
    process.exit(code);
  });

  electron.on('error', (error) => {
    console.error('启动 Electron 时出错:', error);
    process.exit(1);
  });
}, 3000);
