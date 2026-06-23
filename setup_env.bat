@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   Inicializacion del Entorno Python - Mundial ML
echo ===================================================

:: Verificar si Python esta instalado
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python no esta instalado o no se encuentra en el PATH.
    echo Por favor, instala Python 3.9 o superior y agregalo al PATH.
    echo Descarga: https://www.python.org/downloads/
    pause
    exit /b 1
)

:: Crear entorno virtual si no existe
if not exist .venv (
    echo [INFO] Creando entorno virtual .venv...
    python -m venv .venv
    if !errorlevel! neq 0 (
        echo [ERROR] No se pudo crear el entorno virtual.
        pause
        exit /b 1
    )
    echo [INFO] Entorno virtual creado exitosamente.
) else (
    echo [INFO] El entorno virtual .venv ya existe.
)

:: Activar entorno virtual e instalar dependencias
echo [INFO] Activando entorno virtual e instalando dependencias...
call .venv\Scripts\activate.bat

echo [INFO] Actualizando pip...
python -m pip install --upgrade pip

echo [INFO] Instalando librerias desde requirements.txt...
python -m pip install -r requirements.txt
if !errorlevel! neq 0 (
    echo [ERROR] Ocurrio un error al instalar las dependencias.
    pause
    exit /b 1
)

echo ===================================================
echo   [OK] Entorno preparado correctamente.
echo   Puedes ejecutar "predict_matches.py"
echo   usando: .venv\Scripts\python.exe predict_matches.py
echo ===================================================
pause
