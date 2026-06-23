# Documentación: Automatización de Predicciones del Mundial

Este módulo automatiza la carga de datos históricos de partidos internacionales de fútbol, el ajuste de modelos predictivos y la generación de gráficos estadísticos para los partidos del Mundial 2026 definidos en la interfaz.

---

## Estructura de Archivos Locales

El proyecto utiliza un conjunto de datos local que se encuentra en la carpeta:
`international_results-master/international_results-master/`

Los archivos principales de datos consumidos son:
- **`results.csv`**: Resultados de más de 49,000 partidos internacionales masculinos oficiales desde 1872 hasta finales de 2024. Contiene información clave como la fecha, los equipos, los marcadores, el tipo de torneo, la ciudad, el país y si se jugó en cancha neutral.

---

## Requisitos Previos

1. **Python 3.9 o superior** (para ejecutar los modelos predictivos de Machine Learning).
   * *Asegúrate de marcar la casilla **"Add Python to PATH"** durante su instalación.*
2. **Node.js 18 o superior** (para levantar la interfaz de usuario web desarrollada en React + Vite).
   * *Puedes instalarlo manualmente desde [nodejs.org](https://nodejs.org/) o de forma automática mediante comandos (ver sección de levantamiento).*

---

## Ejecución en Un Solo Clic (Recomendado)

Hemos creado un script unificado que inicializa el entorno de Python, ejecuta los modelos predictivos, genera todas las gráficas y luego levanta la aplicación React abriéndola en tu navegador automáticamente:

* **Opción A (Doble Clic - La más fácil)**:
  Simplemente busca el archivo `run_all.bat` en tu explorador de archivos de Windows y dale doble clic.
* **Opción B (Desde Terminal / Consola)**:
  - Si usas **PowerShell** (la terminal azul por defecto en VS Code / Windows), debes anteponer `.\` para ejecutar archivos locales:
    ```powershell
    .\run_all.bat
    ```
  - Si usas el **Símbolo del Sistema (CMD)** clásico:
    ```cmd
    run_all.bat
    ```

---

## Inicialización y Ejecución por Pasos (Manual)

Si deseas tener un control detallado de cada parte del proceso, puedes ejecutar los scripts por separado:

### Paso 1: Preparar Entorno e Ingesta de Datos (Python)
1. Ejecuta el archivo de inicialización de Python para configurar el entorno virtual e instalar las librerías:
   * **En PowerShell**: `.\setup_env.bat`
   * **En CMD**: `setup_env.bat`
2. Ejecuta el script de predicción para entrenar los modelos Dixon-Coles, MCMC Bayesiano y XGBoost y generar todas las gráficas estadísticas:
   * **En PowerShell**: `.\.venv\Scripts\python.exe predict_matches.py`
   * **En CMD**: `.venv\Scripts\python.exe predict_matches.py`
   * *Si deseas activar el entorno virtual manualmente en PowerShell, debes usar `.\.venv\Scripts\Activate.ps1`. Si Windows te da un error de seguridad, ejecuta primero `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process` en tu consola para permitir scripts temporales.*
   *Las gráficas generadas se guardarán directamente en `public/graphs/`.*

### Paso 2: Levantar la Interfaz Gráfica (React)
1. Ejecuta el script de levantamiento del frontend:
   * **En PowerShell**: `.\run_frontend.bat`
   * **En CMD**: `run_frontend.bat`
   *Si no tienes Node.js instalado, el script te ofrecerá instalarlo automáticamente mediante `winget install OpenJS.NodeJS`. Tras instalarlo, deberás reiniciar tu consola.*
   *El script instalará las dependencias web (`npm install` si no existen) y ejecutará el servidor de desarrollo en la dirección: `http://localhost:5173/`.*

---

## Despliegue en Servidores Web (ej. Apache en XAMPP)

Debido a que este proyecto está desarrollado sobre React y Vite, el navegador no puede interpretar los archivos `.jsx` directamente si los sirves estáticamente a través de Apache sin procesar. Si prefieres utilizar el servidor Apache de XAMPP en lugar del dev-server de Vite, sigue estos pasos:

1. Instala las dependencias y construye el paquete de distribución estática:
   ```bash
   npm install
   npm run build
   ```
2. Copia todo el contenido de la carpeta de salida generada llamada `dist/` (que incluye el `index.html` compilado, carpetas `assets`, `graphs`, `images`, etc.) y pégalo directamente en la raíz de tu carpeta de XAMPP (por ejemplo, en `c:\xampp\htdocs\mundial\`).
3. Inicia Apache en el panel de control de XAMPP y abre en tu navegador:
   `http://localhost/mundial/`

---

## Explicación de los Gráficos Generados

Por cada partido, se actualizan automáticamente 4 archivos de imagen dentro de las subcarpetas del día correspondiente (`public/graphs/jun22/` a `public/graphs/jun27/`):

1. **`[id]_mcmc.png`**: Predicción de simulación estocástica MCMC Bayesiano con PyMC. Incluye el mapa de calor de probabilidad del marcador exacto, probabilidades del resultado y el Top 10 de marcadores.
2. **`[id]_xgboost.png`** (o `_xgb.png`): Predicción por XGBoost empleando como características los ratings **ELO históricos** de los equipos y rachas de forma.
3. **`[id]_resumen.png`**: Gráfico resumen visible en la parte superior del detalle del partido que compara de forma directa el porcentaje de Gana/Empata/Pierde asignado por Dixon-Coles, MCMC y XGBoost.
4. **`[id]_accuracy.png`**: Gráfica de control que mide y muestra el acierto real y error (RPS) de los tres modelos evaluados sobre 914 partidos históricos no vistos.

---

## Consideraciones Estadísticas

> [!WARNING]
> El fútbol posee una **aleatoriedad irreducible**. Ningún modelo estadístico o de Machine Learning puede predecir con absoluta certeza un resultado debido a variables no medibles (tarjetas rojas, fallos arbitrales, lesiones de último minuto, estado anímico).
> Estos modelos alcanzan una precisión típica del **55-60%** en la predicción del resultado (1X2) y menos del **20%** en el marcador exacto. Utiliza esta herramienta con fines estrictamente académicos.
