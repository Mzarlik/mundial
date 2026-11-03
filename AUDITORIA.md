# Auditoría del Proyecto — Mundial ML 2026

> Fecha de la auditoría: 2026-10-31
> Rama auditada: `main` (commit `b1a8f70`)
> Alcance: estructura del repositorio, pipeline de datos/ML en Python, frontend React/Vite, scripts auxiliares, dependencias, seguridad y documentación.

## Resumen ejecutivo

El proyecto funciona de punta a punta (el pipeline genera predicciones y el frontend compila sin errores), pero **las métricas de precisión que muestra no son fiables** y hay **un dato histórico corrompido** en el dataset.

| Severidad | Hallazgos |
|---|---|
| 🔴 Crítico | 4 |
| 🟠 Alto | 11 |
| 🟡 Medio | 17 |
| ⚪ Bajo | 5 grupos |

**Lo más importante:**

1. **Métricas infladas** (C-1): el ensemble, el stacking y la calibración se ajustan y evalúan sobre los mismos ~26 partidos. Los porcentajes de acierto de la UI y de las gráficas son *in-sample*.
2. **Fugas de información** (C-2, C-3): los modificadores Opta usan los goles reales de los partidos que luego se "predicen", y las jornadas 1–2 se predicen con modelos entrenados con su propio resultado.
3. **Dato corrompido en `results.csv`** (C-4): `sync_and_generate.py` sobrescribió el amistoso EE. UU. vs Bélgica del 2026-03-28 (2–5) con el marcador del octavos (1–4). Verificado en el historial de git.
4. **Servidor local inseguro** (A-10): `server_opta.py` acepta peticiones de cualquier web o equipo de la red, navega a cualquier URL y permite escribir archivos `.html` fuera de su carpeta.
5. **Features que no hacen lo que dicen** (A-1, A-2, A-3, A-6): clima y altitud constantes en entrenamiento, sedes asignadas por rotación (no reales), "Levi's Stadium" mal parseado y ventaja de anfitrión 2026 aplicada a Mundiales pasados.

El plan de acción priorizado está en la [sección 9](#9-plan-de-acción-priorizado).

### Metodología

- Lectura completa de los scripts Python, `src/` y la documentación.
- Verificaciones ejecutadas: reproducción del parseo de `venue`; comportamiento de `StandardScaler` en el `.venv`; recuento de nombres de equipos en `results.csv`; comparación de `results.csv` entre commits; análisis AST de nombres no definidos en todos los `.py`; `vite build` a un directorio temporal; `npm audit`; análisis de tamaño de blobs del historial de git.
- **No se ejecutó** `predict_matches.py` completo (tarda varios minutos con PyMC y sobrescribe `public/`), ni se contactó ningún servicio externo, ni se modificó ningún archivo del proyecto salvo este documento.

---

## 1. Resumen del proyecto

Plataforma de predicción del Mundial 2026 compuesta por:

- **Backend de modelado (Python, scripts sueltos en la raíz)**: `predict_matches.py` (≈2.900 líneas) entrena Dixon-Coles, Dixon-Coles Binomial Negativa, MCMC Bayesiano (PyMC), XGBoost, MLP, CatBoost y un Monte Carlo "MFA", y combina todo en un ensemble. Genera `public/data/predictions.json` y gráficas en `public/graphs/`.
- **Simuladores**: `simulate_knockout.py`, `simulate_knockout_100k.py`, `simulate_swiss.py` → JSON en `public/`.
- **Scrapers / ingesta**: `scraper_tm.py` (Transfermarkt), `scraper_stadiums.py`, `scrape_opta_stealth.py` + `parse_opta_html.py` (Opta), `server_opta.py`, `sync_and_generate.py`, `update_scores.py`.
- **Validación / experimentos**: `test_backtest.py`, `test_feature_importance.py`, `test_simulated_matches.py`, `run_experiments.py`.
- **Frontend (React 18 + Vite + react-router + jsPDF)** en `src/`, que lee los JSON de `public/`.
- **Datos**: `international_results-master/` (dataset histórico de resultados), `opta_html/` (HTML guardado de Opta), `public/data/`.

### Tamaño

| Área | Archivos versionados |
|---|---|
| `graphify-out/` (caché de herramienta) | 1.873 |
| `opta_html/` | 119 |
| `src/` | 17 |
| Scripts Python en raíz | 15 |
| Total | 2.063 |

---

## 2. Escala de severidad

| Nivel | Significado |
|---|---|
| 🔴 **Crítico** | Invalida resultados, métricas publicadas o rompe el sistema en un clon limpio. |
| 🟠 **Alto** | Bug real con impacto visible en predicciones o en la UI. |
| 🟡 **Medio** | Inconsistencia, deuda técnica o riesgo que conviene corregir. |
| ⚪ **Bajo** | Higiene, estilo, mejoras menores. |

Cada hallazgo indica archivo y línea (`archivo:línea`) y, cuando aplica, cómo se verificó.

---

## 3. Motor de predicción — `predict_matches.py`

### 🔴 C-1. Las métricas del ensemble, stacking y calibración se ajustan y evalúan sobre los mismos partidos

- **Dónde**: [predict_matches.py:2256-2446](predict_matches.py:2256) (bucle de validación + SLSQP), [predict_matches.py:2448-2490](predict_matches.py:2448) (stacking), [predict_matches.py:2510-2528](predict_matches.py:2510) (isotónica).
- **Qué pasa**: el conjunto de "validación" son los ~26 partidos de eliminatorias de `real_matches`. Sobre esos mismos 26 partidos:
  1. Se optimizan los 7 pesos del ensemble (SLSQP) y luego se reporta el acierto del ensemble con esos pesos (`opt_hits`). El comentario `# --- CORRECCIÓN CRÍTICA ---` sobrescribe `res['Ensemble']` "para que las gráficas y el frontend muestren el verdadero poder del modelo".
  2. Se entrena el meta-learner (`LogisticRegression`) y se evalúa con `meta_learner.predict(X_stack_s)` sobre el mismo `X_stack_s`.
  3. Se ajusta una regresión isotónica por clase para XGBoost y se evalúa sobre los mismos datos.
- **Impacto**: las cifras de accuracy/RPS de "Ensemble", "Stacking" y "XGBoost calibrado" que aparecen en las gráficas `*_accuracy.png` y en la UI son **in-sample** y están sobreestimadas. Con n≈26 y 7+ parámetros, el sobreajuste es casi seguro. Además, la isotónica ajustada a 26 puntos se aplica luego a las 104 predicciones ([predict_matches.py:2658](predict_matches.py:2658)).
- **Recomendación**: separar *fit* y *eval* (leave-one-out o validación temporal: pesos/meta-learner/calibrador entrenados con partidos anteriores y evaluados en posteriores). Con tan pocas muestras, preferir pesos fijos o regularización fuerte y reportar la incertidumbre.

### 🔴 C-2. Fuga de información (data leakage) a través de los modificadores Opta

- **Dónde**: `load_opta_modifiers` [predict_matches.py:90-219](predict_matches.py:90); se aplican en `dc_matrix` [predict_matches.py:616-626](predict_matches.py:616), `dc_nb_matrix` y en las priors del MCMC [predict_matches.py:797-812](predict_matches.py:797).
- **Qué pasa**: los multiplicadores de ataque/defensa se calculan como `goles reales / xG` usando **todos** los partidos con marcador de `partidos_simulados.csv` (incluye octavos, cuartos y semifinales) y los xG de `player_stats.json`. Después, esos multiplicadores se usan para "predecir" y validar esos mismos partidos de eliminatorias.
- **Impacto**: el modelo conoce indirectamente el resultado del partido que está evaluando. Contradice la corrección de fuga descrita en `CHANGELOG.md` v1.1.0, que solo resolvió la vía de `results.csv`.
- **Recomendación**: calcular los modificadores con corte temporal (solo partidos anteriores a la fecha del partido a predecir), o excluirlos del pipeline de validación.

### 🔴 C-3. Partidos de las jornadas 1 y 2 se "predicen" con modelos entrenados con su propio resultado

- **Dónde**: `MATCH_DATE = 2026-06-22` [predict_matches.py:225](predict_matches.py:225); los modelos globales se entrenan con `df_all.date < MATCH_DATE` [predict_matches.py:2125-2172](predict_matches.py:2125).
- **Qué pasa**: `results.csv` ya contiene los 72 partidos de fase de grupos (último: 2026-06-27). Las jornadas 1 y 2 (11–21 de junio) quedan **dentro** del set de entrenamiento de Dixon-Coles, DC-NB, MCMC, XGBoost, MLP y CatBoost, y luego se generan predicciones para esos mismos partidos.
- **Impacto**: las probabilidades mostradas para ~48 partidos de grupos no son predicciones *ex ante*. Si la UI las compara con el resultado real (`is_played`), el acierto aparente está inflado.
- **Recomendación**: entrenar un modelo por fecha de corte (al menos uno por jornada/fase) o etiquetar claramente esas predicciones como *in-sample*.

### 🟠 A-1. Las variables de clima/altitud no se usan en entrenamiento → sesgo entrenamiento/inferencia (y valores extremos en la MLP)

- **Dónde**: `build_dataset` llama a `make_features(...)` **sin** `venue` [predict_matches.py:1113](predict_matches.py:1113); en inferencia sí se pasa `venue` [predict_matches.py:2631-2665](predict_matches.py:2631).
- **Qué pasa**: en las ~6.000 filas de entrenamiento, `altitude=100`, `temp=20`, `taxing=0.1` son constantes. Los árboles (XGBoost/CatBoost) no pueden aprender nada de columnas constantes, así que la "activación de variables climáticas" del CHANGELOG no tiene efecto en ellos. En la MLP es peor: `StandardScaler` asigna `scale_=1` a columnas de varianza cero, por lo que en el Estadio Azteca la entrada estandarizada de altitud vale **2.140** (verificado con scikit-learn 1.9.0 del `.venv`), un valor fuera de distribución que solo `clip_lambda` disimula.
- **Recomendación**: o bien eliminar estas features, o construirlas también para el histórico (requiere sede/clima de partidos pasados). Como mínimo, no pasarlas a la MLP.

### 🟠 A-2. La sede "Levi's Stadium" se parsea como `"Levi"` → 6 partidos pierden datos de clima

- **Dónde**: regex `venue\s*:\s*['\"]([^'\"]*)['\"]` en `parse_matches` [predict_matches.py:307](predict_matches.py:307).
- **Qué pasa**: la clase `[^'\"]` corta en el apóstrofo. Verificado: `venue:"Levi's Stadium, Santa Clara"` → `'Levi'`. La clave no existe en `stadiums_climate.json`, así que esos 6 partidos usan los valores por defecto. El mismo patrón afecta a cualquier campo con comillas simples.
- **Recomendación**: usar una regex que respete la comilla de apertura (`(['"])(.*?)\1`) o, mejor, exportar los partidos también como JSON y dejar de parsear JS con regex.

### 🟠 A-3. La ventaja de "local" del Mundial 2026 se aplica a todos los Mundiales históricos

- **Dónde**: `get_neutral_venue_advantage` [predict_matches.py:504-522](predict_matches.py:504), usada al ajustar DC, DC-NB y MCMC con `row.tournament` del histórico.
- **Qué pasa**: la función devuelve +0,80 para México/EE. UU., +0,70 para Canadá, −0,10 para europeos/africanos, −0,20 para asiáticos… en **cualquier** partido neutral cuyo torneo contenga `"world cup"`. Eso incluye Rusia 2018, Catar 2022 y todas las eliminatorias (`"FIFA World Cup qualification"`). El modelo aprende el coeficiente `home` con una covariable mal especificada.
- **Extra**: la lista usa `'czechia'`, pero en `results.csv` el nombre es `Czech Republic` (verificado: 363 vs 0 apariciones), así que a Chequia nunca se le aplica el ajuste. Tampoco aparece `turkey`.
- **Recomendación**: limitar el ajuste a partidos de 2026 (por fecha/país sede) y normalizar nombres con un único diccionario.

### 🟠 A-4. Dos fuentes de verdad para los resultados reales, ya desincronizadas

- **Dónde**: `real_matches` hardcodeado [predict_matches.py:2055-2085](predict_matches.py:2055) vs `partidos_simulados.csv`.
- **Qué pasa**: el CSV tiene marcador para España–Bélgica, Noruega–Inglaterra, Argentina–Suiza e Inglaterra–Argentina; `real_matches` no. Además, `real_matches` fecha Francia–Marruecos el `2026-07-09`, mientras que `matches.js` lo fecha el `2026-07-10`. Resultado: esos partidos no entran en ELO/forma ni en la validación, pero sí en los modificadores Opta (ver C-2).
- **Recomendación**: un único archivo de resultados (p. ej. añadir filas a `results.csv` con su fecha real) y que todo lo demás se derive de él.

### 🟠 A-5. Valores de mercado actuales aplicados a partidos desde 2018 (anacronismo)

- **Dónde**: `make_features` [predict_matches.py:1063-1074](predict_matches.py:1063); `fit_mcmc` [predict_matches.py:848-852](predict_matches.py:848).
- **Qué pasa**: `market_values.csv` es una foto de 2026, pero se usa como feature para todos los partidos de entrenamiento desde 2018. Las selecciones que no están en el CSV reciben `0.0` (XGBoost/MLP/CatBoost) o `50.0` (MCMC), valores por defecto distintos entre modelos. En la práctica la feature codifica "está clasificado al Mundial 2026", lo que puede explicar el 16 % de importancia citado en el CHANGELOG.
- **Recomendación**: usar valores históricos por fecha, o limitar la feature a la inferencia con un modelo aparte.

### 🟡 M-1. La MLP ignora los pesos que se le calculan

- **Dónde**: `train_mlp_goals` [predict_matches.py:1150-1167](predict_matches.py:1150).
- **Qué pasa**: `main` calcula pesos temporales × balanceo de clases y los pasa como `sample_weight`, pero la función no los usa (el comentario dice que MLPRegressor no los soporta; en scikit-learn 1.9.0, la versión instalada, `fit` sí acepta `sample_weight`). El log "Entrenando Red Neuronal (MLP) global con sample_weights + class-balancing" es engañoso.

### 🟡 M-2. "Peso ×3 a los partidos reales del Mundial" se aplica a las últimas 25 filas, sean cuales sean

- **Dónde**: [predict_matches.py:2159-2165](predict_matches.py:2159) y [predict_matches.py:855-862](predict_matches.py:855).
- **Qué pasa**: se asume que las últimas 25 filas del dataset son partidos del Mundial. Con el corte del 22 de junio hay más de 25 partidos mundialistas y también amistosos en esas fechas, así que el refuerzo es arbitrario.
- **Recomendación**: aplicar el peso por `tournament == 'FIFA World Cup'` y por fecha.

### 🟡 M-3. Las gráficas de fase de grupos nunca se generan en un clon limpio

- **Dónde**: `skip_plotting = is_group_stage` [predict_matches.py:2774](predict_matches.py:2774); `public/graphs/` está en `.gitignore`.
- **Qué pasa**: el log dice "Gráficas ya existen… SKIPPED (Caché)", pero no se comprueba que existan. En un clon nuevo, los 72 partidos de grupos se quedan sin imágenes y la UI muestra huecos.
- **Recomendación**: omitir el render solo si el archivo existe (`os.path.exists`) o añadir un flag `--force-plots`.

### 🟡 M-4. Pesos "separados" 1X2/marcador que en realidad son idénticos

- **Dónde**: [predict_matches.py:2407-2418](predict_matches.py:2407).
- **Qué pasa**: `w_opt_1x2` y `w_opt_score` son copias del mismo vector, pero se imprimen como "Ponderación de Ensemble con Separación de Tareas".

### 🟡 M-5. Rendimiento: búsquedas O(n) en cada consulta de rating

- **Dónde**: `get_elo_at_date`, `get_pi_at_date`, `get_form_at_date`, `get_h2h_at_date` [predict_matches.py:407-490, 1016-1039](predict_matches.py:407).
- **Qué pasa**: cada llamada reconstruye `dates = [x[0] for x in history]` antes del `bisect`, lo que anula la ventaja del `bisect`. Se llaman con `DataFrame.apply` por fila sobre miles de partidos y varios modelos.
- **Recomendación**: precalcular la lista de fechas por equipo una sola vez (o usar `pd.merge_asof`).

### ⚪ B-1. Otros detalles en `predict_matches.py`

- Archivo monolítico de 2.904 líneas que mezcla carga de datos al importar (lee CSV/JSON a nivel de módulo), modelos, gráficas y exportación. Dificulta testear e importar desde otros scripts (los tests lo importan entero, PyMC incluido).
- `except Exception: pass` silencioso al cargar `market_values.csv` y `stadiums_climate.json` [predict_matches.py:73-84](predict_matches.py:73): si falla, todos los equipos quedan con valores por defecto sin aviso.
- `os._exit(0)` al final [predict_matches.py:2904](predict_matches.py:2904): el proceso siempre termina con código 0 y se salta el flush/cleanup normal; un CI no detectaría errores posteriores.
- Imports duplicados o tardíos (`matplotlib.patches` dos veces, `json`, `shutil`, `minimize`, `StandardScaler` y `pandas` reimportados dentro de funciones).
- `rps_opt_1x2` duplica `rps_1x2`.
- `is_played` se calcula dos veces con criterios distintos [predict_matches.py:2765](predict_matches.py:2765) y [predict_matches.py:2787](predict_matches.py:2787).
- Comentario "Bucle de predicción para los 32 partidos" cuando son 104.
- La forma reciente ignora el último partido: `form5` se calcula con `shift().rolling(5)` (los 5 partidos *anteriores* a cada fila) y `get_form_at_date` devuelve la fila del último partido previo a la fecha, así que el partido más reciente nunca entra en la racha. Es consistente entre entrenamiento e inferencia, pero desperdicia la información más fresca.
- K-factor ELO: `'world cup' in tournament` también da K=60 a las eliminatorias; no hay multiplicador por diferencia de goles. Es una decisión de diseño, pero conviene documentarla.
- `parse_matches` divide el bloque JS por `"},"`; funciona hoy por casualidad del formato (el objeto `graphs:{...}` queda en un fragmento sin `id:`). Cualquier cambio de formato lo rompe.

---

## 4. Pipeline de datos y scripts auxiliares

### 🔴 C-4. `sync_and_generate.py` corrompió un amistoso real en `results.csv` (verificado en git)

- **Dónde**: [sync_and_generate.py:118-132](sync_and_generate.py:118).
- **Qué pasa**: para "sincronizar" un marcador busca cualquier fila de 2026 con el mismo par de equipos (`date.startswith('2026')`), sin filtrar por torneo ni por fecha. El octavos **Estados Unidos 1–4 Bélgica** coincidió con el amistoso **Estados Unidos vs Bélgica del 2026-03-28**, y le sobrescribió el marcador.
- **Evidencia**: `git show 436e6fc:…/results.csv` → `2026-03-28,United States,Belgium,2.0,5.0,Friendly,…`; en `b1a8f70` (HEAD) → `…,1.0,4.0,Friendly,…`. El partido de octavos, a su vez, nunca se insertó.
- **Impacto**: dato histórico alterado que alimenta ELO, Pi-ratings, forma, H2H y todos los modelos. `update_scores.py` usa el mismo patrón de búsqueda y tiene el mismo riesgo.
- **Recomendación**: restaurar la fila (`2.0,5.0`) y hacer la búsqueda por `(fecha, local, visitante, tournament == 'FIFA World Cup')`. Nunca modificar el dataset original en el lugar: escribir los partidos del Mundial en un archivo aparte y concatenar al cargar.

### 🟠 A-6. Sedes y horarios inventados alimentan las features de clima

- **Dónde**: [sync_and_generate.py:266-276](sync_and_generate.py:266).
- **Qué pasa**: la sede y la hora de cada partido se asignan rotando listas (`VENUES[idx % 16]`, `TIMES[idx % 4]`), no según el calendario oficial. Ejemplo: el octavos EE. UU.–Bélgica figura en el **Estadio Azteca (2.240 m)**. El CHANGELOG lo describe como "horario rotativo oficial".
- **Impacto**: las variables de altitud/temperatura (ver A-1) y la información de sede mostrada en la UI no corresponden a la realidad.
- **Recomendación**: cargar el calendario real (sede, fecha y hora por partido) en `partidos_simulados.csv` o en un CSV de fixture.

### 🟠 A-7. `sync_and_generate.py` sigue insertando filas con fecha falsa

- **Dónde**: [sync_and_generate.py:133-148](sync_and_generate.py:133).
- **Qué pasa**: el CHANGELOG 1.1.0 dice que se eliminó la inyección con fecha ficticia, pero para la fase de grupos (`idx < 72`) se sigue insertando `date='2026-06-15'`, `city='Dallas'` si el partido no está en `results.csv`. También la fecha por defecto de grupos en `matches.js` es `2026-06-15` [sync_and_generate.py:202](sync_and_generate.py:202), y las de eliminatorias están hardcodeadas en diccionarios (los 4 cuartos el `2026-07-10`, las 2 semis el `2026-07-14`).
- **Recomendación**: si falta la fecha real, fallar con error explícito en lugar de inventarla.

### 🟠 A-8. `scraper_tm.py` falla con `NameError`: falta `import re`

- **Dónde**: [scraper_tm.py:109](scraper_tm.py:109) usa `re.match(...)`; el módulo no importa `re`.
- **Qué pasa**: el `try/except IndexError` no captura `NameError`, así que el scraper se cae en la primera fila con una columna no numérica. Detectado con un análisis AST de nombres no definidos sobre todos los `.py`. Contradice la corrección "detección dinámica por tipo de dato" del CHANGELOG; `market_values.csv` parece haberse completado a mano.
- **Extra**: `requests.get` sin `timeout` [scraper_tm.py:26](scraper_tm.py:26).

### 🟡 M-6. La parte de grupos de `sync_and_generate.py` depende del orden de filas del CSV

- **Dónde**: [sync_and_generate.py:194-200](sync_and_generate.py:194) y siguientes.
- **Qué pasa**: grupo, jornada y fase se deducen del índice de fila (`idx // 6`, `idx < 72`, `idx < 88`, …). Insertar, borrar o reordenar una fila desplaza silenciosamente grupos y fases de todos los partidos posteriores.
- **Recomendación**: añadir columnas explícitas `fase`, `grupo`, `fecha`, `sede` al CSV.

### 🟡 M-7. Diccionarios de nombres de selecciones duplicados y divergentes

Hay al menos **8 mapeos distintos** de nombres de equipos repartidos entre archivos: `SPANISH_TO_ENGLISH` y `alias_map`/`OPTA_TO_STANDARD_ENGLISH`/`TEAM_TO_ID_ABBR` en `predict_matches.py`; `CSV_TO_RESULTS`, `ENGLISH_TO_SPANISH`, `TEAM_TO_FLAG`, `TEAM_TO_ID_ABBR` en `sync_and_generate.py`; `RESULTS_TO_CSV` en los simuladores; además de `getKeywords` en el frontend. Ya hay divergencias reales (A-3: `czechia` vs `Czech Republic`). Recomendación: un único `teams.json` (código, nombre ES, nombre en `results.csv`, alias Opta/Transfermarkt, bandera) consumido por Python y por el frontend.

### 🟡 M-8. Simuladores duplicados con semántica distinta y sin semilla

- `simulate_knockout_100k.py` es una copia de `simulate_knockout.py` que solo cambia `ITERATIONS` y **no** fija los ganadores reales (`get_real_winner`). Las dos salidas (`knockout_probabilities.json` y `_100k.json`) responden a preguntas diferentes, y la UI las muestra juntas.
- Ningún simulador ni `predict_matches.py` fija semilla de `numpy` para las simulaciones Monte Carlo (prórroga, penales, Weibull): cada ejecución produce un `predictions.json` distinto.
- Recomendación: un solo script con parámetros (`--iterations`, `--respect-real-results`, `--seed`).

### 🟡 M-9. "Tests" que no son tests

- `test_backtest.py`, `test_feature_importance.py` y `test_simulated_matches.py` son scripts de experimentación: no contienen ningún `assert` ni se ejecutan con un runner. El CHANGELOG menciona una batería `test_dc_signatures.py` de 8 pruebas que **no existe** en el repositorio.
- Recomendación: renombrar estos scripts a `experiments/` y crear `tests/` con `pytest` (por ejemplo: firmas de Dixon-Coles, que `matrix_to_1x2` sume 1, `parse_matches` con apóstrofos, que la sincronización no toque amistosos).

### 🟡 M-10. Hiperparámetros "optimizados por Grid Search" que no salen del grid y se ajustan sobre el set de evaluación

- **Dónde**: [predict_matches.py:221-235](predict_matches.py:221), [run_experiments.py:226-232](run_experiments.py:226).
- **Qué pasa**:
  - El grid prueba `HALF_LIFE ∈ {300, 400, 500}` y `elo_scale_factor ∈ {1000, 1200, 1500}`, pero el código usa `HALF_LIFE = 180` y `ELO_SCALE_FACTOR = 700`.
  - `CB_DEPTH = 3` y `VAL_CUTOFF` están definidos pero no se usan: CatBoost tiene `depth=4` hardcodeado [predict_matches.py:1179](predict_matches.py:1179).
  - El grid evalúa sobre los mismos partidos de eliminatorias usados luego para reportar métricas (ver C-1): selección de hiperparámetros sobre el set de prueba.
  - `experimentos_log.md` (92 KB) registra 10 iteraciones fallidas y, entre las válidas, el máximo reportado es 66,67 %. Con una validación de unos 20–30 partidos, cada acierto mueve la métrica unos 4 puntos y no se reporta ningún intervalo de confianza, así que las diferencias entre configuraciones no son distinguibles del ruido.

### ⚪ B-2. Otros

- `update_scores.py` es un script de un solo uso con 50 resultados "transcritos de capturas de pantalla" hardcodeados; ya cumplió su función y puede reintroducir datos si se vuelve a ejecutar.
- `scrape_opta_stealth.py` y `server_opta.py` duplican `scrape_match_html` y `parse_html_content` casi línea por línea.
- `parse_opta_html.py` y los scrapers escriben directamente en `public/data/` (salida servida al navegador) sin validar esquema.
- `referencia/Mundial_Futbol_2026-main/notebook_code.py` no es Python válido (error de sintaxis en la línea 1; es un volcado de notebook).
- En `player_stats.json`, 100 de 103 entradas tienen en `teams` la lista de **todas** las selecciones de la página (49 nombres), no solo las dos del partido. Hoy funciona porque las dos primeras coinciden con el partido, pero es frágil.

---

## 5. Frontend — `src/` (React 18 + Vite 8)

**Build verificado**: `npx vite build` compila sin errores en ~2 s (Vite 8.1.5, React 18.3.1). Se compiló a un directorio temporal para no tocar `dist/`.

### 🟠 A-9. El despliegue en subcarpeta que describe la documentación no funciona

- **Dónde**: [DOCUMENTACION.md:86-97](DOCUMENTACION.md:86), [vite.config.js](vite.config.js), [src/main.jsx](src/main.jsx).
- **Qué pasa**: la guía indica copiar `dist/` a `htdocs/mundial/` y abrir `http://localhost/mundial/`. Pero `vite.config.js` no define `base`, y `dist/index.html` referencia `/assets/index-….js` (ruta absoluta desde la raíz del dominio). Además, todos los `fetch` usan rutas absolutas (`/data/predictions.json`, `/swiss_tournament.json`…) y `BrowserRouter` no tiene `basename`. Resultado: página en blanco por 404 en los assets. Recargar una ruta como `/partido/mex-rsa` también da 404 en Apache sin regla de reescritura.
- **Recomendación**: `base: './'` o `base: '/mundial/'` en Vite, `basename={import.meta.env.BASE_URL}` en el router, rutas de `fetch` relativas a `import.meta.env.BASE_URL`, y un `.htaccess` con fallback a `index.html` (o usar `HashRouter`).

### 🟡 M-11. Tercera copia de los resultados reales, hardcodeada en el frontend

- **Dónde**: `realResults` en [src/pages/Bracket.jsx:87-117](src/pages/Bracket.jsx:87).
- **Qué pasa**: además de `partidos_simulados.csv` y `real_matches` en Python, el cuadro tiene su propia tabla de ganadores. Le falta la semifinal `eng-arg`, que se muestra como "simulada por ELO" (Argentina con ~63 %) aunque ya se jugó. El comentario de `arg-egy` quedó pegado en la línea de `fra-mar`.
- **Recomendación**: derivar los ganadores de `predictions.json` (`is_played`, `real_score_*`) y añadir un campo `winner` para los partidos decididos en prórroga o penales.

### 🟡 M-12. `MatchDetail` puede mostrar la predicción del partido anterior

- **Dónde**: [src/pages/MatchDetail.jsx:1269-1273](src/pages/MatchDetail.jsx:1269).
- **Qué pasa**: `if (data?.[matchId]) setPrediction(data[matchId]);` no limpia el estado cuando el nuevo `matchId` no tiene predicción. Navegando entre partidos (por ejemplo desde el cuadro), puede quedarse en pantalla la predicción anterior. Además, en cada cambio de partido se vuelven a pedir los 4 archivos (`player_stats.json` pesa 1,7 MB) y no hay `AbortController`.
- **Recomendación**: `setPrediction(data?.[matchId] ?? null)` y cargar los JSON una sola vez (contexto o caché a nivel de módulo).

### 🟡 M-13. Partidos decididos en prórroga se evalúan como victoria en 90'

- **Dónde**: `partidos_simulados.csv` y la validación de `predict_matches.py`.
- **Qué pasa**: Noruega–Inglaterra (1–2, prórroga según `Bracket.jsx`) y Argentina–Suiza (3–1, prórroga) se guardan con el marcador final. Los modelos predicen el resultado a 90', así que el "resultado real" usado en accuracy/RPS para esos partidos debería ser empate.
- **Recomendación**: guardar por separado el marcador a 90', el marcador tras la prórroga y el ganador por penales.

### ⚪ B-3. Otros detalles del frontend

- **Componentes gigantes**: `MatchDetail.jsx` tiene 2.882 líneas (≈15 subcomponentes y un generador de PDF de 10 páginas), `Parlays.jsx` 923 y `PlayerStats.jsx` 712. Conviene separar el PDF en `src/pdf/` y los paneles en `src/components/match/`.
- **Bundle**: el chunk principal ocupa 883 kB (249 kB gzip) porque `jspdf` y `html2canvas` se cargan siempre. Se puede usar `import('jspdf')` solo al pulsar "Descargar PDF".
- **Números mágicos persistentes** en Parlays: el "Combo Pases + Remates" sigue siendo `0.70 + …` lineal [src/pages/Parlays.jsx:355](src/pages/Parlays.jsx:355), aunque el CHANGELOG dice que se eliminaron.
- `PlayerStats.jsx` llama a `http://localhost:5000/scrape` [src/pages/PlayerStats.jsx:109](src/pages/PlayerStats.jsx:109): en un despliegue público intentaría conectarse al `localhost` del visitante.
- `Support.jsx` envía nombre, email y mensaje a `https://mundial-ml-backend.onrender.com/api/contacto`, un backend que **no está en este repositorio**, sin aviso de privacidad.
- Accesibilidad: `MatchCard` es un `<div onClick>` sin `role` ni `tabIndex` (no se puede usar con teclado); el botón de menú móvil (`|||`) no tiene `aria-label`.
- El aviso legal (`Disclaimer`) se vuelve a mostrar en cada recarga (el estado no se persiste).
- `colabLink` apunta a `https://github.com/Malpi/mundial`, pero el remoto real es `github.com/Mzarlik/mundial`.
- La app gira en torno a apuestas ("Parleys", "Apuesta segura", cuotas implícitas) mientras muestra métricas infladas (C-1, C-3). El disclaimer existe, pero conviene no presentar picks como "seguros".

---

## 6. Seguridad

### 🟠 A-10. `server_opta.py`: escritura de archivos arbitraria y navegación de un navegador real disparables desde cualquier web

- **Dónde**: [server_opta.py:162-231](server_opta.py:162), [server_opta.py:239](server_opta.py:239).
- **Qué pasa**:
  1. El servidor escucha en **todas las interfaces** (`server_address = ('', 5000)`), con `Access-Control-Allow-Origin: *`.
  2. `GET /scrape?url=…` acepta **cualquier URL** (sin lista blanca de dominios) y abre Chromium visible con Playwright para navegar a ella. Al ser un GET simple, cualquier página que visites (o cualquier equipo de la red local) puede dispararlo.
  3. El nombre del respaldo HTML se construye con los nombres de equipo extraídos **del contenido de la página**: `f"{teams[0]} vs {teams[1]}".lower().replace(" ", "_")`. Una página maliciosa con un elemento `class="team-name"` cuyo texto sea `../../index` hace que `os.path.join(opta_dir, "../../index_vs_x.html")` escriba fuera de `opta_html/`, con contenido HTML controlado por el atacante (path traversal).
  4. El mensaje de la excepción se devuelve tal cual al cliente.
- **Recomendación**: escuchar solo en `127.0.0.1`; restringir `url` a `https://` y al dominio de Opta; quitar el CORS `*` (o limitarlo a `http://localhost:5173`); usar POST con token; sanear el nombre de archivo (`re.sub(r'[^a-z0-9_-]', '', …)`) y verificar que la ruta final queda dentro de `opta_dir`.

### 🟡 M-14. Dependencias npm con vulnerabilidades conocidas

`npm audit` (2026-10-31): **9 vulnerabilidades — 1 crítica, 4 altas, 4 moderadas**, todas con arreglo disponible vía `npm audit fix`.

| Paquete | Severidad | Vía | Exposición real |
|---|---|---|---|
| `dompurify` ≤3.4.16 | Crítica (XSS) | `jspdf` | Baja: la app no pasa HTML de terceros a `jsPDF.html()`. |
| `browserslist` ≤4.28.6 | Alta | dev, directa | Solo en build. |
| `nanoid` <3.3.18 | Alta | dev (Vite) | Solo en build. |
| `vite` | Alta/moderada | dev | Servidor de desarrollo; sin exposición si solo escucha en localhost. |
| `react-router` 6.0–7.17 | Moderada (open redirect) | runtime | Baja: no hay redirecciones con entrada del usuario. |
| `postcss`, `baseline-browser-mapping` | Moderada | dev | Solo en build. |

Además, `browserslist` y `caniuse-lite` figuran como `devDependencies` directas, probablemente como parche del error "Cannot find module caniuse-lite" que describe la guía; no deberían ser necesarias.

### 🟡 M-15. Dependencias Python sin fijar

`requirements.txt` usa solo cotas inferiores (`pandas>=2.0.0`, `pymc>=5.0.0`, …). El `.venv` actual tiene pandas **3.0.3**, numpy **2.4.6**, PyMC **6.0.1** y scikit-learn 1.9.0 (Python 3.13.14), versiones mayores que el código no declara haber probado. `arviz` se importa directamente pero no figura en `requirements.txt` (llega como dependencia de PyMC). Recomendación: generar un `requirements.lock` (`pip freeze`) o usar `uv`/`pip-tools`.

### ⚪ B-4. Cumplimiento y scraping

- `scrape_opta_stealth.py` y `server_opta.py` usan `playwright-stealth`, navegador visible y User-Agent falso, explícitamente "para pasar retos" de Cloudflare; `scraper_tm.py` rota User-Agents "para evitar bloqueos" en Transfermarkt. Ambos sitios restringen el scraping en sus términos de uso. Es un riesgo legal/contractual más que técnico: conviene revisar los términos o usar fuentes con licencia (APIs oficiales, datasets abiertos).
- `opta_html/` versiona **119 páginas guardadas de Opta (31 MB)**, incluidos sus scripts (`WebSdk.lib…js`, `GdprCmpController…js`, `autoblocker.js`) y hojas de estilo: contenido de terceros con copyright publicado en un repositorio de GitHub.
- No se encontraron secretos (API keys, tokens, contraseñas) en el código versionado.
- `index.html` carga Google Fonts y las banderas se sirven desde `flagcdn.com`: cada visita envía la IP del usuario a esos terceros (relevante si se busca cumplir GDPR).

---

## 7. Repositorio, flujo de trabajo y documentación

### 🟠 A-11. El historial de git pesa 1,1 GB por imágenes que hoy están ignoradas

- `.git` ocupa **1,1 GB** (pack de 798 MiB). El análisis de blobs del historial muestra **1.120 MB en 11.018 versiones de `public/graphs/*.png`**, que se versionaron antes de añadirse a `.gitignore`. También quedan en el historial `node_modules/` (esbuild, babel, rollup…) y `node_modules/.vite`.
- Cada `git clone` descarga todo eso. Las gráficas se generan a 300 dpi (`plt.savefig(..., dpi=300)`) y hoy `public/graphs/` ocupa 141 MB.
- **Recomendación**: purgar el historial con `git filter-repo --path public/graphs --path node_modules --invert-paths` (requiere *force push* y coordinarlo con quien tenga clones), y bajar el dpi a 120–150.

### 🟡 M-16. Artefactos de herramientas y basura versionados

| Ruta | Archivos | Tamaño | Comentario |
|---|---|---|---|
| `graphify-out/` (incluye `cache/ast/`) | 1.873 | 50 MB | Caché de la herramienta *graphify*; regenerable. Es el 91 % de los archivos del repo. |
| `opta_html/` | 119 | 31 MB | Ver B-4. |
| `.DS_Store`, `public/.DS_Store` | 2 | — | Están en `.gitignore`, pero se añadieron antes. |
| `experimentos_log.md` | 1 | 92 KB | Bitácora autogenerada con iteraciones fallidas. |

Recomendación: `git rm -r --cached graphify-out .DS_Store public/.DS_Store` y añadir `graphify-out/` al `.gitignore`.

### 🟡 M-17. La documentación no coincide con el código

**`DOCUMENTACION.md`**:
- Dice que `results.csv` llega "hasta finales de 2024"; hoy incluye partidos hasta el 2026-06-27.
- Habla de 3 modelos (Dixon-Coles, MCMC, XGBoost); el pipeline tiene 7 más ensemble y stacking.
- Dice que las gráficas van a `public/graphs/jun22/` … `jun27/`; las carpetas reales son `jornada1` … `final`, y se generan hasta 10 imágenes por partido, no 4.
- Dice que `_accuracy.png` mide el acierto "sobre 914 partidos históricos no vistos"; en realidad se mide sobre ~26 partidos de eliminatorias, in-sample (C-1).
- Dice que `run_all.bat` termina "en unos segundos"; el propio código avisa que el MCMC tarda 2–4 minutos.
- No describe el orden real del pipeline (`sync_and_generate.py` → `predict_matches.py` → `simulate_*.py`) ni `server_opta.py`.
- La guía de despliegue en XAMPP no funciona (A-9).

**`CHANGELOG.md`** (v1.1.0):
- Los 13 enlaces usan rutas locales de otra máquina (`file:///c:/xampp/htdocs/mundial/...`) y no funcionan en GitHub ni en este equipo.
- Afirma correcciones que no se cumplen: `test_dc_signatures.py` no existe (M-9); `scraper_tm.py` sigue roto (A-8); sigue habiendo fechas ficticias (A-7); las variables de clima no tienen efecto real (A-1); los números mágicos de Parlays persisten (B-3); la fuga de datos persiste por la vía Opta (C-2).
- Las fechas de versión (1.0.0 el 2026-10-22) no cuadran con el historial (commits desde junio de 2026).

**Falta un `README.md`** en la raíz: GitHub no muestra nada al entrar al repositorio.

### ⚪ B-5. Flujo de trabajo

- 39 de 65 commits tienen como mensaje `"."`, y los demás son genéricos. Es imposible saber qué cambió en cada uno sin leer el diff (lo que dificultó, por ejemplo, rastrear C-4).
- Todo se trabaja directamente en `main`; no hay ramas, PRs ni CI.
- `run_all.bat` solo ejecuta `predict_matches.py` y siempre imprime "[OK] … con éxito", aunque falle (y `predict_matches.py` termina siempre con código 0 por `os._exit(0)`).
- `setup_env.bat` termina con `pause`, así que `run_all.bat` se queda esperando una tecla la primera vez.
- `server_opta.py` documenta en su cabecera una ruta absoluta de otra máquina (`c:\xampp\htdocs\mundial\.venv\...`).
- `vite.config.js` define un proxy `/api → localhost:3001` que nada usa (el scraper corre en el puerto 5000).

---

## 8. Lo que está bien

- **Ratings con corte temporal correcto**: `get_elo_at_date`/`get_pi_at_date`/`get_form_at_date` usan `bisect_left` y devuelven el valor anterior a la fecha del partido, así que ELO, Pi y forma no filtran el propio resultado. Las rachas usan `shift()` antes de `rolling()`.
- **Dixon-Coles bien implementado**: la corrección `tau` para marcadores bajos, la restricción de suma cero en ataques, el decaimiento temporal y la ponderación por torneo siguen la formulación estándar.
- **MCMC con chequeo de convergencia** (R-hat > 1,05 genera advertencia) y priors informados por ELO al corte de `MATCH_DATE`.
- **Backtest histórico** (`test_backtest.py`) contra Rusia 2018 y Catar 2022 con corte temporal real: es la base adecuada para validar en serio.
- **Frontend que compila limpio**, con rutas claras, aviso legal y manejo de imágenes faltantes.
- **Dataset base con licencia clara** (CC0 de `martj42/international_results`).
- **Documentación y CHANGELOG en español**, con troubleshooting útil para Windows.
- Sin secretos en el repositorio.

---

## 9. Plan de acción priorizado

| # | Acción | Hallazgos | Esfuerzo |
|---|---|---|---|
| 1 | Restaurar el amistoso EE. UU.–Bélgica (2026-03-28 → 2–5) y corregir la búsqueda en `sync_and_generate.py`/`update_scores.py` para filtrar por torneo y fecha. | C-4 | Bajo |
| 2 | Cerrar `server_opta.py`: bind a `127.0.0.1`, lista blanca de dominio, nombre de archivo saneado, sin CORS `*`. | A-10 | Bajo |
| 3 | Separar entrenamiento y evaluación: pesos del ensemble, stacking e isotónica con leave-one-out o validación temporal; reportar métricas *out-of-sample* con intervalo de confianza. | C-1, M-10 | Medio |
| 4 | Eliminar las fugas: modificadores Opta con corte temporal; un modelo por fase o fecha de corte, o marcar las predicciones de jornadas 1–2 como in-sample. | C-2, C-3 | Medio |
| 5 | Una sola fuente de verdad para resultados (con marcador a 90', prórroga y penales) y un único `teams.json` de nombres. | A-4, M-7, M-11, M-13 | Medio |
| 6 | Arreglar features: regex de `venue`; clima solo si existe en el histórico (o retirarlo); ventaja de anfitrión solo en 2026; sedes reales. | A-1, A-2, A-3, A-6 | Medio |
| 7 | `import re` en `scraper_tm.py` y `timeout` en `requests`. | A-8 | Bajo |
| 8 | Despliegue: `base` en Vite, `basename` en el router, `fetch` relativos y `.htaccess`. | A-9 | Bajo |
| 9 | `npm audit fix` y fijar dependencias Python. | M-14, M-15 | Bajo |
| 10 | Limpieza del repo: sacar `graphify-out/` y `.DS_Store`; purgar `public/graphs` y `node_modules` del historial; añadir `README.md`; actualizar `DOCUMENTACION.md` y `CHANGELOG.md`. | A-11, M-16, M-17 | Medio |
| 11 | Tests reales con `pytest` y un CI mínimo (build del frontend + tests). | M-9, B-5 | Medio |
| 12 | Refactorizar `predict_matches.py` en módulos (`data/`, `models/`, `plots/`, `export/`) y `MatchDetail.jsx` en componentes. | B-1, B-3 | Alto |
