import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DemoShell } from './components/DemoShell';
import './demo.css';

const root = document.getElementById('root');
if (!root) throw new Error('The page needs an element with id "root".');

createRoot(root).render(
  <StrictMode>
    <DemoShell />
  </StrictMode>,
);
