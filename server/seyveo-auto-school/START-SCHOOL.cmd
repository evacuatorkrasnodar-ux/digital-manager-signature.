@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title SEYVEO - Автошкола Сэйви
echo.
echo ===========================================
echo    SEYVEO - АВТОШКОЛА СЭЙВИ
echo ===========================================
echo.
echo Это отдельная локальная учебная лаборатория.
echo Она не меняет голос, приложение или веса моделей.
echo Личные переписки не используются.
echo.
where node >nul 2>nul
if errorlevel 1 (
 echo ОШИБКА: Node.js не найден.
 goto :end
)
where ollama >nul 2>nul
if errorlevel 1 (
 echo ОШИБКА: Ollama не найдена.
 goto :end
)
echo Проверяю наличие учебных моделей...
node "%~dp0run.mjs" --check
if errorlevel 1 (
 echo.
 echo Учебные модели отсутствуют или Ollama не запущена.
 echo Проверь окно выше. Для учителя обычно нужна команда:
 echo ollama pull qwen3:8b
 echo.
 echo Модель qwen3:8b будет требовать ресурсы ПК.
 goto :end
)
echo.
echo Запускаю 8 учебных экзаменов. Работает только локально.
echo При появлении ошибок пришли снимок этого окна.
node "%~dp0run.mjs" --count=8
if errorlevel 1 (
 echo.
 echo Не удалось завершить сессию. Старые результаты сохранены.
) else (
 echo.
 echo Дневник: %%LOCALAPPDATA%%\SEYVEO\auto-school\last-session.html
 start "" "%LOCALAPPDATA%\SEYVEO\auto-school\last-session.html"
)
:end
echo.
pause
endlocal
