/**
 * electron-builder配置文件
 * 此文件用于定义Electron应用程序的打包配置
 */

// https://vitejs.dev/config/
module.exports = {
  appId: 'com.housejourney.app',
  productName: '买房记',
  copyright: `Copyright © ${new Date().getFullYear()} 买房记 开发团队`,
  
  // 输出目录
  directories: {
    output: 'dist_electron',
    buildResources: 'resources'
  },
  
  // 资源配置
  files: [
    "dist/**/*",
    "electron/**/*",
    "!node_modules/**/*"
  ],
  
  // 额外资源
  extraResources: [
    {
      from: 'resources',
      to: 'resources'
    }
  ],
  
  // Windows平台配置
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      },
      {
        target: 'portable',
        arch: ['x64']
      }
    ],
    icon: 'icon.ico'  // 直接使用根目录下的图标
  },
  
  // NSIS安装程序配置
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: '买房记',
    artifactName: '买房记-安装版-${version}.exe'
  },
  
  // 便携版配置
  portable: {
    artifactName: '买房记-便携版-${version}.exe'
  },
  
  // 调试选项
  asar: true,
  
  // 发布配置
  publish: {
    provider: 'generic',
    url: 'http://your-update-server.com/updates/'  // 更改为实际的更新服务器URL
  }
}; 