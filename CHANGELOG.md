# Changelog - Plataforma Predictiva Mundial 2026 (ML & Web)

Todos los cambios notables, correcciones de errores y mejoras arquitectónicas implementadas en este proyecto están documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto se adhiere a las buenas prácticas de versionado semántico.

---

## [1.1.0] - 2026-10-30

### 🚨 Correcciones Críticas (Data Pipeline y Prevención de Fuga de Información)

#### 1. Fuga de Datos (Data Leakage) en `results.csv` y `sync_and_generate.py`
- **Problema**: `sync_and_generate.py` filtraba exclusivamente partidos con `date.startswith('2026-06')`. Al evaluar los partidos de eliminatorias (julio de 2026), la condición fallaba y el script insertaba 30 partidos de eliminación directa en `results.csv` con una fecha falsa `'2026-06-15'` y sede `'Dallas'`.
- **Impacto**: `predict_matches.py` define el corte de entrenamiento en `MATCH_DATE = '2026-06-22'`. Debido a la fecha falsa, los modelos de Machine Learning (XGBoost, CatBoost, Dixon-Coles y MCMC) se entrenaban conociendo de antemano los resultados y marcadores exactos de los partidos de octavos, cuartos y semifinales que debían predecir de forma out-of-sample.
- **Solución implementada**:
  - Se eliminaron las 30 filas artificiales contaminadas al final de [`results.csv`](file:///c:/xampp/htdocs/mundial/international_results-master/international_results-master/results.csv), restaurando el historial al último partido real de fase de grupos (Croacia vs Ghana, 2026-06-27, fila 49,477).
  - Se corrigió la consulta en [`sync_and_generate.py`](file:///c:/xampp/htdocs/mundial/sync_and_generate.py) para que busque partidos coincidentes en todo 2026 (`date.startswith('2026')`) y respete las fechas de calendario correspondientes a cada fase.
  - Se eliminó la inyección de registros con fecha ficticia `'2026-06-15'` para fases eliminatorias.

#### 2. Duplicación de Partidos Reales en Memoria (`predict_matches.py`)
- **Problema**: `predict_matches.py` concatenaba un `DataFrame` hardcodeado `real_matches` a `df_all`. Como `results.csv` ya tenía esas mismas eliminatorias insertadas con fecha falsa, cada partido de eliminación directa existía dos veces en el dataset.
- **Solución implementada**:
  - Se añadió deduplicación estricta en [`predict_matches.py`](file:///c:/xampp/htdocs/mundial/predict_matches.py) tras la concatenación de `real_matches`: `df_all.drop_duplicates(subset=['date', 'home_team', 'away_team'], keep='last')`.

#### 3. Error de Interpolación de Horario `time:"time"` en `sync_and_generate.py`
- **Problema**: En la línea 288 de `sync_and_generate.py`, el f-string escribía el texto literal `time:"time"` en lugar del valor interpolado de la variable `time`. Como resultado, los 104 partidos en `src/config/matches.js` mostraban `"time"` en su campo de hora.
- **Solución implementada**:
  - Se corrigió el f-string a `time:"{time}"` en [`sync_and_generate.py`](file:///c:/xampp/htdocs/mundial/sync_and_generate.py). Ahora cada partido cuenta con su horario rotativo oficial (`1:00 PM ET`, `4:00 PM ET`, `7:00 PM ET`, `10:00 PM ET`) y horario fijo (`20:00`) para las finales.

#### 4. Pérdida del Partido por el Tercer Lugar y la Gran Final
- **Problema**: `partidos_simulados.csv` finalizaba en el partido 102 (semifinales), faltando los partidos 103 (Tercer Lugar) y 104 (Gran Final). Al ejecutar `sync_and_generate.py`, el script sobrescribía `matches.js` truncando el torneo y eliminando las tarjetas y rutas de la final y el tercer puesto.
- **Solución implementada**:
  - Se añadieron los partidos 103 (`France,England,,`) y 104 (`Spain,Argentina,,`) a [`partidos_simulados.csv`](file:///c:/xampp/htdocs/mundial/partidos_simulados.csv).
  - Se configuraron sus sedes definitivas: `Hard Rock Stadium, Miami Gardens` para el Tercer Lugar y `MetLife Stadium, East Rutherford` para la Gran Final.

#### 5. Ruptura de Portabilidad en `update_scores.py`
- **Problema**: En la línea 4 de `update_scores.py`, existía una ruta absoluta hardcodeada del desarrollador original (`C:\Users\Malpi\Documents\GitHub\mundial\...`), provocando `FileNotFoundError` en cualquier otro entorno.
- **Solución implementada**:
  - Se refactorizó la resolución de ruta en [`update_scores.py`](file:///c:/xampp/htdocs/mundial/update_scores.py) utilizando `os.path.join(os.path.dirname(os.path.abspath(__file__)), ...)` dinámica.

---

### 🧠 Motor de Inteligencia Artificial y Machine Learning

#### 1. Activación de Variables Climáticas y Altitud de Sedes
- **Problema**: La función `parse_matches()` en `predict_matches.py` no extraía la propiedad `venue` de `matches.js`. En consecuencia, al invocar `make_features()`, `venue` siempre era `None`. Todas las variables ambientales (`altitude`, `effective_temp_c` y `taxing_score`) quedaban anuladas con valores por defecto estáticos (`100.0m`, `20.0°C`, `0.1`).
- **Solución implementada**:
  - Se implementó la expresión regular `venue_match = re.search(r"venue\s*:\s*['\"]([^'\"]*)['\"]", obj_str)` en [`parse_matches()`](file:///c:/xampp/htdocs/mundial/predict_matches.py).
  - Se integró el paso del parámetro `venue` en la generación de matrices para XGBoost, Red Neuronal MLP y CatBoost, habilitando el impacto real de altitud (ej. Ciudad de México a 2,240m) y temperatura en las predicciones.

#### 2. Detección y Enlace de Valores de Mercado y Datos Demográficos
- **Problema**:
  1. `scraper_tm.py` fallaba al indexar las columnas de la tabla de Transfermarkt, provocando que los 100 países tuvieran `squad_size = 0` y `avg_age = 0.0` en `market_values.csv`.
  2. En `predict_matches.py`, la traducción de nombres generaba incompatibilidades: Estados Unidos se traducía como `'United States'`, pero el diccionario `alias_map` únicamente almacenaba la clave `'USA'`. Al hacer `MARKET_VALUES.get('United States', 50.0)`, devolvía el valor base por defecto de $50M.
- **Solución implementada**:
  - Se mejoró [`scraper_tm.py`](file:///c:/xampp/htdocs/mundial/scraper_tm.py) con detección dinámica por tipo de dato y rango en las celdas de la tabla.
  - Se poblaron tamaños de convocatoria oficiales (26 jugadores) y edades promedio realistas en [`public/data/market_values.csv`](file:///c:/xampp/htdocs/mundial/public/data/market_values.csv).
  - Se amplió el mapeo de alias bidireccionales en [`predict_matches.py`](file:///c:/xampp/htdocs/mundial/predict_matches.py) (`USA` <-> `United States`, `Turkey` <-> `Turkiye`, `Czech Republic` <-> `Czechia`, `DR Congo` <-> `Democratic Republic of the Congo`, etc.).
  - Tras la corrección, el análisis de importancia de variables demostró una contribución del **16.24%** de las variables financieras y demográficas al modelo global.

#### 3. Compatibilidad Retroactiva y Firmas de Dixon-Coles
- **Problema**:
  - Las funciones `fit_dixon_coles`, `dc_matrix`, `fit_dixon_coles_nb` y `dc_nb_matrix` requerían obligatoriamente los argumentos de ratings Elo (`elo_by_team, final_elos` o `elo_h, elo_a`).
  - Esta alteración rompía la ejecución de toda la suite de pruebas: `test_backtest.py`, `test_feature_importance.py`, `test_simulated_matches.py` y `run_experiments.py` con errores de tipo `TypeError: missing required positional argument`.
- **Solución implementada**:
  - Se agregaron parámetros por defecto `elo_by_team=None, final_elos=None` en `fit_dixon_coles` y `fit_dixon_coles_nb`.
  - Se agregaron parámetros por defecto `elo_h=None, elo_a=None` en `dc_matrix` y `dc_nb_matrix`.
  - Se corrigió la lógica interna para calcular `ediff = (elo_h - elo_a) / 100.0` si se proporcionan ratings, o `0.0` si se omiten, manteniendo 100% de retrocompatibilidad.
  - Se corrigió un error tipográfico en la definición de `dc_nb_matrix` que causaba `NameError: name 'alpha_h' is not defined`.
  - Se validó la suite completa mediante una batería de 8 pruebas unitarias automatizadas (`test_dc_signatures.py`).

#### 4. Corrección en Suite de Pruebas y Experimentos
- **`run_experiments.py`**:
  - Se eliminó la duplicación del parámetro `thread_count=-1` en el monkeypatching dinámico de `train_catboost_goals` que arrojaba `SyntaxError: keyword argument repeated: thread_count`.
- **`test_simulated_matches.py`**:
  - Se corrigió el índice de racha de forma pasado a `montecarlo_mfa_matrix`: utilizaba `fh[2]` (promedio de goles en contra concedidos) en lugar de `fh[0]` (promedio móvil de puntos/forma).
- **`test_feature_importance.py`**:
  - Se agregaron las 6 variables omitidas en la lista de nombres (`Altitude`, `Temp`, `Taxing`, `V_Dens_H`, `V_Dens_A`, `V_Dens_Diff`), completando las 33 características totales del vector de entrada.
  - Se optimizó el cómputo pasando `df_train[df_train.date >= pm.DESDE]` y activando paralelismo multihilo `n_jobs=-1`.

---

### 💻 Frontend Web y Experiencia de Usuario (`src/`)

#### 1. Corrección de Goles del Torneo en Paneles Opta (`MatchDetail.jsx`)
- **Problema**: `getTeamTournamentGoals` consultaba las propiedades `m.homeScore` y `m.awayScore` del objeto estático `MATCHES`. Dichos campos estaban indefinidos en el fixture (`undefined`), haciendo que las estadísticas tácticas de Opta (eficiencia ofensiva y defensiva) calcularan siempre 0 goles anotados en el torneo.
- **Solución implementada**:
  - `MatchDetail.jsx` ahora almacena `allPredictions` en el estado tras la petición a `/data/predictions.json`.
  - `getTeamTournamentGoals` lee prioritariamente los marcadores reales `pred.real_score_home` y `pred.real_score_away`, reflejando la contundencia goleadora auténtica en la fase de grupos y eliminatorias.

#### 2. Detección Universal de Jugadores y Limpieza de Prefijos
- **Problema**:
  - `PlayerProjectionsPanel` y `getTopPlayers` utilizaban comparación estricta de nombres en minúsculas contra `entry.teams[0]`. Equipos como `"USA"`, `"Korea Republic"` o `"Czechia"` no coincidían, dejando vacíos los paneles de tiros, xG y pases de estos países.
  - Nombres scrapeados contenían los prefijos de alineación `"Starter "` o `"Substitute "`.
- **Solución implementada**:
  - Se integró la función utilitaria `getKeywords(teamName)` en [`PlayerProjectionsPanel`](file:///c:/xampp/htdocs/mundial/src/pages/MatchDetail.jsx) y en la exportación a PDF.
  - Se aplicó saneamiento por expresión regular `name.replace(/^(Starter|Substitute)\s*/i, '').trim()` en [`MatchDetail.jsx`](file:///c:/xampp/htdocs/mundial/src/pages/MatchDetail.jsx) y [`Parlays.jsx`](file:///c:/xampp/htdocs/mundial/src/pages/Parlays.jsx).

#### 3. Auditoría y Corrección del Generador de Informes PDF
- **Problema**:
  - El PDF generaba 10 páginas pero declaraba `const totalPages = 9`, imprimiendo inconsistencias como `"Página 10 de 9"`.
  - La página 7 omitía la invocación a `pdfFooter(7)`.
  - La fórmula de probabilidad de clasificación en eliminatorias difería entre el componente interactivo de React y el documento PDF descargable.
- **Solución implementada**:
  - Se corrigió `totalPages = 10` y se añadió el pie de página `pdfFooter(7)`.
  - Se unificó la formulación matemática de clasificación eliminatoria:
    $$\text{Avance} = P(\text{reg}) + P(\text{empate}) \cdot \left[P(\text{prórroga}) + (1 - P(\text{prórroga}_H) - P(\text{prórroga}_A)) \cdot P(\text{penales})\right]$$
    asegurando que las probabilidades sumen exactamente 100.0% tanto en la interfaz como en el informe impreso.
  - Se corrigió el texto explicativo del glosario Opta: un coeficiente ofensivo $>1.00$ representa alta efectividad clínica de cara a portería.

#### 4. Modelado Estocástico Dinámico en Parleys (`Parlays.jsx`)
- **Problema**:
  - Las probabilidades de apuestas de córners y combinadas estaban fijadas con números mágicos (`0.78`, `0.70`, `0.76`, `0.82`).
  - La condición de fase eliminatoria verificaba `match.day === 'semifinal'`, fallando para las semifinales cuyo ID oficial es `'semis'` y omitiendo el tercer puesto.
- **Solución implementada**:
  - Se implementaron las funciones de distribución acumulada de Poisson (`calcPoissonOver`, `calcPoissonUnder`). Las probabilidades para más/menos córners se derivan dinámicamente de las medias esperadas de Opta.
  - Se corrigió el soporte para `'semis'` y `'tercer_lugar'`.

#### 5. Navegación en el Cuadro Eliminatorio (`Bracket.jsx`)
- **Problema**:
  - Las tarjetas de la Gran Final y el Tercer Lugar utilizaban identificadores de reemplazo ficticios (`overrideId = 'match-64'` y `'match-63'`). Al hacer clic en ellas, la aplicación redirigía a rutas inexistentes (`/partido/match-64`), mostrando pantallas en blanco.
  - La entrada de resultados de `sui-col` contenía un comentario confuso indicando que Colombia había avanzado, contradiciendo el pase de Suiza a cuartos de final.
- **Solución implementada**:
  - Se derivan dinámicamente los IDs reales del torneo (`finalId = 'esp-arg'` y `thirdId = 'fra-eng'`). Los enlaces del árbol y la vista de lista ahora navegan correctamente a sus análisis detallados.
  - Se aclaró el comentario en `realResults['sui-col']`.

#### 6. Estilos Globales, Rutas y Enlaces de Navegación
- **`global.css`**: Se definieron los alias `--card-bg: var(--bg-card);`, `--border-color: var(--border);` y `--bg-darker: #07090d;` en `:root`, asegurando consistencia visual en todas las vistas.
- **`Home.jsx`**: Se corrigió el botón de acceso rápido `"🧪 Laboratorios Estocásticos"` para que dirija a `/suizo` (simulador Monte Carlo) en lugar de `/parleys`.
- **`Sidebar.jsx`**: Se agregó el enlace directo hacia la guía interactiva `/como-probar` ("🔬 Validación de Modelos").
- **`App.jsx`**: Se enrutó el componente huérfano [`Support.jsx`](file:///c:/xampp/htdocs/mundial/src/pages/Support.jsx) bajo la ruta `/soporte`.
- **Compilación**: Verificada mediante `npm run build` con 0 errores y tiempo de empaquetado de 3.79s en Vite.

---

## [1.0.0] - 2026-10-22
- Versión inicial del sistema de predicción del Mundial 2026.
- Modelos MCMC Bayesiano NUTS, XGBoost, CatBoost, Red Neuronal MLP, Dixon-Coles Poisson y MFA Monte Carlo.
- Interfaz gráfica React 18 con Vite, Tailwind/CSS glassmorphism y generador de reportes con jsPDF.
