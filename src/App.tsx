import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthCallback } from './components/AuthCallback';
import { Reservas } from './pages/Reservas';
import { Clientes } from './pages/Clientes';
import { Caja } from './pages/Caja';
import { Exportar } from './pages/Exportar';

function App() {
  const [currentView, setCurrentView] = useState<'reservas' | 'clientes' | 'caja' | 'exportar'>('reservas');

  const renderCurrentView = () => {
    switch (currentView) {
      case 'reservas':
        return <Reservas />;
      case 'clientes':
        return <Clientes />;
      case 'caja':
        return <Caja />;
      case 'exportar':
        return <Exportar />;
      default:
        return <Reservas />;
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={
          <Layout currentView={currentView} onViewChange={setCurrentView}>
            {renderCurrentView()}
          </Layout>
        } />
      </Routes>
    </Router>
  );
}

export default App;