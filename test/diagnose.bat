@echo off
chcp 65001 >nul
title 《买房记》游戏功能全方位测试

echo ===============================
echo    《买房记》游戏功能全方位测试
echo ===============================
echo.
echo 此工具将执行以下测试:
echo  - 文件系统测试 (目录结构和必要文件)
echo  - 代码质量测试 (配置文件和依赖项)
echo  - 核心模块测试 (模块导入和功能)
echo.
echo 测试结果将保存到test目录下
echo.
echo [1] 开始测试
echo [0] 取消
echo.

set /p choice=请选择(1/0):
if not "%choice%"=="1" goto :cancel

echo.
echo 开始执行测试...
echo.

node "%~dp0\diagnose.js"
goto :end

:cancel
echo.
echo 已取消测试。
goto :end

:end
echo.
pause 