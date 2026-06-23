@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   Iniciando Proyecto Completo - Mundial ML
echo ===================================================

:: Verificar si el entorno virtual existe, si no, ejecutar setup
if not exist .venv (
    echo [WARNING] No se encontro el entorno virtual .venv de Python.
    echo Ejecutando la inicializacion de Python primero...
    call setup_env.bat
    if !errorlevel! neq 0 (
        echo [ERROR] No se pudo preparar el entorno de Python.
        pause
        exit /b 1
    )
)

:: Ejecutar predicciones de Python
echo [INFO] Ejecutando predict_matches.py para generar todas las predicciones y graficas...
call .venv\Scripts\python.exe predict_matches.py
if %errorlevel% neq 0 (
    echo [ERROR] Ocurrio un error al ejecutar predict_matches.py.
    echo Deseas continuar de todos modos con el levantamiento de la interfaz? (S/N)
    set /p continue_web=
    if /i "!continue_web!" neq "S" (
        exit /b 1
    )
)

:: Ejecutar frontend
echo.
echo [INFO] Iniciando el levantamiento de la interfaz web...
call run_frontend.bat
