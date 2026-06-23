@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   Levantamiento de la Interfaz Web - Mundial ML
echo ===================================================

:: Verificar si Node.js esta instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Node.js/NPM no esta instalado en este sistema.
    echo Node.js es requerido para ejecutar la aplicacion web localmente.
    echo.
    echo Deseas instalar Node.js automaticamente ahora mismo usando winget? (S/N)
    set /p install_node=
    if /i "!install_node!"=="S" (
        echo [INFO] Iniciando instalacion de Node.js via winget...
        winget install OpenJS.NodeJS
        if !errorlevel! neq 0 (
            echo [ERROR] La instalacion via winget fallo.
            echo Por favor, descarga e instala Node.js manualmente desde:
            echo https://nodejs.org/
            pause
            exit /b 1
        )
        echo [OK] Instalacion completada. Por favor, REINICIA esta consola
        echo para que los cambios en las variables de entorno surtan efecto.
        pause
        exit /b 0
    ) else (
        echo [INFO] Levantamiento cancelado. Instala Node.js manualmente para continuar.
        pause
        exit /b 1
    )
)

:: Si esta instalado, instalar modulos y ejecutar
if not exist node_modules (
    echo [INFO] Carpeta node_modules no encontrada. Instalando dependencias de npm...
    call npm install
    if !errorlevel! neq 0 (
        echo [ERROR] Error al instalar dependencias con npm.
        pause
        exit /b 1
    )
)

echo [INFO] Iniciando servidor de desarrollo de Vite...
echo La aplicacion deberia abrirse automaticamente en tu navegador.
echo Si no lo hace, abre manualmente: http://localhost:5173
echo.
echo Presiona Ctrl+C en esta consola para detener el servidor.
echo.
call npm run dev -- --open
