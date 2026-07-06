import React from 'react';

export default function HowToTest() {
  return (
    <div style={{ paddingBottom: '3rem' }}>
      <div className="home-hero" style={{ padding: '2rem 1.5rem', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Ecosistema de Código <span>& Guía de Ejecución</span></h1>
        <p style={{ maxWidth: '800px', margin: '0 auto', fontSize: '0.95rem' }}>
          Este proyecto es una suite completa que va desde el Web Scraping en vivo hasta el modelado predictivo estocástico.
          Conoce cómo reproducir los resultados en la nube o localmente.
        </p>
      </div>

      <div className="section-block">
        <h2>🛠️ Guía de Ejecución</h2>
        <div className="comparison-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
          
          {/* Tarjeta Ejecución Local */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>💻 Ejecución Local (Windows)</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Si deseas entrenar los modelos, calibrar ELO e iniciar el servidor web en tu propia máquina de forma automatizada:
              </p>
              <ul style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', margin: '1rem 0' }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Paso 1:</strong> Ejecuta <code>setup_env.bat</code> para crear el entorno virtual de Python (<code>.venv</code>) e instalar automáticamente las librerías necesarias (PyMC, XGBoost, CatBoost, Scikit-learn, etc.).
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Paso 2:</strong> Ejecuta <code>run_all.bat</code> para entrenar las 7 IAs globales, optimizar pesos matemáticos y generar los gráficos estocásticos en <code>public/graphs/</code>.
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Paso 3:</strong> Ejecuta <code>run_frontend.bat</code> para iniciar el servidor de desarrollo web en Node.js (Vite) en <code>http://localhost:5173/</code>.
                </li>
              </ul>
            </div>
            <div className="data-note" style={{ margin: 0, padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
              <strong>Nota:</strong> Si no tienes Node.js, el script de frontend te ofrecerá instalarlo automáticamente vía Winget.
            </div>
          </div>

          {/* Tarjeta Google Colab */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}>☁️ Ejecución en la Nube (Google Colab)</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Cada partido predictivo cuenta con un Notebook interactivo en la nube para ejecutar código y experimentar sin instalaciones locales:
              </p>
              <ul style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', margin: '1rem 0' }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Paso 1:</strong> Navega a la pestaña de un partido en la web y haz clic en el botón <strong>"Probar en Google Colab"</strong> para abrir el archivo <code>.ipynb</code> compartido.
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Paso 2:</strong> En la interfaz de Google Drive, selecciona <strong>"Abrir con Google Colaboratory"</strong> en el menú superior.
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Paso 3:</strong> Ve a <strong>"Entorno de ejecución" &gt; "Ejecutar todo"</strong> (o presiona <code>Ctrl+F9</code>). El notebook configurará la máquina virtual, bajará los datos y predecirá en 1-2 minutos.
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Paso 4:</strong> Modifica hiperparámetros directos o inyecta variables tácticas y ve cómo cambian los marcadores.
                </li>
              </ul>
            </div>
            <div className="match-disclaimer" style={{ margin: 0, padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
              <strong>Requisito:</strong> Solo necesitas una cuenta de Google activa para acceder a los recursos gratuitos de CPU de Colab.
            </div>
          </div>

        </div>
      </div>

      <div className="section-block">
        <h2>📂 Estructura y Módulos Desarrollados</h2>
        <p style={{ fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          El backend y los laboratorios de simulación están organizados en scripts especializados que componen el pipeline del proyecto:
        </p>

        <div className="comparison-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          
          <div className="card" style={{ padding: '1.25rem' }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>🧠 predict_matches.py</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
              Script medular del sistema. Carga los datos, entrena 6 arquitecturas de IA (Dixon-Coles Poisson/NB, MCMC PyMC, XGBoost, CatBoost, Red Neuronal MLP), optimiza el ensamble vía SLSQP, simula líneas de tiempo con Weibull y genera los gráficos.
            </p>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>🎲 simulate_knockout.py</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
              Motor de Monte Carlo para la fase eliminatoria (Bracket). Realiza 2,000 iteraciones estocásticas desde 16avos de final, bloqueando partidos ya jugados y prediciendo el resto mediante ELO y penaltis Beta-Binomiales.
            </p>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>♟️ simulate_swiss.py</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
              Laboratorio estocástico que simula el Mundial bajo un formato de Sistema Suizo puro de ajedrez (48 selecciones). Estima los puntos esperados (xPts), Buchholz y xG acumulado tras miles de iteraciones.
            </p>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>🔄 sync_and_generate.py</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
              Sincroniza marcadores reales del archivo <code>partidos_simulados.csv</code> con el dataset global <code>results.csv</code> e inyecta la estructura de jornadas y metadatos actualizados en la configuración del frontend React.
            </p>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>🕷️ scraper_tm.py / tm_scraper</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
              Web Scraper multihilo desarrollado con BeautifulSoup para extraer el valor de plantilla de mercado de las selecciones directamente desde Transfermarkt, utilizándolo como variable de peso financiero en las IAs.
            </p>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>📡 scrape_opta_stealth.py</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
              Extractor automatizado con evasión antibot (stealth headers) para adquirir estadísticas avanzadas de Opta, alimentando los modificadores xG tácticos que refinan las proyecciones de Dixon-Coles.
            </p>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>🧪 test_backtest.py</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
              Entorno de pruebas y validación retrospectiva. Evalúa el rendimiento de los modelos frente a un histórico no visto y reporta métricas de precisión y RPS (Ranked Probability Score).
            </p>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>📊 test_feature_importance.py</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
              Script analítico que calcula y grafica la importancia de las características (features) del modelo XGBoost (ELO, Valor de Mercado, Forma, H2H, Opta modifiers).
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
