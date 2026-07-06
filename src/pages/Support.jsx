import React, { useState } from 'react';
const API_URL = 'https://mundial-ml-backend.onrender.com/api/contacto';
export default function Support() {
  const [form, setForm] = useState({nombre:'',email:'',tipo:'Comentario',mensaje:''});
  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);
  function onChange(e){setForm({...form,[e.target.name]:e.target.value})}
  async function onSubmit(e){
    e.preventDefault();setSending(true);setStatus(null);
    try{const res=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
      if(res.ok){setStatus('success');setForm({nombre:'',email:'',tipo:'Comentario',mensaje:''})}else setStatus('error');
    }catch{setStatus('error')}
    setSending(false);setTimeout(()=>setStatus(null),5000);
  }
  return (<div>
    <h1 style={{marginBottom:'0.3rem'}}>Soporte y ayuda</h1>
    <p style={{color:'var(--text-secondary)',marginBottom:'2rem'}}>¿Tienes alguna duda, problema técnico o comentario? Escríbenos.</p>
    <form className="support-form" onSubmit={onSubmit}>
      <div className="form-group"><label htmlFor="nombre">Nombre</label><input id="nombre" name="nombre" value={form.nombre} onChange={onChange} required placeholder="Tu nombre"/></div>
      <div className="form-group"><label htmlFor="email">Correo electrónico</label><input id="email" name="email" type="email" value={form.email} onChange={onChange} required placeholder="tu@correo.com"/></div>
      <div className="form-group"><label htmlFor="tipo">Tipo de mensaje</label><select id="tipo" name="tipo" value={form.tipo} onChange={onChange}><option value="Problema">Problema técnico</option><option value="Comentario">Comentario o sugerencia</option><option value="Otro">Otro</option></select></div>
      <div className="form-group"><label htmlFor="mensaje">Mensaje</label><textarea id="mensaje" name="mensaje" value={form.mensaje} onChange={onChange} required placeholder="Describe tu problema o comentario..."/></div>
      <button type="submit" className="btn btn-accent" disabled={sending} style={{width:'100%'}}>{sending?'Enviando...':'Enviar mensaje'}</button>
    </form>
    {status==='success'&&<div className="toast success">Mensaje enviado correctamente</div>}
    {status==='error'&&<div className="toast error">Error al enviar. Intenta de nuevo.</div>}
  </div>);
}
