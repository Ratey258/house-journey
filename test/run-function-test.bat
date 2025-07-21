@echo off
chcp 65001 >nul
title 《买房记》游戏功能测试

echo ===============================
echo    《买房记》游戏功能测试
echo ===============================
echo.
echo 此工具将测试游戏的核心功能模块，包括：
echo  - 价格系统功能测试
echo  - 事件系统功能测试
echo  - 存储系统功能测试
echo  - 游戏循环功能测试
echo  - 玩家模型功能测试
echo.
echo 注意: 测试需要先构建项目，确保src目录下的模块可以被正确导入
echo.
echo [1] 开始测试
echo [0] 取消
echo.

set /p choice=请选择(1/0):
if not "%choice%"=="1" goto :cancel

echo.
echo 开始执行功能测试...
echo.

node "%~dp0\game-function-test.js"
goto :end

:cancel
echo.
echo 已取消测试。
goto :end

:end
echo.
pause 