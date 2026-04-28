"use client";

import React from 'react';

type PhoneModalProps = {
  onClose?: () => void;
};

// Very light modal placeholder for the dashboard
const PhoneModal: React.FC<PhoneModalProps> = ({ onClose }) => {
  return (
    <div style={backdropStyle} aria-label="PhoneModal">
      <div style={modalStyle}>
        <button
          aria-label="Cerrar"
          onClick={(e) => {
            e.stopPropagation();
            onClose?.();
          }}
          style={closeBtnStyle}
        >
          ×
        </button>
        <div style={headerStyle}>Hola, solo un paso mas</div>
        <p style={paragraphStyle}>
          Dejanos tu WhatsApp para enviarte nuevos cuestionarios y guardar tu progreso.
        </p>
        {/* Campos simples para simular el modal; el formulario real puede ir aquí */}
        <div style={fieldStyle}>WhatsApp</div>
        <div style={fieldInputStyle}>
          <span style={phoneIconStyle}>📞</span> Ej: 3511234567
        </div>
        <div style={fieldStyle}>Tu carrera</div>
        <div style={fieldInputStyle}>Selecciona tu carrera</div>
      </div>
    </div>
  );
};

export default PhoneModal;

// Inline styles (simples) para evitar dependencias de CSS
const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.25)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};
const modalStyle: React.CSSProperties = {
  width: '480px',
  maxWidth: '90%',
  background: '#fff',
  borderRadius: '12px',
  padding: '20px 20px 24px',
  position: 'relative',
  boxShadow: '0 10px 25px rgba(0,0,0,.15)',
};
const closeBtnStyle: React.CSSProperties = {
  position: 'absolute',
  top: '8px',
  right: '8px',
  background: 'transparent',
  border: 'none',
  fontSize: '20px',
  cursor: 'pointer',
};
const headerStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: '22px',
  textAlign: 'center',
  marginTop: '8px',
};
const paragraphStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#555',
  margin: '12px 0 20px',
};
const fieldStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#666',
  margin: '12px 0 6px',
};
const fieldInputStyle: React.CSSProperties = {
  height: '40px',
  border: '1px solid #ddd',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  padding: '0 12px',
  color: '#666',
  background: '#f9f9f9',
};
const phoneIconStyle: React.CSSProperties = {
  marginRight: '8px',
};
