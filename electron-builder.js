/**
 * electron-builder 配置文件
 */
module.exports = {
  appId: 'com.housejourney.app',
  productName: '买房记v0.1.0',
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

  // Windows 配置
  win: {
    icon: 'ico.ico',
    target: [
      {
        target: 'portable',
        arch: ['x64']
      }
    ],
    artifactName: '买房记v0.1.0.${ext}'
  },

  portable: {
    artifactName: '买房记v0.1.0.exe',
    requestExecutionLevel: 'user'
  },

  // 自动更新配置
  publish: {
    provider: 'github',
    owner: 'Ratey258',
    repo: 'house-journey',
    private: false,
    releaseType: 'release',
    token: process.env.GH_TOKEN
  }
};
