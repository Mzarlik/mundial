import React from 'react';
import { Link } from 'react-router-dom';
export default function Home() {
  return (<div>
    <div className="home-hero">
      <h1>Fase de grupos <span>interactiva</span></h1>
      <p>Predicciones generadas con modelos de Machine Learning. Un ejercicio académico para explorar cómo la ciencia de datos intenta descifrar el deporte más impredecible del mundo.</p>
      <div style={{marginTop:'1.5rem',display:'flex',gap:'1rem',justifyContent:'center',flexWrap:'wrap'}}>
        <Link to="/resultados/jun22" className="btn btn-accent">Ver predicciones</Link>
        <Link to="/como-probar" className="btn btn-outline">Probar el código</Link>
      </div>
    </div>
    {/* CAMBIA: pon una imagen en public/images/hero_ml.png */}
    <img src="/images/hero_ml.png" alt="Machine Learning y fútbol" className="section-image" onError={e=>{e.target.style.display='none'}} />
    <div className="section-block">
      <h2>¿Qué es el Machine Learning?</h2>
      <p>El Machine Learning (aprendizaje automático) es una rama de la inteligencia artificial que permite a las computadoras aprender patrones a partir de datos históricos sin ser programadas explícitamente para cada caso. En lugar de seguir reglas fijas, un modelo de ML analiza miles de ejemplos pasados, encuentra regularidades estadísticas y las usa para hacer estimaciones sobre situaciones nuevas.</p>
      {/* CAMBIA: pon un diagrama en public/images/ml_diagram.png */}
      <img src="/images/ml_diagram.png" alt="Diagrama de Machine Learning" className="section-image" onError={e=>{e.target.style.display='none'}} />
      <p>En este proyecto, los modelos analizan más de 49,000 partidos internacionales registrados desde 1872 para estimar la probabilidad de cada resultado posible. No "adivinan": calculan distribuciones de probabilidad basadas en evidencia histórica.</p>
    </div>
    <div className="section-block">
      <h2>¿Por qué usar ML para predecir fútbol?</h2>
      <p>El fútbol es un laboratorio natural para la ciencia de datos: tiene reglas claras, datos abundantes y un resultado medible. Predecir partidos es un problema clásico en estadística deportiva, utilizado en universidades como caso de estudio para enseñar modelado probabilístico e ingeniería de variables.</p>
      {/* CAMBIA: pon una imagen en public/images/football_data.png */}
      <img src="/images/football_data.png" alt="Datos de fútbol" className="section-image" onError={e=>{e.target.style.display='none'}} />
      <p>Este proyecto es exactamente eso: <strong>un ejercicio académico</strong>. El objetivo no es "acertar" el marcador, sino entender cómo se construyen, evalúan y comparan modelos predictivos en un dominio real y accesible.</p>
    </div>
    <div className="section-block">
      <h2>Riesgos y limitaciones</h2>
      <p>El fútbol tiene una <strong>aleatoriedad irreducible</strong>: un rebote, una expulsión o un día inspirado de un jugador pueden cambiar el resultado. Ningún modelo puede eliminar esta incertidumbre. Los mejores modelos aciertan el resultado (1X2) entre un 50% y un 60%, y el marcador exacto menos del 20%.</p>
      <p>Además, estos modelos no ven factores clave como rotaciones, lesiones, clima, motivación táctica o presión psicológica. Por todo esto, <strong>la información de este sitio no debe utilizarse para tomar decisiones que impliquen riesgo financiero</strong>.</p>
    </div>
    <div className="section-block">
      <h2>Los modelos: enfoque estadístico vs Machine Learning</h2>
      <p>Comparamos dos familias de modelos sin declarar cuál es "mejor", porque cada uno tiene fortalezas distintas y su rendimiento varía según los datos.</p>
      <div className="comparison-grid">
        <div className="card">
          <h3>Modelo estadístico (Dixon-Coles)</h3>
          <p>Modelo paramétrico clásico (Dixon y Coles, 1997). Asume que los goles siguen una distribución de Poisson y estima un parámetro de ataque y defensa por selección. Incluye corrección para marcadores bajos y ventaja de local.</p>
          <p><strong>Ventaja:</strong> interpretable, funciona bien con pocos datos.<br/><strong>Limitación:</strong> asume independencia entre goles.</p>
        </div>
        <div className="card">
          <h3>XGBoost (gradient boosting)</h3>
          <p>Algoritmo de Machine Learning (Chen y Guestrin, 2016) que ensambla árboles de decisión secuencialmente. Usa objetivo Poisson para predecir goles esperados, alimentado por Dixon-Coles, ratings dinámicos (Elo, pi-ratings) y forma reciente.</p>
          <p><strong>Ventaja:</strong> captura relaciones no lineales, mejor accuracy.<br/><strong>Limitación:</strong> menos interpretable, riesgo de sobreajuste.</p>
        </div>
      </div>
      {/* CAMBIA: pon una comparación visual en public/images/models_comparison.png */}
      <img src="/images/models_comparison.png" alt="Comparación de modelos" className="section-image" onError={e=>{e.target.style.display='none'}} />
    </div>
    <div className="section-block">
      <h2>Accuracy: ¿qué tan confiable es?</h2>
      <p>Para medir un modelo de fútbol <strong>no se usa el acierto del marcador exacto</strong>. Se usan dos métricas estándar:</p>
      <ul>
        <li><strong>Accuracy 1X2:</strong> porcentaje de aciertos del resultado (local, empate o visitante). Un modelo aleatorio acertaría ~33%; los mejores llegan al 55-60%.</li>
        <li><strong>RPS (Ranked Probability Score):</strong> mide la calidad de la distribución completa. Penaliza más cuando el modelo está muy seguro de algo equivocado. Menor es mejor.</li>
      </ul>
      <p>Cada ficha de partido incluye una gráfica comparando el accuracy de ambos modelos sobre cientos de partidos fuera de muestra.</p>
    </div>
    <div style={{textAlign:'center',margin:'2rem 0'}}><Link to="/como-probar" className="btn btn-accent">Cómo probar el código</Link></div>
  </div>);
}
