import React from 'react';
import { motion } from 'motion/react';
import { FileUp, Save, HardHat } from 'lucide-react';
import { usePresupuesto } from '../../context/PresupuestoContext';
import { cn } from '../../utils/utils';

export const Header: React.FC = () => {
  const { state, activeTab, setActiveTab } = usePresupuesto();

  const tabs = [
    { id: 'caratula', label: 'Carátula' },
    { id: 'presupuesto', label: 'Presupuesto' },
    { id: 'resumen', label: 'Resumen & Entrega' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="bg-forest text-white px-6 py-4 flex items-center justify-between shadow-lg relative overflow-hidden">
        {/* Grain Overlay */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="bg-primary p-2 rounded-lg text-forest">
            <HardHat size={24} />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight">KaclHub</h1>
            <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Barranquilla · Colombia</p>
          </div>
        </div>

        <div className="hidden lg:block text-center flex-1 mx-12">
          <p className="text-sm font-medium text-linen/60 uppercase tracking-widest">Proyecto en curso</p>
          <h2 className="text-lg font-serif font-semibold truncate max-w-md mx-auto">
            {state.caratula.nombre || 'Nuevo Proyecto sin Título'}
          </h2>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-xs font-bold uppercase tracking-widest">
            <FileUp size={16} />
            <span className="hidden sm:inline">Importar</span>
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-forest hover:bg-primary-light transition-colors text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20">
            <Save size={16} />
            <span className="hidden sm:inline">Guardar</span>
          </button>
        </div>
      </div>

      <nav className="bg-white/80 backdrop-blur-md border-b border-linen px-6">
        <div className="max-w-7xl mx-auto flex justify-center gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "relative py-4 text-sm font-bold uppercase tracking-widest transition-colors",
                activeTab === tab.id ? "text-forest" : "text-graphite hover:text-forest"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
};
