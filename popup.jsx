import React from 'react';
import { createRoot } from 'react-dom/client';
import MainApp from './src/components/MainApp';
import './src/styles/globals.css';

const root = createRoot(document.getElementById('root'));
root.render(
  <div className="fixed-size-panel">
    <MainApp />
  </div>
);
