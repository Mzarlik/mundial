@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   Ejecutando Predicciones - Mundial ML
echo ===================================================

:: Verificar si el entorno virtual existe, si no, ejecutar setup
if not exist .venv (
    echo [WARNING] No se encontro el entorno virtual .venv de Python.
    echo Ejecutando la inicializacion de Python primero...
    call setup_env.bat
)

:: Ejecutar predicciones de Python
echo [INFO] Ejecutando predict_matches.py para generar todas las predicciones y graficas...
call .venv\Scripts\python.exe predict_matches.py

echo ===================================================
echo   [OK] Graficas y predicciones actualizadas con exito.
echo   Para levantar la interfaz grafica, ejecuta: .\run_frontend.bat
echo ===================================================
