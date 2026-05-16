/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AnimatePresence } from 'motion/react';
import { PresupuestoProvider, usePresupuesto } from './context/PresupuestoContext';
import { Header } from './components/layout/Header';
import { CaratulaTab } from './tabs/CaratulaTab';
import { PresupuestoTab } from './tabs/PresupuestoTab';
import { CronogramaTab } from './tabs/CronogramaTab';
import { ResumenTab } from './tabs/ResumenTab';

const AppContent: React.FC = () => {
  const { activeTab } = usePresupuesto();

  return (
    <div className="min-h-screen bg-paper overflow-x-hidden selection:bg-primary selection:text-forest">
      <Header />
      
      <main className="relative">
        <AnimatePresence mode="wait">
          {activeTab === 'caratula' && <CaratulaTab key="caratula" />}
          {activeTab === 'presupuesto' && <PresupuestoTab key="presupuesto" />}
          {activeTab === 'cronograma' && <CronogramaTab key="cronograma" />}
          {activeTab === 'resumen' && <ResumenTab key="resumen" />}
        </AnimatePresence>
      </main>

      <footer className="mt-20 py-12 border-t border-linen">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <h4 className="font-serif text-xl font-bold text-forest">KaclHub</h4>
            <p className="text-sm text-graphite/60 mt-1">Sistema de Presupuestación de Obra · 2026</p>
          </div>
          <div className="flex gap-8 text-xs font-bold uppercase tracking-widest text-graphite/40">
            <a href="#" className="hover:text-forest transition-colors">#</a>
            <a href="#" className="hover:text-forest transition-colors">#</a>
            <a href="#" className="hover:text-forest transition-colors">#</a>
          </div>
          <p className="text-[10px] text-graphite/30 uppercase font-bold">
            Versión 1.0.0 · Académico
          </p>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <PresupuestoProvider>
      <AppContent />
    </PresupuestoProvider>
  );
}

