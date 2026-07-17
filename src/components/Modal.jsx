import React from 'react';

export default function Modal({ children, onClose }) {
  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        {children}
      </div>
    </div>
  );
}
