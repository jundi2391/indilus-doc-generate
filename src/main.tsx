import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import DocumentEditor from './components/DocumentEditor';
import { Sidebar } from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import Companies from './pages/Companies';
import Products from './pages/Products';
import Verify from './pages/Verify';
import DocumentList from './pages/DocumentList';
import { Toaster } from 'react-hot-toast';
import { CompanyProvider } from './CompanyContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CompanyProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/verify/:id" element={<Verify />} />
          <Route path="/" element={<Sidebar><Dashboard /></Sidebar>} />
          <Route path="/contacts" element={<Sidebar><Contacts /></Sidebar>} />
          <Route path="/companies" element={<Sidebar><Companies /></Sidebar>} />
          <Route path="/products" element={<Sidebar><Products /></Sidebar>} />
          <Route path="/documents/:type/new" element={<Sidebar><DocumentEditor /></Sidebar>} />
          <Route path="/documents/:type/:id" element={<Sidebar><DocumentEditor /></Sidebar>} />
          <Route path="/documents/:type" element={<Sidebar><DocumentList /></Sidebar>} />
        </Routes>
      </BrowserRouter>
    </CompanyProvider>
  </StrictMode>
);
