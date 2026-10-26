import React from 'react';
import { createRoot } from 'react-dom/client';
import VehicleIntakeApp from './VehicleIntakeApp.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <VehicleIntakeApp />
  </React.StrictMode>,
);
