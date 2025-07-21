@echo off
chcp 65001 >nul
title 《买房记》测试报告服务器

echo ===============================
echo    《买房记》测试报告服务器
echo ===============================
echo.
echo 此工具将启动一个本地Web服务器，用于在浏览器中查看测试报告。
echo 服务器启动后，请在浏览器中访问 http://localhost:3000
echo.
echo [1] 启动服务器
echo [0] 取消
echo.

set /p choice=请选择(1/0):
if not "%choice%"=="1" goto :cancel

echo.
echo 正在启动服务器...
echo.

start http://localhost:3000
node "%~dp0\serve-test.js"
goto :end

:cancel
echo.
echo 已取消操作。
goto :end

:end 