import React from 'react';
export default function Disclaimer({ onAccept }) {
  return (
    <div className="disclaimer-overlay">
      <div className="disclaimer-box">
        <h1>Aviso importante</h1>
        <p>Los pronósticos contenidos en este sitio se basan en información de uso público disponible al momento de su elaboración y representan <strong>únicamente estimaciones generadas por modelos de Machine Learning con fines de entretenimiento y aprendizaje</strong>. En ningún caso constituyen una garantía de resultados, por lo que no se asegura el cumplimiento de ninguna predicción.</p>
        <p>Al acceder a este material, el usuario acepta y reconoce que se trata de <strong>opiniones y proyecciones estadísticas estimadas</strong>, no de resultados asegurados. La precisión de estos modelos es inherentemente limitada debido a la naturaleza aleatoria del deporte.</p>
        <p>En consecuencia, la autora de este sitio <strong>no asume responsabilidad alguna</strong> por decisiones, pérdidas, daños o cualquier consecuencia derivada del uso, interpretación o aplicación de la información aquí contenida. Cualquier decisión tomada con base en este material será <strong>responsabilidad exclusiva del usuario</strong>.</p>
        <p style={{ color: 'var(--accent-dark)', fontWeight: 500 }}>Este contenido no debe utilizarse como base para tomar decisiones que impliquen riesgo financiero de ningún tipo.</p>
        <button className="btn btn-accent" onClick={onAccept}>He leído y acepto las condiciones</button>
      </div>
    </div>
  );
}
