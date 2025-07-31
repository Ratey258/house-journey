/**
 * electron-builder 配置文件
 */
const pkg = require('./package.json');

module.exports = {
  appId: 'com.housejourney.app',
  productName: `买房记v${pkg.version}`,
  copyright: 'Copyright © 2025 春卷',

  directories: {
    output: 'build-output',
    buildResources: 'resources'
  },

  files: [
    'dist/**/*',
    'electron/**/*',
    'resources/**/*',
    'package.json'
  ],

  // 安全增强
  asar: true,
  asarUnpack: ['resources/assets/**/*'],

  // Windows 配置
  win: {
    icon: 'resources/logo.png', // 使用资源目录中的图标
    target: [
      {
        target: 'portable',
        arch: ['x64']
      },
      {
        target: 'nsis',
        arch: ['x64']
      }
    ],
    artifactName: `买房记v${pkg.version}.${ext}`
  },

  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: `买房记v${pkg.version}`
  },

  portable: {
    artifactName: `买房记v${pkg.version}.exe`,
    requestExecutionLevel: 'user'
  },

  // Mac 配置
  mac: {
    icon: 'resources/logo.png',
    target: ['dmg', 'zip'],
    artifactName: `买房记v${pkg.version}.${ext}`
  },

  // 自动更新配置
  publish: {
    provider: 'github',
    owner: 'Ratey258',
    repo: 'house-journey',
    private: false,
    releaseType: 'release',
    token: process.env.GH_TOKEN
  },

  // 优化设置
  compression: 'maximum',
  removePackageScripts: true,
  buildDependenciesFromSource: true
};
