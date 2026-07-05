# 🧪 Bitácora Global de Experimentación e Hiperparámetros
Archivo de registro acumulativo de Grid Search de modelos del Mundial.

### 📍 Iteración 1/108 - FALLIDA el 2026-07-03 17:14:59

Error: `name 'predict_matches' is not defined`

---

### 📍 Iteración 2/108 - FALLIDA el 2026-07-03 17:15:31

Error: `name 'predict_matches' is not defined`

---

### 📍 Iteración 3/108 - FALLIDA el 2026-07-03 17:16:04

Error: `name 'predict_matches' is not defined`

---

### 📍 Iteración 4/108 - FALLIDA el 2026-07-03 17:16:36

Error: `name 'predict_matches' is not defined`

---

### 📍 Iteración 5/108 - FALLIDA el 2026-07-03 17:17:07

Error: `name 'predict_matches' is not defined`

---

### 📍 Iteración 6/108 - FALLIDA el 2026-07-03 17:17:38

Error: `name 'predict_matches' is not defined`

---

### 📍 Iteración 7/108 - FALLIDA el 2026-07-03 17:18:10

Error: `name 'predict_matches' is not defined`

---

### 📍 Iteración 8/108 - FALLIDA el 2026-07-03 17:18:41

Error: `name 'predict_matches' is not defined`

---

### 📍 Iteración 9/108 - FALLIDA el 2026-07-03 17:19:13

Error: `name 'predict_matches' is not defined`

---

### 📍 Iteración 1/108 - FALLIDA el 2026-07-03 17:22:40

Error: `
        An attempt has been made to start a new process before the
        current process has finished its bootstrapping phase.

        This probably means that you are not using fork to start your
        child processes and you have forgotten to use the proper idiom
        in the main module:

            if __name__ == '__main__':
                freeze_support()
                ...

        The "freeze_support()" line can be omitted if the program
        is not going to be frozen to produce an executable.

        To fix this issue, refer to the "Safe importing of main module"
        section in https://docs.python.org/3/library/multiprocessing.html
        `

---

### 📍 Iteración 1/108 - Realizada el 2026-07-03 17:24:30

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 1500
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 65.33% | 0.1475 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1466 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **66.67%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `99.66%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `0.34%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `73.0s`

---

### 📍 Iteración 1/108 - Realizada el 2026-07-03 17:26:33

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 1500
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 65.33% | 0.1475 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1466 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **66.67%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `99.66%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `0.34%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `70.5s`

---

### 📍 Iteración 2/108 - Realizada el 2026-07-03 17:27:44

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 1500
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 65.33% | 0.1475 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1468 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **65.33%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `90.99%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `9.01%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `71.3s`

---

### 📍 Iteración 3/108 - Realizada el 2026-07-03 17:28:55

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 3000
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 65.33% | 0.1475 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1466 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **66.67%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `99.66%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `0.34%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `83.9s`

---

### 📍 Iteración 1/108 - Realizada el 2026-07-03 18:32:07

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 1500
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 65.33% | 0.1475 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1466 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **66.67%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `99.66%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `0.34%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `68.9s`

---

### 📍 Iteración 2/108 - Realizada el 2026-07-03 18:33:16

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 1500
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 65.33% | 0.1475 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1468 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **65.33%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `90.99%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `9.01%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `70.1s`

---

### 📍 Iteración 3/108 - Realizada el 2026-07-03 18:34:26

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 3000
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 65.33% | 0.1475 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1466 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **66.67%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `99.66%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `0.34%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `82.9s`

---

### 📍 Iteración 4/108 - Realizada el 2026-07-03 18:35:49

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 3000
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 65.33% | 0.1475 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1468 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **65.33%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `90.99%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `9.01%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `82.7s`

---

### 📍 Iteración 5/108 - Realizada el 2026-07-03 18:37:12

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1200.0
- `mcmc_draws`: 1500
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 61.33% | 0.1578 |
| XGBoost | 65.33% | 0.1475 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1466 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **66.67%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `99.66%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `0.34%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `69.2s`

---

### 📍 Iteración 6/108 - Realizada el 2026-07-03 18:38:21

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1200.0
- `mcmc_draws`: 1500
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 61.33% | 0.1578 |
| XGBoost | 65.33% | 0.1475 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1468 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **65.33%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `90.99%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `9.01%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `70.2s`

---

### 📍 Iteración 7/108 - Realizada el 2026-07-03 18:39:32

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1200.0
- `mcmc_draws`: 3000
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 60.00% | 0.1578 |
| XGBoost | 65.33% | 0.1475 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1466 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **66.67%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `99.66%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `0.34%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `83.0s`

---

### 📍 Iteración 8/108 - Realizada el 2026-07-03 18:40:55

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1200.0
- `mcmc_draws`: 3000
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 60.00% | 0.1578 |
| XGBoost | 65.33% | 0.1475 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1468 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **65.33%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `90.99%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `9.01%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `85.9s`

---

### 📍 Iteración 9/108 - Realizada el 2026-07-03 18:42:21

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1500.0
- `mcmc_draws`: 1500
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 61.33% | 0.1576 |
| XGBoost | 65.33% | 0.1475 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1466 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **66.67%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `99.66%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `0.34%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `73.2s`

---

### 📍 Iteración 10/108 - Realizada el 2026-07-03 18:43:34

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1500.0
- `mcmc_draws`: 1500
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 61.33% | 0.1576 |
| XGBoost | 65.33% | 0.1475 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1468 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **65.33%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `90.98%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `9.02%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `70.3s`

---

### 📍 Iteración 11/108 - Realizada el 2026-07-03 18:44:45

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1500.0
- `mcmc_draws`: 3000
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 61.33% | 0.1576 |
| XGBoost | 65.33% | 0.1475 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1466 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **66.67%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `99.66%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `0.34%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `83.7s`

---

### 📍 Iteración 12/108 - Realizada el 2026-07-03 18:46:09

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1500.0
- `mcmc_draws`: 3000
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 61.33% | 0.1576 |
| XGBoost | 65.33% | 0.1475 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1468 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **65.33%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `90.98%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `9.02%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `85.4s`

---

### 📍 Iteración 13/108 - Realizada el 2026-07-03 18:47:34

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.4
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 1500
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 65.33% | 0.1476 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1467 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **66.67%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `99.93%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `0.07%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `69.2s`

---

### 📍 Iteración 14/108 - Realizada el 2026-07-03 18:48:44

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.4
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 1500
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 65.33% | 0.1476 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1468 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **65.33%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `90.99%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `9.01%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `69.5s`

---

### 📍 Iteración 15/108 - Realizada el 2026-07-03 18:49:53

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.4
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 3000
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 65.33% | 0.1476 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1467 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **66.67%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `99.93%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `0.07%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `82.9s`

---

### 📍 Iteración 16/108 - Realizada el 2026-07-03 18:51:17

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.4
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 3000
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 65.33% | 0.1476 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1468 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **65.33%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `90.99%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `9.01%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `84.3s`

---

### 📍 Iteración 17/108 - Realizada el 2026-07-03 18:52:41

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.4
- `elo_scale_factor`: 1200.0
- `mcmc_draws`: 1500
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 61.33% | 0.1578 |
| XGBoost | 65.33% | 0.1476 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1467 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **66.67%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `99.93%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `0.07%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `67.9s`

---

### 📍 Iteración 18/108 - Realizada el 2026-07-03 18:53:49

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.4
- `elo_scale_factor`: 1200.0
- `mcmc_draws`: 1500
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 61.33% | 0.1578 |
| XGBoost | 65.33% | 0.1476 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1468 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **65.33%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `91.00%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `9.00%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `69.9s`

---

### 📍 Iteración 19/108 - Realizada el 2026-07-03 18:54:59

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.4
- `elo_scale_factor`: 1200.0
- `mcmc_draws`: 3000
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 60.00% | 0.1578 |
| XGBoost | 65.33% | 0.1476 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1467 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **66.67%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `99.93%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `0.07%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `83.8s`

---

### 📍 Iteración 20/108 - Realizada el 2026-07-03 18:56:23

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.4
- `elo_scale_factor`: 1200.0
- `mcmc_draws`: 3000
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 60.00% | 0.1578 |
| XGBoost | 65.33% | 0.1476 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1468 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **65.33%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `90.99%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `9.01%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `83.3s`

---

### 📍 Iteración 21/108 - Realizada el 2026-07-03 18:57:47

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.4
- `elo_scale_factor`: 1500.0
- `mcmc_draws`: 1500
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 61.33% | 0.1576 |
| XGBoost | 65.33% | 0.1476 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1467 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **66.67%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `99.93%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `0.07%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `67.9s`

---

### 📍 Iteración 22/108 - Realizada el 2026-07-03 18:58:55

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.4
- `elo_scale_factor`: 1500.0
- `mcmc_draws`: 1500
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 61.33% | 0.1576 |
| XGBoost | 65.33% | 0.1476 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1468 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **65.33%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `90.99%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `9.01%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `70.1s`

---

### 📍 Iteración 23/108 - Realizada el 2026-07-03 19:00:05

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.4
- `elo_scale_factor`: 1500.0
- `mcmc_draws`: 3000
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 61.33% | 0.1576 |
| XGBoost | 65.33% | 0.1476 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1467 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **66.67%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `99.93%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `0.07%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `85.1s`

---

### 📍 Iteración 24/108 - Realizada el 2026-07-03 19:01:31

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.4
- `elo_scale_factor`: 1500.0
- `mcmc_draws`: 3000
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 61.33% | 0.1576 |
| XGBoost | 65.33% | 0.1476 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1468 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **65.33%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `90.99%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `9.01%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `84.8s`

---

### 📍 Iteración 25/108 - Realizada el 2026-07-03 19:02:56

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.6
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 1500
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 65.33% | 0.1476 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1467 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **66.67%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `100.00%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `0.00%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `68.3s`

---

### 📍 Iteración 26/108 - Realizada el 2026-07-03 19:04:04

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.6
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 1500
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 65.33% | 0.1476 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1468 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **65.33%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `91.00%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `9.00%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `69.0s`

---

### 📍 Iteración 27/108 - Realizada el 2026-07-03 19:05:14

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.6
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 3000
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 65.33% | 0.1476 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1467 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **66.67%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `100.00%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `0.00%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `84.0s`

---

### 📍 Iteración 28/108 - Realizada el 2026-07-03 19:06:38

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.6
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 3000
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 65.33% | 0.1476 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1468 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **65.33%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `91.00%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `9.00%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `85.2s`

---

### 📍 Iteración 29/108 - Realizada el 2026-07-03 19:08:03

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.6
- `elo_scale_factor`: 1200.0
- `mcmc_draws`: 1500
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 61.33% | 0.1578 |
| XGBoost | 65.33% | 0.1476 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1467 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **66.67%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `100.00%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `0.00%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `68.1s`

---

### 📍 Iteración 30/108 - Realizada el 2026-07-03 19:09:12

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.6
- `elo_scale_factor`: 1200.0
- `mcmc_draws`: 1500
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 61.33% | 0.1578 |
| XGBoost | 65.33% | 0.1476 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1468 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **65.33%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `91.00%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `9.00%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `68.6s`

---

### 📍 Iteración 31/108 - Realizada el 2026-07-03 19:10:21

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.6
- `elo_scale_factor`: 1200.0
- `mcmc_draws`: 3000
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 60.00% | 0.1578 |
| XGBoost | 65.33% | 0.1476 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1467 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **66.67%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `100.00%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `0.00%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `84.0s`

---

### 📍 Iteración 32/108 - Realizada el 2026-07-03 19:11:45

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.6
- `elo_scale_factor`: 1200.0
- `mcmc_draws`: 3000
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 60.00% | 0.1578 |
| XGBoost | 65.33% | 0.1476 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1468 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **65.33%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `91.00%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `9.00%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `84.2s`

---

### 📍 Iteración 33/108 - Realizada el 2026-07-03 19:13:09

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.6
- `elo_scale_factor`: 1500.0
- `mcmc_draws`: 1500
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 61.33% | 0.1576 |
| XGBoost | 65.33% | 0.1476 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1467 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **66.67%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `100.00%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `0.00%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `68.5s`

---

### 📍 Iteración 34/108 - Realizada el 2026-07-03 19:14:18

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.6
- `elo_scale_factor`: 1500.0
- `mcmc_draws`: 1500
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 61.33% | 0.1576 |
| XGBoost | 65.33% | 0.1476 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1468 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **65.33%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `91.00%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `9.00%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `70.0s`

---

### 📍 Iteración 35/108 - Realizada el 2026-07-03 19:15:28

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.6
- `elo_scale_factor`: 1500.0
- `mcmc_draws`: 3000
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 61.33% | 0.1576 |
| XGBoost | 65.33% | 0.1476 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1467 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **66.67%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `100.00%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `0.00%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `83.3s`

---

### 📍 Iteración 36/108 - Realizada el 2026-07-03 19:16:52

**Parámetros de Entrada:**
- `HALF_LIFE`: 300
- `theta_knockout`: -0.6
- `elo_scale_factor`: 1500.0
- `mcmc_draws`: 3000
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 66.67% | 0.1497 |
| Dixon-Coles NB | 66.67% | 0.1422 |
| MCMC Bayesiano | 61.33% | 0.1576 |
| XGBoost | 65.33% | 0.1476 |
| Red Neuronal | 61.33% | 0.1546 |
| CatBoost | 65.33% | 0.1468 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **65.33%** | **0.1422** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `91.00%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `9.00%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `82.4s`

---

### 📍 Iteración 37/108 - Realizada el 2026-07-03 19:18:15

**Parámetros de Entrada:**
- `HALF_LIFE`: 400
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 1500
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1489 |
| Dixon-Coles NB | 65.33% | 0.1430 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 64.00% | 0.1469 |
| Red Neuronal | 61.33% | 0.1514 |
| CatBoost | 64.00% | 0.1456 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **62.67%** | **0.1428** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `80.56%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `19.44%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `70.1s`

---

### 📍 Iteración 38/108 - Realizada el 2026-07-03 19:19:25

**Parámetros de Entrada:**
- `HALF_LIFE`: 400
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 1500
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1489 |
| Dixon-Coles NB | 65.33% | 0.1430 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 64.00% | 0.1469 |
| Red Neuronal | 61.33% | 0.1514 |
| CatBoost | 64.00% | 0.1467 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **62.67%** | **0.1429** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `89.93%`
- MCMC: `0.00%`
- XGB: `4.85%`
- MLP: `0.00%`
- CatBoost: `5.22%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `68.3s`

---

### 📍 Iteración 39/108 - Realizada el 2026-07-03 19:20:34

**Parámetros de Entrada:**
- `HALF_LIFE`: 400
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 3000
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1489 |
| Dixon-Coles NB | 65.33% | 0.1430 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 64.00% | 0.1469 |
| Red Neuronal | 61.33% | 0.1514 |
| CatBoost | 64.00% | 0.1456 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **62.67%** | **0.1428** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `80.55%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `19.45%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `81.1s`

---

### 📍 Iteración 40/108 - Realizada el 2026-07-03 19:21:55

**Parámetros de Entrada:**
- `HALF_LIFE`: 400
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 3000
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1489 |
| Dixon-Coles NB | 65.33% | 0.1430 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 64.00% | 0.1469 |
| Red Neuronal | 61.33% | 0.1514 |
| CatBoost | 64.00% | 0.1467 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **62.67%** | **0.1429** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `89.93%`
- MCMC: `0.00%`
- XGB: `4.85%`
- MLP: `0.00%`
- CatBoost: `5.22%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `82.2s`

---

### 📍 Iteración 41/108 - Realizada el 2026-07-03 19:23:18

**Parámetros de Entrada:**
- `HALF_LIFE`: 400
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1200.0
- `mcmc_draws`: 1500
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1489 |
| Dixon-Coles NB | 65.33% | 0.1430 |
| MCMC Bayesiano | 61.33% | 0.1578 |
| XGBoost | 64.00% | 0.1469 |
| Red Neuronal | 61.33% | 0.1514 |
| CatBoost | 64.00% | 0.1456 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **62.67%** | **0.1428** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `80.54%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `19.46%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `66.5s`

---

### 📍 Iteración 42/108 - Realizada el 2026-07-03 19:24:25

**Parámetros de Entrada:**
- `HALF_LIFE`: 400
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1200.0
- `mcmc_draws`: 1500
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1489 |
| Dixon-Coles NB | 65.33% | 0.1430 |
| MCMC Bayesiano | 61.33% | 0.1578 |
| XGBoost | 64.00% | 0.1469 |
| Red Neuronal | 61.33% | 0.1514 |
| CatBoost | 64.00% | 0.1467 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **62.67%** | **0.1429** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `89.93%`
- MCMC: `0.00%`
- XGB: `4.85%`
- MLP: `0.00%`
- CatBoost: `5.22%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `67.4s`

---

### 📍 Iteración 43/108 - Realizada el 2026-07-03 19:25:32

**Parámetros de Entrada:**
- `HALF_LIFE`: 400
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1200.0
- `mcmc_draws`: 3000
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1489 |
| Dixon-Coles NB | 65.33% | 0.1430 |
| MCMC Bayesiano | 60.00% | 0.1578 |
| XGBoost | 64.00% | 0.1469 |
| Red Neuronal | 61.33% | 0.1514 |
| CatBoost | 64.00% | 0.1456 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **62.67%** | **0.1428** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `80.54%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `19.46%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `81.1s`

---

### 📍 Iteración 44/108 - Realizada el 2026-07-03 19:26:54

**Parámetros de Entrada:**
- `HALF_LIFE`: 400
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1200.0
- `mcmc_draws`: 3000
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1489 |
| Dixon-Coles NB | 65.33% | 0.1430 |
| MCMC Bayesiano | 60.00% | 0.1578 |
| XGBoost | 64.00% | 0.1469 |
| Red Neuronal | 61.33% | 0.1514 |
| CatBoost | 64.00% | 0.1467 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **62.67%** | **0.1429** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `89.93%`
- MCMC: `0.00%`
- XGB: `4.85%`
- MLP: `0.00%`
- CatBoost: `5.22%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `82.3s`

---

### 📍 Iteración 45/108 - Realizada el 2026-07-03 19:28:16

**Parámetros de Entrada:**
- `HALF_LIFE`: 400
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1500.0
- `mcmc_draws`: 1500
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1489 |
| Dixon-Coles NB | 65.33% | 0.1430 |
| MCMC Bayesiano | 61.33% | 0.1576 |
| XGBoost | 64.00% | 0.1469 |
| Red Neuronal | 61.33% | 0.1514 |
| CatBoost | 64.00% | 0.1456 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **62.67%** | **0.1428** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `80.52%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `19.48%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `66.8s`

---

### 📍 Iteración 46/108 - Realizada el 2026-07-03 19:29:24

**Parámetros de Entrada:**
- `HALF_LIFE`: 400
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1500.0
- `mcmc_draws`: 1500
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1489 |
| Dixon-Coles NB | 65.33% | 0.1430 |
| MCMC Bayesiano | 61.33% | 0.1576 |
| XGBoost | 64.00% | 0.1469 |
| Red Neuronal | 61.33% | 0.1514 |
| CatBoost | 64.00% | 0.1467 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **62.67%** | **0.1429** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `89.93%`
- MCMC: `0.00%`
- XGB: `4.85%`
- MLP: `0.00%`
- CatBoost: `5.22%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `68.1s`

---

### 📍 Iteración 47/108 - Realizada el 2026-07-03 19:30:32

**Parámetros de Entrada:**
- `HALF_LIFE`: 400
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1500.0
- `mcmc_draws`: 3000
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1489 |
| Dixon-Coles NB | 65.33% | 0.1430 |
| MCMC Bayesiano | 61.33% | 0.1576 |
| XGBoost | 64.00% | 0.1469 |
| Red Neuronal | 61.33% | 0.1514 |
| CatBoost | 64.00% | 0.1456 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **62.67%** | **0.1428** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `80.52%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `19.48%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `80.6s`

---

### 📍 Iteración 48/108 - Realizada el 2026-07-03 19:31:53

**Parámetros de Entrada:**
- `HALF_LIFE`: 400
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1500.0
- `mcmc_draws`: 3000
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1489 |
| Dixon-Coles NB | 65.33% | 0.1430 |
| MCMC Bayesiano | 61.33% | 0.1576 |
| XGBoost | 64.00% | 0.1469 |
| Red Neuronal | 61.33% | 0.1514 |
| CatBoost | 64.00% | 0.1467 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **62.67%** | **0.1429** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `89.93%`
- MCMC: `0.00%`
- XGB: `4.85%`
- MLP: `0.00%`
- CatBoost: `5.22%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `88.2s`

---

### 📍 Iteración 49/108 - Realizada el 2026-07-03 19:33:22

**Parámetros de Entrada:**
- `HALF_LIFE`: 400
- `theta_knockout`: -0.4
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 1500
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1489 |
| Dixon-Coles NB | 65.33% | 0.1430 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 64.00% | 0.1469 |
| Red Neuronal | 61.33% | 0.1515 |
| CatBoost | 64.00% | 0.1456 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **62.67%** | **0.1428** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `80.75%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `19.25%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `66.3s`

---

### 📍 Iteración 50/108 - Realizada el 2026-07-03 19:34:28

**Parámetros de Entrada:**
- `HALF_LIFE`: 400
- `theta_knockout`: -0.4
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 1500
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1489 |
| Dixon-Coles NB | 65.33% | 0.1430 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 64.00% | 0.1469 |
| Red Neuronal | 61.33% | 0.1515 |
| CatBoost | 64.00% | 0.1467 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **62.67%** | **0.1429** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `90.26%`
- MCMC: `0.00%`
- XGB: `4.77%`
- MLP: `0.00%`
- CatBoost: `4.97%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `67.8s`

---

### 📍 Iteración 51/108 - Realizada el 2026-07-03 19:35:36

**Parámetros de Entrada:**
- `HALF_LIFE`: 400
- `theta_knockout`: -0.4
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 3000
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1489 |
| Dixon-Coles NB | 65.33% | 0.1430 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 64.00% | 0.1469 |
| Red Neuronal | 61.33% | 0.1515 |
| CatBoost | 64.00% | 0.1456 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **62.67%** | **0.1428** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `80.75%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `19.25%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `84.4s`

---

### 📍 Iteración 52/108 - Realizada el 2026-07-03 19:37:01

**Parámetros de Entrada:**
- `HALF_LIFE`: 400
- `theta_knockout`: -0.4
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 3000
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1489 |
| Dixon-Coles NB | 65.33% | 0.1430 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 64.00% | 0.1469 |
| Red Neuronal | 61.33% | 0.1515 |
| CatBoost | 64.00% | 0.1467 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **62.67%** | **0.1429** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `90.26%`
- MCMC: `0.00%`
- XGB: `4.77%`
- MLP: `0.00%`
- CatBoost: `4.97%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `82.1s`

---

### 📍 Iteración 53/108 - Realizada el 2026-07-03 19:38:24

**Parámetros de Entrada:**
- `HALF_LIFE`: 400
- `theta_knockout`: -0.4
- `elo_scale_factor`: 1200.0
- `mcmc_draws`: 1500
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1489 |
| Dixon-Coles NB | 65.33% | 0.1430 |
| MCMC Bayesiano | 61.33% | 0.1578 |
| XGBoost | 64.00% | 0.1469 |
| Red Neuronal | 61.33% | 0.1515 |
| CatBoost | 64.00% | 0.1456 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **62.67%** | **0.1428** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `80.73%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `19.27%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `66.2s`

---

### 📍 Iteración 54/108 - Realizada el 2026-07-03 19:39:30

**Parámetros de Entrada:**
- `HALF_LIFE`: 400
- `theta_knockout`: -0.4
- `elo_scale_factor`: 1200.0
- `mcmc_draws`: 1500
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1489 |
| Dixon-Coles NB | 65.33% | 0.1430 |
| MCMC Bayesiano | 61.33% | 0.1578 |
| XGBoost | 64.00% | 0.1469 |
| Red Neuronal | 61.33% | 0.1515 |
| CatBoost | 64.00% | 0.1467 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **62.67%** | **0.1429** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `90.26%`
- MCMC: `0.00%`
- XGB: `4.77%`
- MLP: `0.00%`
- CatBoost: `4.97%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `68.0s`

---

### 📍 Iteración 55/108 - Realizada el 2026-07-03 19:40:39

**Parámetros de Entrada:**
- `HALF_LIFE`: 400
- `theta_knockout`: -0.4
- `elo_scale_factor`: 1200.0
- `mcmc_draws`: 3000
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1489 |
| Dixon-Coles NB | 65.33% | 0.1430 |
| MCMC Bayesiano | 60.00% | 0.1578 |
| XGBoost | 64.00% | 0.1469 |
| Red Neuronal | 61.33% | 0.1515 |
| CatBoost | 64.00% | 0.1456 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **62.67%** | **0.1428** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `80.73%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `19.27%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `83.4s`

---

### 📍 Iteración 56/108 - Realizada el 2026-07-03 19:42:02

**Parámetros de Entrada:**
- `HALF_LIFE`: 400
- `theta_knockout`: -0.4
- `elo_scale_factor`: 1200.0
- `mcmc_draws`: 3000
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1489 |
| Dixon-Coles NB | 65.33% | 0.1430 |
| MCMC Bayesiano | 60.00% | 0.1578 |
| XGBoost | 64.00% | 0.1469 |
| Red Neuronal | 61.33% | 0.1515 |
| CatBoost | 64.00% | 0.1467 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **62.67%** | **0.1429** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `90.26%`
- MCMC: `0.00%`
- XGB: `4.78%`
- MLP: `0.00%`
- CatBoost: `4.96%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `81.0s`

---

### 📍 Iteración 57/108 - Realizada el 2026-07-03 19:43:24

**Parámetros de Entrada:**
- `HALF_LIFE`: 400
- `theta_knockout`: -0.4
- `elo_scale_factor`: 1500.0
- `mcmc_draws`: 1500
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1489 |
| Dixon-Coles NB | 65.33% | 0.1430 |
| MCMC Bayesiano | 61.33% | 0.1576 |
| XGBoost | 64.00% | 0.1469 |
| Red Neuronal | 61.33% | 0.1515 |
| CatBoost | 64.00% | 0.1456 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **62.67%** | **0.1428** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `80.71%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `19.29%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `66.6s`

---

### 📍 Iteración 58/108 - Realizada el 2026-07-03 19:44:31

**Parámetros de Entrada:**
- `HALF_LIFE`: 400
- `theta_knockout`: -0.4
- `elo_scale_factor`: 1500.0
- `mcmc_draws`: 1500
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1489 |
| Dixon-Coles NB | 65.33% | 0.1430 |
| MCMC Bayesiano | 61.33% | 0.1576 |
| XGBoost | 64.00% | 0.1469 |
| Red Neuronal | 61.33% | 0.1515 |
| CatBoost | 64.00% | 0.1467 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **62.67%** | **0.1429** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `90.26%`
- MCMC: `0.00%`
- XGB: `4.77%`
- MLP: `0.00%`
- CatBoost: `4.97%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `67.5s`

---

### 📍 Iteración 59/108 - Realizada el 2026-07-03 19:45:39

**Parámetros de Entrada:**
- `HALF_LIFE`: 400
- `theta_knockout`: -0.4
- `elo_scale_factor`: 1500.0
- `mcmc_draws`: 3000
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1489 |
| Dixon-Coles NB | 65.33% | 0.1430 |
| MCMC Bayesiano | 61.33% | 0.1576 |
| XGBoost | 64.00% | 0.1469 |
| Red Neuronal | 61.33% | 0.1515 |
| CatBoost | 64.00% | 0.1456 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **62.67%** | **0.1428** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `80.71%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `19.29%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `80.6s`

---

### 📍 Iteración 60/108 - Realizada el 2026-07-03 19:47:00

**Parámetros de Entrada:**
- `HALF_LIFE`: 400
- `theta_knockout`: -0.4
- `elo_scale_factor`: 1500.0
- `mcmc_draws`: 3000
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1489 |
| Dixon-Coles NB | 65.33% | 0.1430 |
| MCMC Bayesiano | 61.33% | 0.1576 |
| XGBoost | 64.00% | 0.1469 |
| Red Neuronal | 61.33% | 0.1515 |
| CatBoost | 64.00% | 0.1467 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **62.67%** | **0.1429** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `90.26%`
- MCMC: `0.00%`
- XGB: `4.77%`
- MLP: `0.00%`
- CatBoost: `4.97%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `86.3s`

---

### 📍 Iteración 61/108 - Realizada el 2026-07-03 19:48:26

**Parámetros de Entrada:**
- `HALF_LIFE`: 400
- `theta_knockout`: -0.6
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 1500
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1489 |
| Dixon-Coles NB | 65.33% | 0.1430 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 64.00% | 0.1470 |
| Red Neuronal | 61.33% | 0.1515 |
| CatBoost | 64.00% | 0.1456 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **62.67%** | **0.1428** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `80.93%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `19.07%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `66.4s`

---

### 📍 Iteración 62/108 - Realizada el 2026-07-03 19:49:33

**Parámetros de Entrada:**
- `HALF_LIFE`: 400
- `theta_knockout`: -0.6
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 1500
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1489 |
| Dixon-Coles NB | 65.33% | 0.1430 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 64.00% | 0.1470 |
| Red Neuronal | 61.33% | 0.1515 |
| CatBoost | 64.00% | 0.1468 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **62.67%** | **0.1429** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `90.58%`
- MCMC: `0.00%`
- XGB: `4.70%`
- MLP: `0.00%`
- CatBoost: `4.72%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `69.2s`

---

### 📍 Iteración 63/108 - Realizada el 2026-07-03 19:50:43

**Parámetros de Entrada:**
- `HALF_LIFE`: 400
- `theta_knockout`: -0.6
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 3000
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1489 |
| Dixon-Coles NB | 65.33% | 0.1430 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 64.00% | 0.1470 |
| Red Neuronal | 61.33% | 0.1515 |
| CatBoost | 64.00% | 0.1456 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **62.67%** | **0.1428** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `80.93%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `19.07%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `81.3s`

---

### 📍 Iteración 64/108 - Realizada el 2026-07-03 19:52:05

**Parámetros de Entrada:**
- `HALF_LIFE`: 400
- `theta_knockout`: -0.6
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 3000
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1489 |
| Dixon-Coles NB | 65.33% | 0.1430 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 64.00% | 0.1470 |
| Red Neuronal | 61.33% | 0.1515 |
| CatBoost | 64.00% | 0.1468 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **62.67%** | **0.1429** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `90.58%`
- MCMC: `0.00%`
- XGB: `4.70%`
- MLP: `0.00%`
- CatBoost: `4.72%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `83.2s`

---

### 📍 Iteración 65/108 - Realizada el 2026-07-03 19:53:28

**Parámetros de Entrada:**
- `HALF_LIFE`: 400
- `theta_knockout`: -0.6
- `elo_scale_factor`: 1200.0
- `mcmc_draws`: 1500
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1489 |
| Dixon-Coles NB | 65.33% | 0.1430 |
| MCMC Bayesiano | 61.33% | 0.1578 |
| XGBoost | 64.00% | 0.1470 |
| Red Neuronal | 61.33% | 0.1515 |
| CatBoost | 64.00% | 0.1456 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **62.67%** | **0.1428** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `80.92%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `19.08%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `69.3s`

---

### 📍 Iteración 66/108 - Realizada el 2026-07-03 19:54:38

**Parámetros de Entrada:**
- `HALF_LIFE`: 400
- `theta_knockout`: -0.6
- `elo_scale_factor`: 1200.0
- `mcmc_draws`: 1500
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1489 |
| Dixon-Coles NB | 65.33% | 0.1430 |
| MCMC Bayesiano | 61.33% | 0.1578 |
| XGBoost | 64.00% | 0.1470 |
| Red Neuronal | 61.33% | 0.1515 |
| CatBoost | 64.00% | 0.1468 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **62.67%** | **0.1429** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `90.58%`
- MCMC: `0.00%`
- XGB: `4.70%`
- MLP: `0.00%`
- CatBoost: `4.72%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `68.9s`

---

### 📍 Iteración 67/108 - Realizada el 2026-07-03 19:55:47

**Parámetros de Entrada:**
- `HALF_LIFE`: 400
- `theta_knockout`: -0.6
- `elo_scale_factor`: 1200.0
- `mcmc_draws`: 3000
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1489 |
| Dixon-Coles NB | 65.33% | 0.1430 |
| MCMC Bayesiano | 60.00% | 0.1578 |
| XGBoost | 64.00% | 0.1470 |
| Red Neuronal | 61.33% | 0.1515 |
| CatBoost | 64.00% | 0.1456 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **62.67%** | **0.1428** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `80.92%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `19.08%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `80.4s`

---

### 📍 Iteración 68/108 - Realizada el 2026-07-03 19:57:08

**Parámetros de Entrada:**
- `HALF_LIFE`: 400
- `theta_knockout`: -0.6
- `elo_scale_factor`: 1200.0
- `mcmc_draws`: 3000
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1489 |
| Dixon-Coles NB | 65.33% | 0.1430 |
| MCMC Bayesiano | 60.00% | 0.1578 |
| XGBoost | 64.00% | 0.1470 |
| Red Neuronal | 61.33% | 0.1515 |
| CatBoost | 64.00% | 0.1468 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **62.67%** | **0.1429** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `90.58%`
- MCMC: `0.00%`
- XGB: `4.70%`
- MLP: `0.00%`
- CatBoost: `4.72%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `82.6s`

---

### 📍 Iteración 69/108 - Realizada el 2026-07-03 19:58:31

**Parámetros de Entrada:**
- `HALF_LIFE`: 400
- `theta_knockout`: -0.6
- `elo_scale_factor`: 1500.0
- `mcmc_draws`: 1500
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1489 |
| Dixon-Coles NB | 65.33% | 0.1430 |
| MCMC Bayesiano | 61.33% | 0.1576 |
| XGBoost | 64.00% | 0.1470 |
| Red Neuronal | 61.33% | 0.1515 |
| CatBoost | 64.00% | 0.1456 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **62.67%** | **0.1428** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `80.90%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `19.10%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `67.3s`

---

### 📍 Iteración 70/108 - Realizada el 2026-07-03 19:59:39

**Parámetros de Entrada:**
- `HALF_LIFE`: 400
- `theta_knockout`: -0.6
- `elo_scale_factor`: 1500.0
- `mcmc_draws`: 1500
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1489 |
| Dixon-Coles NB | 65.33% | 0.1430 |
| MCMC Bayesiano | 61.33% | 0.1576 |
| XGBoost | 64.00% | 0.1470 |
| Red Neuronal | 61.33% | 0.1515 |
| CatBoost | 64.00% | 0.1468 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **62.67%** | **0.1429** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `90.58%`
- MCMC: `0.00%`
- XGB: `4.70%`
- MLP: `0.00%`
- CatBoost: `4.72%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `69.1s`

---

### 📍 Iteración 71/108 - Realizada el 2026-07-03 20:00:48

**Parámetros de Entrada:**
- `HALF_LIFE`: 400
- `theta_knockout`: -0.6
- `elo_scale_factor`: 1500.0
- `mcmc_draws`: 3000
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1489 |
| Dixon-Coles NB | 65.33% | 0.1430 |
| MCMC Bayesiano | 61.33% | 0.1576 |
| XGBoost | 64.00% | 0.1470 |
| Red Neuronal | 61.33% | 0.1515 |
| CatBoost | 64.00% | 0.1456 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **62.67%** | **0.1428** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `80.90%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `19.10%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `80.5s`

---

### 📍 Iteración 72/108 - Realizada el 2026-07-03 20:02:09

**Parámetros de Entrada:**
- `HALF_LIFE`: 400
- `theta_knockout`: -0.6
- `elo_scale_factor`: 1500.0
- `mcmc_draws`: 3000
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1489 |
| Dixon-Coles NB | 65.33% | 0.1430 |
| MCMC Bayesiano | 61.33% | 0.1576 |
| XGBoost | 64.00% | 0.1470 |
| Red Neuronal | 61.33% | 0.1515 |
| CatBoost | 64.00% | 0.1468 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **62.67%** | **0.1429** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `90.58%`
- MCMC: `0.00%`
- XGB: `4.70%`
- MLP: `0.00%`
- CatBoost: `4.72%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `81.2s`

---

### 📍 Iteración 73/108 - Realizada el 2026-07-03 20:03:31

**Parámetros de Entrada:**
- `HALF_LIFE`: 500
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 1500
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1514 |
| Dixon-Coles NB | 64.00% | 0.1452 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 65.33% | 0.1492 |
| Red Neuronal | 64.00% | 0.1535 |
| CatBoost | 62.67% | 0.1472 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **64.00%** | **0.1449** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `74.08%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `25.92%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `66.0s`

---

### 📍 Iteración 74/108 - Realizada el 2026-07-03 20:04:38

**Parámetros de Entrada:**
- `HALF_LIFE`: 500
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 1500
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1514 |
| Dixon-Coles NB | 64.00% | 0.1452 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 65.33% | 0.1492 |
| Red Neuronal | 64.00% | 0.1535 |
| CatBoost | 64.00% | 0.1469 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **64.00%** | **0.1448** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `71.16%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `28.84%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `67.4s`

---

### 📍 Iteración 75/108 - Realizada el 2026-07-03 20:05:45

**Parámetros de Entrada:**
- `HALF_LIFE`: 500
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 3000
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1514 |
| Dixon-Coles NB | 64.00% | 0.1452 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 65.33% | 0.1492 |
| Red Neuronal | 64.00% | 0.1535 |
| CatBoost | 62.67% | 0.1472 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **64.00%** | **0.1449** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `74.07%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `25.93%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `79.8s`

---

### 📍 Iteración 76/108 - Realizada el 2026-07-03 20:07:06

**Parámetros de Entrada:**
- `HALF_LIFE`: 500
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 3000
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1514 |
| Dixon-Coles NB | 64.00% | 0.1452 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 65.33% | 0.1492 |
| Red Neuronal | 64.00% | 0.1535 |
| CatBoost | 64.00% | 0.1469 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **64.00%** | **0.1448** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `71.15%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `28.85%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `81.8s`

---

### 📍 Iteración 77/108 - Realizada el 2026-07-03 20:08:28

**Parámetros de Entrada:**
- `HALF_LIFE`: 500
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1200.0
- `mcmc_draws`: 1500
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1514 |
| Dixon-Coles NB | 64.00% | 0.1452 |
| MCMC Bayesiano | 61.33% | 0.1578 |
| XGBoost | 65.33% | 0.1492 |
| Red Neuronal | 64.00% | 0.1535 |
| CatBoost | 62.67% | 0.1472 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **64.00%** | **0.1449** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `74.04%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `25.96%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `66.0s`

---

### 📍 Iteración 78/108 - Realizada el 2026-07-03 20:09:34

**Parámetros de Entrada:**
- `HALF_LIFE`: 500
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1200.0
- `mcmc_draws`: 1500
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1514 |
| Dixon-Coles NB | 64.00% | 0.1452 |
| MCMC Bayesiano | 61.33% | 0.1578 |
| XGBoost | 65.33% | 0.1492 |
| Red Neuronal | 64.00% | 0.1535 |
| CatBoost | 64.00% | 0.1469 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **64.00%** | **0.1448** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `71.11%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `28.89%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `67.1s`

---

### 📍 Iteración 79/108 - Realizada el 2026-07-03 20:10:42

**Parámetros de Entrada:**
- `HALF_LIFE`: 500
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1200.0
- `mcmc_draws`: 3000
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1514 |
| Dixon-Coles NB | 64.00% | 0.1452 |
| MCMC Bayesiano | 60.00% | 0.1578 |
| XGBoost | 65.33% | 0.1492 |
| Red Neuronal | 64.00% | 0.1535 |
| CatBoost | 62.67% | 0.1472 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **64.00%** | **0.1449** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `74.04%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `25.96%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `80.6s`

---

### 📍 Iteración 80/108 - Realizada el 2026-07-03 20:12:03

**Parámetros de Entrada:**
- `HALF_LIFE`: 500
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1200.0
- `mcmc_draws`: 3000
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1514 |
| Dixon-Coles NB | 64.00% | 0.1452 |
| MCMC Bayesiano | 60.00% | 0.1578 |
| XGBoost | 65.33% | 0.1492 |
| Red Neuronal | 64.00% | 0.1535 |
| CatBoost | 64.00% | 0.1469 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **64.00%** | **0.1448** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `71.12%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `28.88%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `82.1s`

---

### 📍 Iteración 81/108 - Realizada el 2026-07-03 20:13:26

**Parámetros de Entrada:**
- `HALF_LIFE`: 500
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1500.0
- `mcmc_draws`: 1500
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1514 |
| Dixon-Coles NB | 64.00% | 0.1452 |
| MCMC Bayesiano | 61.33% | 0.1576 |
| XGBoost | 65.33% | 0.1492 |
| Red Neuronal | 64.00% | 0.1535 |
| CatBoost | 62.67% | 0.1472 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **64.00%** | **0.1449** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `74.00%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `26.00%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `66.4s`

---

### 📍 Iteración 82/108 - Realizada el 2026-07-03 20:14:32

**Parámetros de Entrada:**
- `HALF_LIFE`: 500
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1500.0
- `mcmc_draws`: 1500
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1514 |
| Dixon-Coles NB | 64.00% | 0.1452 |
| MCMC Bayesiano | 61.33% | 0.1576 |
| XGBoost | 65.33% | 0.1492 |
| Red Neuronal | 64.00% | 0.1535 |
| CatBoost | 64.00% | 0.1469 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **64.00%** | **0.1448** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `71.07%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `28.93%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `67.1s`

---

### 📍 Iteración 83/108 - Realizada el 2026-07-03 20:15:40

**Parámetros de Entrada:**
- `HALF_LIFE`: 500
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1500.0
- `mcmc_draws`: 3000
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1514 |
| Dixon-Coles NB | 64.00% | 0.1452 |
| MCMC Bayesiano | 61.33% | 0.1576 |
| XGBoost | 65.33% | 0.1492 |
| Red Neuronal | 64.00% | 0.1535 |
| CatBoost | 62.67% | 0.1472 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **64.00%** | **0.1449** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `74.00%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `26.00%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `80.3s`

---

### 📍 Iteración 84/108 - Realizada el 2026-07-03 20:17:01

**Parámetros de Entrada:**
- `HALF_LIFE`: 500
- `theta_knockout`: -0.2
- `elo_scale_factor`: 1500.0
- `mcmc_draws`: 3000
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1514 |
| Dixon-Coles NB | 64.00% | 0.1452 |
| MCMC Bayesiano | 61.33% | 0.1576 |
| XGBoost | 65.33% | 0.1492 |
| Red Neuronal | 64.00% | 0.1535 |
| CatBoost | 64.00% | 0.1469 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **64.00%** | **0.1448** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `71.07%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `28.93%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `81.9s`

---

### 📍 Iteración 85/108 - Realizada el 2026-07-03 20:18:23

**Parámetros de Entrada:**
- `HALF_LIFE`: 500
- `theta_knockout`: -0.4
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 1500
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1514 |
| Dixon-Coles NB | 64.00% | 0.1452 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 65.33% | 0.1493 |
| Red Neuronal | 64.00% | 0.1535 |
| CatBoost | 62.67% | 0.1472 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **64.00%** | **0.1449** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `74.24%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `25.76%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `66.2s`

---

### 📍 Iteración 86/108 - Realizada el 2026-07-03 20:19:30

**Parámetros de Entrada:**
- `HALF_LIFE`: 500
- `theta_knockout`: -0.4
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 1500
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1514 |
| Dixon-Coles NB | 64.00% | 0.1452 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 65.33% | 0.1493 |
| Red Neuronal | 64.00% | 0.1535 |
| CatBoost | 64.00% | 0.1469 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **64.00%** | **0.1449** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `71.33%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `28.67%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `67.3s`

---

### 📍 Iteración 87/108 - Realizada el 2026-07-03 20:20:38

**Parámetros de Entrada:**
- `HALF_LIFE`: 500
- `theta_knockout`: -0.4
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 3000
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1514 |
| Dixon-Coles NB | 64.00% | 0.1452 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 65.33% | 0.1493 |
| Red Neuronal | 64.00% | 0.1535 |
| CatBoost | 62.67% | 0.1472 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **64.00%** | **0.1449** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `74.24%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `25.76%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `80.0s`

---

### 📍 Iteración 88/108 - Realizada el 2026-07-03 20:21:58

**Parámetros de Entrada:**
- `HALF_LIFE`: 500
- `theta_knockout`: -0.4
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 3000
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1514 |
| Dixon-Coles NB | 64.00% | 0.1452 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 65.33% | 0.1493 |
| Red Neuronal | 64.00% | 0.1535 |
| CatBoost | 64.00% | 0.1469 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **64.00%** | **0.1449** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `71.33%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `28.67%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `82.3s`

---

### 📍 Iteración 89/108 - Realizada el 2026-07-03 20:23:21

**Parámetros de Entrada:**
- `HALF_LIFE`: 500
- `theta_knockout`: -0.4
- `elo_scale_factor`: 1200.0
- `mcmc_draws`: 1500
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1514 |
| Dixon-Coles NB | 64.00% | 0.1452 |
| MCMC Bayesiano | 61.33% | 0.1578 |
| XGBoost | 65.33% | 0.1493 |
| Red Neuronal | 64.00% | 0.1535 |
| CatBoost | 62.67% | 0.1472 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **64.00%** | **0.1449** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `74.20%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `25.80%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `66.4s`

---

### 📍 Iteración 90/108 - Realizada el 2026-07-03 20:24:28

**Parámetros de Entrada:**
- `HALF_LIFE`: 500
- `theta_knockout`: -0.4
- `elo_scale_factor`: 1200.0
- `mcmc_draws`: 1500
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1514 |
| Dixon-Coles NB | 64.00% | 0.1452 |
| MCMC Bayesiano | 61.33% | 0.1578 |
| XGBoost | 65.33% | 0.1493 |
| Red Neuronal | 64.00% | 0.1535 |
| CatBoost | 64.00% | 0.1469 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **64.00%** | **0.1449** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `71.28%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `28.72%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `67.7s`

---

### 📍 Iteración 91/108 - Realizada el 2026-07-03 20:25:36

**Parámetros de Entrada:**
- `HALF_LIFE`: 500
- `theta_knockout`: -0.4
- `elo_scale_factor`: 1200.0
- `mcmc_draws`: 3000
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1514 |
| Dixon-Coles NB | 64.00% | 0.1452 |
| MCMC Bayesiano | 60.00% | 0.1578 |
| XGBoost | 65.33% | 0.1493 |
| Red Neuronal | 64.00% | 0.1535 |
| CatBoost | 62.67% | 0.1472 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **64.00%** | **0.1449** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `74.21%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `25.79%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `84.5s`

---

### 📍 Iteración 92/108 - Realizada el 2026-07-03 20:27:01

**Parámetros de Entrada:**
- `HALF_LIFE`: 500
- `theta_knockout`: -0.4
- `elo_scale_factor`: 1200.0
- `mcmc_draws`: 3000
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1514 |
| Dixon-Coles NB | 64.00% | 0.1452 |
| MCMC Bayesiano | 60.00% | 0.1578 |
| XGBoost | 65.33% | 0.1493 |
| Red Neuronal | 64.00% | 0.1535 |
| CatBoost | 64.00% | 0.1469 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **64.00%** | **0.1449** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `71.29%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `28.71%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `80.9s`

---

### 📍 Iteración 93/108 - Realizada el 2026-07-03 20:28:23

**Parámetros de Entrada:**
- `HALF_LIFE`: 500
- `theta_knockout`: -0.4
- `elo_scale_factor`: 1500.0
- `mcmc_draws`: 1500
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1514 |
| Dixon-Coles NB | 64.00% | 0.1452 |
| MCMC Bayesiano | 61.33% | 0.1576 |
| XGBoost | 65.33% | 0.1493 |
| Red Neuronal | 64.00% | 0.1535 |
| CatBoost | 62.67% | 0.1472 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **64.00%** | **0.1449** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `74.16%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `25.84%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `66.4s`

---

### 📍 Iteración 94/108 - Realizada el 2026-07-03 20:29:30

**Parámetros de Entrada:**
- `HALF_LIFE`: 500
- `theta_knockout`: -0.4
- `elo_scale_factor`: 1500.0
- `mcmc_draws`: 1500
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1514 |
| Dixon-Coles NB | 64.00% | 0.1452 |
| MCMC Bayesiano | 61.33% | 0.1576 |
| XGBoost | 65.33% | 0.1493 |
| Red Neuronal | 64.00% | 0.1535 |
| CatBoost | 64.00% | 0.1469 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **64.00%** | **0.1449** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `71.24%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `28.76%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `67.6s`

---

### 📍 Iteración 95/108 - Realizada el 2026-07-03 20:30:38

**Parámetros de Entrada:**
- `HALF_LIFE`: 500
- `theta_knockout`: -0.4
- `elo_scale_factor`: 1500.0
- `mcmc_draws`: 3000
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1514 |
| Dixon-Coles NB | 64.00% | 0.1452 |
| MCMC Bayesiano | 61.33% | 0.1576 |
| XGBoost | 65.33% | 0.1493 |
| Red Neuronal | 64.00% | 0.1535 |
| CatBoost | 62.67% | 0.1472 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **64.00%** | **0.1449** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `74.16%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `25.84%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `80.2s`

---

### 📍 Iteración 96/108 - Realizada el 2026-07-03 20:31:59

**Parámetros de Entrada:**
- `HALF_LIFE`: 500
- `theta_knockout`: -0.4
- `elo_scale_factor`: 1500.0
- `mcmc_draws`: 3000
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1514 |
| Dixon-Coles NB | 64.00% | 0.1452 |
| MCMC Bayesiano | 61.33% | 0.1576 |
| XGBoost | 65.33% | 0.1493 |
| Red Neuronal | 64.00% | 0.1535 |
| CatBoost | 64.00% | 0.1469 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **64.00%** | **0.1449** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `71.24%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `28.76%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `81.5s`

---

### 📍 Iteración 97/108 - Realizada el 2026-07-03 20:33:21

**Parámetros de Entrada:**
- `HALF_LIFE`: 500
- `theta_knockout`: -0.6
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 1500
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1514 |
| Dixon-Coles NB | 64.00% | 0.1452 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 65.33% | 0.1493 |
| Red Neuronal | 64.00% | 0.1536 |
| CatBoost | 62.67% | 0.1473 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **64.00%** | **0.1449** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `74.41%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `25.59%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `66.3s`

---

### 📍 Iteración 98/108 - Realizada el 2026-07-03 20:34:28

**Parámetros de Entrada:**
- `HALF_LIFE`: 500
- `theta_knockout`: -0.6
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 1500
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1514 |
| Dixon-Coles NB | 64.00% | 0.1452 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 65.33% | 0.1493 |
| Red Neuronal | 64.00% | 0.1536 |
| CatBoost | 64.00% | 0.1470 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **65.33%** | **0.1449** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `71.50%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `28.50%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `67.6s`

---

### 📍 Iteración 99/108 - Realizada el 2026-07-03 20:35:36

**Parámetros de Entrada:**
- `HALF_LIFE`: 500
- `theta_knockout`: -0.6
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 3000
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1514 |
| Dixon-Coles NB | 64.00% | 0.1452 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 65.33% | 0.1493 |
| Red Neuronal | 64.00% | 0.1536 |
| CatBoost | 62.67% | 0.1473 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **64.00%** | **0.1449** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `74.40%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `25.60%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `80.7s`

---

### 📍 Iteración 100/108 - Realizada el 2026-07-03 20:36:57

**Parámetros de Entrada:**
- `HALF_LIFE`: 500
- `theta_knockout`: -0.6
- `elo_scale_factor`: 1000.0
- `mcmc_draws`: 3000
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1514 |
| Dixon-Coles NB | 64.00% | 0.1452 |
| MCMC Bayesiano | 60.00% | 0.1582 |
| XGBoost | 65.33% | 0.1493 |
| Red Neuronal | 64.00% | 0.1536 |
| CatBoost | 64.00% | 0.1470 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **65.33%** | **0.1449** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `71.50%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `28.50%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `85.5s`

---

### 📍 Iteración 101/108 - Realizada el 2026-07-03 20:38:23

**Parámetros de Entrada:**
- `HALF_LIFE`: 500
- `theta_knockout`: -0.6
- `elo_scale_factor`: 1200.0
- `mcmc_draws`: 1500
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1514 |
| Dixon-Coles NB | 64.00% | 0.1452 |
| MCMC Bayesiano | 61.33% | 0.1578 |
| XGBoost | 65.33% | 0.1493 |
| Red Neuronal | 64.00% | 0.1536 |
| CatBoost | 62.67% | 0.1473 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **64.00%** | **0.1449** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `74.36%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `25.64%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `65.7s`

---

### 📍 Iteración 102/108 - Realizada el 2026-07-03 20:39:29

**Parámetros de Entrada:**
- `HALF_LIFE`: 500
- `theta_knockout`: -0.6
- `elo_scale_factor`: 1200.0
- `mcmc_draws`: 1500
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1514 |
| Dixon-Coles NB | 64.00% | 0.1452 |
| MCMC Bayesiano | 61.33% | 0.1578 |
| XGBoost | 65.33% | 0.1493 |
| Red Neuronal | 64.00% | 0.1536 |
| CatBoost | 64.00% | 0.1470 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **65.33%** | **0.1449** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `71.45%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `28.55%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `68.1s`

---

### 📍 Iteración 103/108 - Realizada el 2026-07-03 20:40:38

**Parámetros de Entrada:**
- `HALF_LIFE`: 500
- `theta_knockout`: -0.6
- `elo_scale_factor`: 1200.0
- `mcmc_draws`: 3000
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1514 |
| Dixon-Coles NB | 64.00% | 0.1452 |
| MCMC Bayesiano | 60.00% | 0.1578 |
| XGBoost | 65.33% | 0.1493 |
| Red Neuronal | 64.00% | 0.1536 |
| CatBoost | 62.67% | 0.1473 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **64.00%** | **0.1449** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `74.37%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `25.63%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `81.3s`

---

### 📍 Iteración 104/108 - Realizada el 2026-07-03 20:42:00

**Parámetros de Entrada:**
- `HALF_LIFE`: 500
- `theta_knockout`: -0.6
- `elo_scale_factor`: 1200.0
- `mcmc_draws`: 3000
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1514 |
| Dixon-Coles NB | 64.00% | 0.1452 |
| MCMC Bayesiano | 60.00% | 0.1578 |
| XGBoost | 65.33% | 0.1493 |
| Red Neuronal | 64.00% | 0.1536 |
| CatBoost | 64.00% | 0.1470 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **65.33%** | **0.1449** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `71.46%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `28.54%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `80.7s`

---

### 📍 Iteración 105/108 - Realizada el 2026-07-03 20:43:21

**Parámetros de Entrada:**
- `HALF_LIFE`: 500
- `theta_knockout`: -0.6
- `elo_scale_factor`: 1500.0
- `mcmc_draws`: 1500
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1514 |
| Dixon-Coles NB | 64.00% | 0.1452 |
| MCMC Bayesiano | 61.33% | 0.1576 |
| XGBoost | 65.33% | 0.1493 |
| Red Neuronal | 64.00% | 0.1536 |
| CatBoost | 62.67% | 0.1473 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **64.00%** | **0.1449** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `74.32%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `25.68%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `65.7s`

---

### 📍 Iteración 106/108 - Realizada el 2026-07-03 20:44:27

**Parámetros de Entrada:**
- `HALF_LIFE`: 500
- `theta_knockout`: -0.6
- `elo_scale_factor`: 1500.0
- `mcmc_draws`: 1500
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1514 |
| Dixon-Coles NB | 64.00% | 0.1452 |
| MCMC Bayesiano | 61.33% | 0.1576 |
| XGBoost | 65.33% | 0.1493 |
| Red Neuronal | 64.00% | 0.1536 |
| CatBoost | 64.00% | 0.1470 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **64.00%** | **0.1449** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `71.41%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `28.59%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `67.0s`

---

### 📍 Iteración 107/108 - Realizada el 2026-07-03 20:45:35

**Parámetros de Entrada:**
- `HALF_LIFE`: 500
- `theta_knockout`: -0.6
- `elo_scale_factor`: 1500.0
- `mcmc_draws`: 3000
- `cb_depth`: 3

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1514 |
| Dixon-Coles NB | 64.00% | 0.1452 |
| MCMC Bayesiano | 61.33% | 0.1576 |
| XGBoost | 65.33% | 0.1493 |
| Red Neuronal | 64.00% | 0.1536 |
| CatBoost | 62.67% | 0.1473 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **64.00%** | **0.1449** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `74.32%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `25.68%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `80.6s`

---

### 📍 Iteración 108/108 - Realizada el 2026-07-03 20:46:56

**Parámetros de Entrada:**
- `HALF_LIFE`: 500
- `theta_knockout`: -0.6
- `elo_scale_factor`: 1500.0
- `mcmc_draws`: 3000
- `cb_depth`: 4

| Modelo | Accuracy 1X2 (%) | RPS Promedio |
| :--- | :---: | :---: |
| Dixon-Coles | 62.67% | 0.1514 |
| Dixon-Coles NB | 64.00% | 0.1452 |
| MCMC Bayesiano | 61.33% | 0.1576 |
| XGBoost | 65.33% | 0.1493 |
| Red Neuronal | 64.00% | 0.1536 |
| CatBoost | 64.00% | 0.1470 |
| MFA Montecarlo | 61.33% | 0.1639 |
| **Ensemble Optimizado** | **64.00%** | **0.1449** |

**Ponderaciones SLSQP (w_opt):**
- DC Poisson: `0.00%`
- DC NB: `71.41%`
- MCMC: `0.00%`
- XGB: `0.00%`
- MLP: `0.00%`
- CatBoost: `28.59%`
- MFA: `0.00%`

Tiempo de ejecución de la corrida: `83.3s`

---

