# 🏆 Simulación Montecarlo y Analítica Avanzada — Mundial de Fútbol 2026

Este proyecto implementa un potente **modelo de simulación estadística de Montecarlo (10,000 iteraciones)** en Python para predecir los resultados y probabilidades de éxito en el próximo **Mundial de Fútbol 2026** (adaptado al nuevo formato oficial de **48 selecciones**), integrado con un ecosistema completo de **Machine Learning para auditoría predictiva y análisis de sensibilidad**.

---

## 📊 Metodología Estructural del Modelo

El simulador emplea un **enfoque predictivo híbrido** multivariable de tres niveles para determinar los resultados de cada encuentro:

1. **Motor Estadístico (Distribución de Poisson):** Calcula los goles esperados ($\lambda$) de cada partido cruzando la fuerza teórica de los rivales.
2. **Ponderación por Consenso de Mercado (Casas de Apuestas):** Integra una variable derivada que mapea las cuotas y probabilidades implícitas del mercado. Actúa como un estabilizador matemático, calibrando el modelo frente a sesgos históricos y ajustando las expectativas reales del entorno competitivo.
3. **Potencial Efectivo Dinámico:** La fuerza base de cada selección (derivada del ecosistema *Elo Ratings*) se ajusta celda a celda mediante tres variables operacionales:
   - **Racha Reciente:** Factor de forma competitivo derivado de los resultados de los últimos partidos.
   - **Modificador Subjetivo:** Multiplicador directo de rendimiento (ej. efecto localía o dinámicas internas).
   - **Penalización por Bajas:** Reductor por problemas médicos o ausencias de estrellas.

### ⚙️ Ingeniería Reglamentaria de la FIFA
El script replica con exactitud matemática el reglamento oficial de la FIFA para el torneo de 48 equipos:
- Procesa los 72 partidos de la Fase de Grupos.
- Construye la **Tabla de Comparación Global** para clasificar y rankear a los **8 mejores terceros**.
- Ejecuta el **Algoritmo de Asignación por Combinatoria (Anexo C del reglamento)** mediante recursividad para emparejar los Dieciseisavos de Final, evitando cruces inmediatos del mismo grupo.
- Simula todo el árbol de eliminación directa (incluyendo prórrogas y penaltis por probabilidad relativa).

---

## 🧠 Post-Procesamiento y Machine Learning (Auditoría del Modelo)

Una vez generada la matriz de 10,000 mundiales simulados, el cuaderno ejecuta una fase de analítica avanzada para validar la robustez del modelo y entender las fuerzas ocultas que determinan el éxito:

### 1. Análisis de Regresión No Lineal (Random Forest)
Para auditar cómo impactan las variables de entrada en el resultado final, se entrena un meta-modelo de **Random Forest Regressor**. Al capturar relaciones complejas y no lineales, este modelo explica la varianza de las simulaciones y calcula el peso exacto (importancia de características) de cada factor predictivo (Fuerza ELO, Cuotas de Apuestas, Racha, Bajas) sobre el avance de las selecciones.

### 2. Análisis de Sensibilidad (Gráfico de Tornado)
Se implementa un análisis de sensibilidad visualizado mediante un **Gráfico de Tornado**. Este permite aislar las variables clave y medir cómo las oscilaciones extremas en los parámetros de entrada (por ejemplo, una plaga de bajas de última hora o un desplome en las cuotas de apuestas) alteran drásticamente las probabilidades finales de campeonar.

### 3. Detección de Anomalías (Isolation Forest)
Utilizando el algoritmo **Isolation Forest**, el script analiza la estructura de los 10,000 torneos simulados en busca de "Mundiales anómalos" o *outliers* estadísticos. Esto identifica escenarios donde se rompe la lógica común del modelo (ej. finales inesperadas entre selecciones de bajo ranking, o eliminaciones masivas de favoritos en fase

---

## 🛠️ Tecnologías y Dependencias

El proyecto está desarrollado completamente en un entorno de **Jupyter Notebook** utilizando Python 3 y las siguientes librerías de ciencia de datos:
- **Pandas & NumPy:** Orquestación de matrices, DataFrames estadísticos y muestreos aleatorios para el motor de Montecarlo.
- **Scikit-Learn (Sklearn):** Engine central de Machine Learning utilizado para la auditoría predictiva (`RandomForestRegressor`), el análisis de outliers (`IsolationForest`) y la segmentación competitiva (`KMeans`).
- **BeautifulSoup4 & Requests:** Web scraping estratégico para la extracción y actualización automatizada en tiempo real de los datos de fuerza competitiva base (ELO).
- **Matplotlib & Seaborn:** Renderizado de gráficos de barras, diagramas de tornado para análisis de sens


---

## 🚀 Resultados Destacados (10k Simulaciones)

Tras procesar 10,000 torneos hipotéticos cruzando Poisson con las probabilidades implícitas de las casas de apuestas, el modelo arroja las siguientes probabilidades base para el pelotón de favoritos:
- **Portugal:** ~31.49% de probabilidad de campeonato.
- **España:** ~27.17% de probabilidad de campeonato.
- **Francia:** ~20.29% de probabilidad de campeonato.
- **Alemania:** ~7.09% de probabilidad de campeonato.

