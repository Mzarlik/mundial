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
    echo --- PASOS PARA INSTALAR NODE.JS:
    echo 1. Abre PowerShell como Administrador y ejecuta:
    echo    winget install OpenJS.NodeJS
    echo 2. O descargalo desde el sitio oficial:
    echo    https://nodejs.org/
    echo.
    echo --- IMPORTANTE: Una vez instalado, debes CERRAR esta consola y
    echo     abrir una nueva para que los comandos "node" y "npm" funcionen.
    echo ===================================================
    exit /b 1
)

:: Si esta instalado, verificar si las dependencias estan completas
set install_needed=0
if not exist node_modules (
    set install_needed=1
) else if not exist node_modules\vite (
    set install_needed=1
)

if !install_needed! equ 1 (
    echo [INFO] Dependencias incompletas o no encontradas. Ejecutando npm install...
    call npm install
    if !errorlevel! neq 0 (
        echo [ERROR] Error al instalar dependencias con npm.
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
