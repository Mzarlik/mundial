import React from 'react';
export default function HowToTest() {
  return (<div>
    <h1 style={{marginBottom:'0.5rem'}}>Cómo probar el código</h1>
    <p style={{color:'var(--text-secondary)',marginBottom:'2rem'}}>Cada predicción se genera con un notebook de Python que puedes ejecutar en Google Colab, completamente gratis y sin instalar nada.</p>
    <div className="steps">
      <div className="step-item"><div className="step-num">1</div><div className="step-text"><h3>Abre el enlace de Google Drive</h3><p>En cada ficha de partido hay un botón "Probar código" que te lleva al notebook en Drive.</p></div></div>
      <div className="step-item"><div className="step-num">2</div><div className="step-text"><h3>Abre con Google Colab</h3><p>Clic derecho sobre el archivo .ipynb, "Abrir con", "Google Colaboratory".</p></div></div>
      <div className="step-item"><div className="step-num">3</div><div className="step-text"><h3>Ejecuta todas las celdas</h3><p>"Entorno de ejecución" y "Ejecutar todo" (Ctrl+F9). El notebook descargará los datos y generará las predicciones en 1-2 minutos.</p></div></div>
      <div className="step-item"><div className="step-num">4</div><div className="step-text"><h3>Explora y modifica</h3><p>Cambia equipos, ajusta hiperparámetros o agrega variables. Todo el código está comentado.</p></div></div>
    </div>
    <div className="card" style={{marginTop:'2rem'}}><h3 style={{color:'var(--accent)'}}>Requisitos</h3><p style={{color:'var(--text-secondary)',fontSize:'0.9rem'}}>Solo necesitas una cuenta de Google (gratuita). Google Colab proporciona todo en la nube.</p></div>
    <div className="match-disclaimer" style={{marginTop:'2rem'}}>Los modelos son ejercicios académicos. La precisión típica ronda el 55-60% para el resultado y menos del 20% para el marcador exacto.</div>
  </div>);
}
