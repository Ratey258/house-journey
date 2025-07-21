@echo off
chcp 65001 >nul
title 《买房记》游戏功能测试 - 简化版

echo ===============================
echo  《买房记》游戏功能测试 - 简化版
echo ===============================
echo.
echo 此工具将测试游戏的核心功能，包括：
echo  - 文件结构完整性测试
echo  - 代码质量测试
echo  - 配置文件测试
echo  - 资源文件测试
echo.
echo 注意: 此测试不依赖ESM模块导入，可以稳定运行
echo.
echo [1] 开始测试
echo [0] 取消
echo.

set /p choice=请选择(1/0):
if not "%choice%"=="1" goto :cancel

echo.
echo 开始执行功能测试...
echo.

node "%~dp0\simple-function-test.js"
goto :end

:cancel
echo.
echo 已取消测试。
goto :end

:end
echo.
pause 