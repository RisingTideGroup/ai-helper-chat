import React from 'react';
import { createRoot } from 'react-dom/client';
import MainApp from './src/components/MainApp';
import './src/styles/globals.css';

const root = createRoot(document.getElementById('chat-root'));
root.render(
  <div className="w-[360px] min-w-[320px] max-w-full mx-auto overflow-hidden">
    <MainApp />
  </div>
);
