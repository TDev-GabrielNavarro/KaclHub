import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePresupuesto } from '../context/PresupuestoContext';
import { 
  ClipboardList, 
  Layers, 
  Calculator, 
  ListChecks, 
  Percent, 
  Plus, 
  Trash2, 
  Info,
  ChevronDown
} from 'lucide-react';
import { cn, formatCOP } from '../utils/utils';

export const PresupuestoTab: React.FC = () => {
  const { state } = usePresupuesto();
  const [activeSubTab, setActiveSubTab] = useState(0);

  const subTabs = [
    { id: 0, label: '01 Anteproyecto', icon: ClipboardList },
    { id: 1, label: '02 Cantidades', icon: ListChecks },
    { id: 2, label: '03 APU', icon: Calculator },
    { id: 3, label: '04 Capítulos', icon: Layers },
    { id: 4, label: '05 AIU', icon: Percent },
  ];

  return (
    <div className="min-h-screen">
      {/* Sub Navigation */}
      <div className="sticky top-[120px] z-40 bg-forest/90 backdrop-blur-md border-b border-white/10 px-6 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto scrollbar-hide">
          <div className="flex gap-4">
            {subTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] transition-all whitespace-nowrap",
                  activeSubTab === tab.id 
                    ? "bg-primary text-forest shadow-xl shadow-primary/20 scale-105" 
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
          <div className="hidden lg:flex items-center gap-4 ml-8">
            <div className="h-1.5 w-32 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary" 
                initial={{ width: 0 }}
                animate={{ width: '40%' }}
              />
            </div>
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">40% Completado</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {activeSubTab === 0 && <AnteproyectoSection key="anteproyecto" items={state.anteproyecto} />}
          {activeSubTab === 3 && <CapitulosSection key="capitulos" items={state.capitulos} />}
          {/* Other sections would go here - creating two for demo */}
          {(activeSubTab === 1 || activeSubTab === 2 || activeSubTab === 4) && (
            <motion.div 
              key="placeholder"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="bg-white rounded-2xl p-12 text-center border border-linen shadow-warm"
            >
              <div className="w-20 h-20 bg-paper rounded-full flex items-center justify-center mx-auto mb-6 text-graphite/40">
                <Calculator size={40} />
              </div>
              <h3 className="font-serif text-2xl font-bold text-forest mb-2">Sección Profesional en Desarrollo</h3>
              <p className="text-graphite max-w-md mx-auto">
                Esta sección está siendo procesada para cumplir con los estándares de la normativa NSR-10.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const AnteproyectoSection: React.FC<{ items: any[] }> = ({ items }) => {
  const { addItem, removeItem, editItem, totals } = usePresupuesto();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="relative">
        <span className="absolute -top-10 -left-6 text-8xl font-serif font-bold text-forest/[0.03] pointer-events-none">01</span>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-3xl font-bold text-forest">Anteproyecto · Estudios Previos</h3>
            <p className="text-graphite">Estudios técnicos necesarios antes del inicio de obra física.</p>
          </div>
          <span className="px-4 py-1 bg-forest text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
            Independientes del AIU
          </span>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-4 text-blue-800 text-sm">
        <Info className="shrink-0" size={20} />
        <p>Estos valores representan la inversión inicial en consultoría técnica y legal. Suelen contratarse por suma global.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-warm border border-linen overflow-hidden card-hover">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-pine text-white text-xs font-bold uppercase tracking-widest">
              <th className="px-6 py-4">Estudio / Servicio</th>
              <th className="px-6 py-4">Responsable</th>
              <th className="px-6 py-4">Unidad</th>
              <th className="px-6 py-4 text-right">Valor Unitario</th>
              <th className="px-6 py-4 text-right">Total</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-linen">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-paper transition-colors">
                <td className="px-6 py-4">
                  <input 
                    type="text" 
                    value={item.item} 
                    onChange={(e) => editItem('anteproyecto', item.id, { item: e.target.value })}
                    className="w-full bg-transparent border-none focus:ring-0 font-medium outline-none"
                  />
                </td>
                <td className="px-6 py-4">
                  <input 
                    type="text" 
                    value={item.responsable} 
                    onChange={(e) => editItem('anteproyecto', item.id, { responsable: e.target.value })}
                    className="w-full bg-transparent border-none focus:ring-0 text-sm text-graphite outline-none"
                  />
                </td>
                <td className="px-6 py-4">
                  <input 
                    type="text" 
                    value={item.unidad} 
                    onChange={(e) => editItem('anteproyecto', item.id, { unidad: e.target.value })}
                    className="w-16 bg-transparent border-none focus:ring-0 text-sm outline-none"
                  />
                </td>
                <td className="px-6 py-4 text-right">
                  <input 
                    type="number" 
                    value={item.valorUnitario} 
                    onChange={(e) => editItem('anteproyecto', item.id, { valorUnitario: parseFloat(e.target.value) || 0 })}
                    className="w-32 bg-transparent border-none text-right focus:ring-0 font-medium tabular-nums outline-none"
                  />
                </td>
                <td className="px-6 py-4 text-right font-bold tabular-nums text-forest">
                  {formatCOP(item.valorUnitario * item.cantidad)}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => removeItem('anteproyecto', item.id)}
                    className="text-graphite/40 hover:text-danger transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-paper font-bold text-forest uppercase tracking-widest text-xs">
              <td colSpan={4} className="px-6 py-4 text-right">Total Anteproyecto</td>
              <td className="px-6 py-4 text-right text-lg font-serif">
                {formatCOP(totals.totalAnteproyecto)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
        <div className="p-4 border-t border-linen flex justify-center">
          <button 
            onClick={() => addItem('anteproyecto', { item: 'Nuevo Estudio', responsable: '', unidad: 'Global', cantidad: 1, valorUnitario: 0 })}
            className="flex items-center gap-2 text-sm font-bold text-pine hover:text-forest transition-colors"
          >
            <Plus size={16} />
            Agregar nuevo registro
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const CapitulosSection: React.FC<{ items: any[] }> = ({ items }) => {
  const { addItem, removeItem, editItem, totals } = usePresupuesto();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="relative">
        <span className="absolute -top-10 -left-6 text-8xl font-serif font-bold text-forest/[0.03] pointer-events-none">04</span>
        <div>
          <h3 className="font-serif text-3xl font-bold text-forest">Capítulos · Costos Directos</h3>
          <p className="text-graphite">Acumulado de costos por fase constructiva.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-2xl shadow-warm border border-linen overflow-hidden card-hover">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-pine text-white text-xs font-bold uppercase tracking-widest">
                <th className="px-6 py-4 w-16">N°</th>
                <th className="px-6 py-4">Capítulo</th>
                <th className="px-6 py-4 text-right">Valor APU</th>
                <th className="px-6 py-4 text-right">Valor Manual</th>
                <th className="px-6 py-4 text-right">Total Capítulo</th>
                <th className="px-6 py-4 w-40 text-center">% del Total</th>
                <th className="px-6 py-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-linen">
              {items.map((item, idx) => {
                const capTotal = totals.chapterTotals.find((t: any) => t.id === item.id)?.total || 0;
                const percent = totals.totalDirecto > 0 ? (capTotal / totals.totalDirecto) * 100 : 0;
                
                return (
                  <tr key={item.id} className="hover:bg-paper transition-colors group">
                    <td className="px-6 py-4 text-xs font-bold text-graphite">{item.numero}</td>
                    <td className="px-6 py-4">
                       <input 
                        type="text" 
                        value={item.nombre} 
                        onChange={(e) => editItem('capitulos', item.id, { nombre: e.target.value })}
                        className="w-full bg-transparent border-none focus:ring-0 font-bold text-forest outline-none"
                      />
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-graphite tabular-nums">
                      {/* Logic for APU total will go here later */}
                      $0
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end">
                        <input 
                          type="number" 
                          value={item.valManual}
                          onChange={(e) => editItem('capitulos', item.id, { valManual: parseFloat(e.target.value) || 0 })}
                          className="w-32 px-3 py-1 bg-paper/50 rounded-lg border border-transparent focus:border-primary focus:bg-white text-right font-medium outline-none transition-all tabular-nums"
                        />
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-forest tabular-nums">
                      {formatCOP(capTotal)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-linen rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-primary" 
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-graphite">{percent.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => removeItem('capitulos', item.id)}
                        className="text-graphite/40 hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-paper font-bold text-forest uppercase tracking-widest text-xs">
                <td colSpan={4} className="px-6 py-4 text-right">Total Costos Directos</td>
                <td className="px-6 py-4 text-right text-lg font-serif">
                  {formatCOP(totals.totalDirecto)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
          <div className="p-4 border-t border-linen flex justify-center">
            <button 
              onClick={() => addItem('capitulos', { numero: (items.length + 1).toString().padStart(2, '0'), nombre: 'Nuevo Capítulo', valManual: 0 })}
              className="flex items-center gap-2 text-sm font-bold text-pine hover:text-forest transition-colors"
            >
              <Plus size={16} />
              Agregar nuevo capítulo
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
