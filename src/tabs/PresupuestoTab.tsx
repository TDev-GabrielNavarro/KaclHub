import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePresupuesto } from '../context/PresupuestoContext';
import type { APUActivity, APUSubItem } from '../context/PresupuestoContext';
import { 
  ClipboardList, 
  Layers, 
  Calculator, 
  ListChecks, 
  Percent, 
  Plus, 
  Trash2, 
  Info,
  ChevronDown,
  Package,
  HardHat,
  Wrench
} from 'lucide-react';
import { cn, formatCOP } from '../utils/utils';

export const PresupuestoTab: React.FC = () => {
  const { state } = usePresupuesto();
  const [activeSubTab, setActiveSubTab] = useState(0);

  const subTabs = [
    { id: 0, label: '01 Anteproyecto', icon: ClipboardList },
    { id: 1, label: '02 APU', icon: Calculator },
    { id: 2, label: '03 Cantidades', icon: ListChecks },
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
                    ? "bg-primary text-forest shadow-xl shadow-primary/20 scale-95" 
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
          {activeSubTab === 1 && <APUSection key="apu" />}
          {activeSubTab === 2 && <CantidadesSection key="cantidades" />}
          {activeSubTab === 3 && <CapitulosSection key="capitulos" items={state.capitulos} />}
          {activeSubTab === 4 && (
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
              <th className="px-6 py-4 text-right">Cant.</th>
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
                    placeholder="Nombre del estudio..."
                    onChange={(e) => editItem('anteproyecto', item.id, { item: e.target.value })}
                    className="w-full bg-transparent border-none focus:ring-0 font-medium outline-none placeholder:text-graphite/30 focus:placeholder:text-graphite/50 transition-colors"
                  />
                </td>
                <td className="px-6 py-4">
                  <input 
                    type="text" 
                    value={item.responsable} 
                    placeholder="Responsable..."
                    onChange={(e) => editItem('anteproyecto', item.id, { responsable: e.target.value })}
                    className="w-full bg-transparent border-none focus:ring-0 text-sm text-graphite outline-none placeholder:text-graphite/30 focus:placeholder:text-graphite/50 transition-colors"
                  />
                </td>
                <td className="px-6 py-4">
                  <input 
                    type="text" 
                    value={item.unidad} 
                    placeholder="Unidad"
                    onChange={(e) => editItem('anteproyecto', item.id, { unidad: e.target.value })}
                    className="w-20 bg-transparent border-none focus:ring-0 text-sm outline-none placeholder:text-graphite/30 focus:placeholder:text-graphite/50 transition-colors"
                  />
                </td>
                <td className="px-6 py-4 text-right">
                  <input 
                    type="number" 
                    value={item.cantidad} 
                    onChange={(e) => editItem('anteproyecto', item.id, { cantidad: parseFloat(e.target.value) || 0 })}
                    className="w-20 bg-transparent border-none text-right focus:ring-0 font-medium tabular-nums outline-none pr-6"
                  />
                </td>
                <td className="px-6 py-4 text-right">
                  <input 
                    type="number" 
                    value={item.valorUnitario} 
                    onChange={(e) => editItem('anteproyecto', item.id, { valorUnitario: parseFloat(e.target.value) || 0 })}
                    className="w-32 bg-transparent border-none text-right focus:ring-0 font-medium tabular-nums outline-none pr-6"
                  />
                </td>
                <td className="px-6 py-4 text-right font-bold tabular-nums text-forest">
                  {formatCOP(item.valorUnitario * item.cantidad)}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => removeItem('anteproyecto', item.id)}
                    className="p-2 text-graphite/40 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-paper font-bold text-forest uppercase tracking-widest text-xs">
              <td colSpan={5} className="px-6 py-4 text-right">Total Anteproyecto</td>
              <td className="px-6 py-4 text-right text-lg font-serif">
                {formatCOP(totals.totalAnteproyecto)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
        <div className="p-4 border-t border-linen flex justify-center bg-paper/30">
          <button 
            onClick={() => addItem('anteproyecto', { item: '', responsable: '', unidad: '', cantidad: 1, valorUnitario: 0 })}
            className="flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold text-pine bg-pine/5 hover:bg-pine hover:text-white hover:shadow-lg hover:shadow-pine/20 transition-all active:scale-95"
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
                        className="p-2 text-graphite/40 hover:text-red-600 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
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
          <div className="p-4 border-t border-linen flex justify-center bg-paper/30">
            <button 
              onClick={() => addItem('capitulos', { numero: (items.length + 1).toString().padStart(2, '0'), nombre: 'Nuevo Capítulo', valManual: 0 })}
              className="flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold text-pine bg-pine/5 hover:bg-pine hover:text-white hover:shadow-lg hover:shadow-pine/20 transition-all active:scale-95"
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

// ─── Cantidades Section ───────────────────────────────────────────────────────

const CantidadesSection: React.FC = () => {
  const { state, addItem, removeItem, editItem, totals } = usePresupuesto();
  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>({});

  const toggleChapter = (id: string) => {
    setOpenChapters(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="relative">
        <span className="absolute -top-10 -left-6 text-8xl font-serif font-bold text-forest/[0.03] pointer-events-none">02</span>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-3xl font-bold text-forest">Cantidades de Obra</h3>
            <p className="text-graphite">Listado de actividades agrupadas por capítulo constructivo.</p>
          </div>
          <span className="px-4 py-1 bg-primary/20 text-forest text-[10px] font-bold uppercase tracking-widest rounded-full border border-primary/30">
            {state.actividades.length} actividades
          </span>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-4 text-blue-800 text-sm">
        <Info className="shrink-0" size={20} />
        <p>Define las cantidades de cada actividad por capítulo. El valor unitario se integrará automáticamente con el APU en la siguiente sección.</p>
      </div>

      {/* Chapter Groups */}
      {state.capitulos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-linen p-12 text-center shadow-warm">
          <Layers size={40} className="mx-auto text-graphite/30 mb-4" />
          <p className="text-graphite font-medium">No hay capítulos definidos.</p>
          <p className="text-graphite/60 text-sm mt-1">Ve a la pestaña <strong>04 Capítulos</strong> para crearlos primero.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {state.capitulos.map((cap) => {
            const activitiesInCap = state.actividades.filter(a => a.capituloId === cap.id);
            const capTotal = totals.chapterTotals.find((t: any) => t.id === cap.id)?.total || 0;
            const isOpen = openChapters[cap.id] !== false; // default open

            return (
              <div key={cap.id} className="bg-white rounded-2xl shadow-warm border border-linen overflow-hidden">
              <div className="flex items-stretch">
                {/* Clickable chapter info area */}
                <div className="flex-1 flex items-center gap-4 px-6 py-4 bg-forest text-white">
                  <span className="text-primary font-serif font-bold text-2xl opacity-70">{cap.numero}</span>
                  <span className="font-bold text-base uppercase tracking-widest text-sm">{cap.nombre}</span>
                  <span className="bg-white/10 text-white/70 text-[10px] font-bold px-3 py-0.5 rounded-full">
                    {activitiesInCap.length} ítems
                  </span>
                  <span className="ml-auto font-serif text-lg font-bold text-primary tabular-nums">{formatCOP(capTotal)}</span>
                </div>
                {/* Separate collapse/expand toggle button */}
                <button
                  onClick={() => toggleChapter(cap.id)}
                  className="px-5 bg-forest/80 hover:bg-forest/60 text-white transition-colors border-l border-white/10"
                  title={isOpen ? 'Colapsar' : 'Expandir'}
                >
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={22} />
                  </motion.div>
                </button>
              </div>

                {/* Activities Table */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-paper text-graphite text-[10px] font-bold uppercase tracking-widest border-b border-linen">
                            <th className="px-6 py-3">Actividad</th>
                            <th className="px-6 py-3">Unidad</th>
                            <th className="px-6 py-3 text-right">Cantidad</th>
                            <th className="px-6 py-3 text-right">Valor Unitario</th>
                            <th className="px-6 py-3 text-right">Total</th>
                            <th className="px-6 py-3 w-12"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-linen">
                          {activitiesInCap.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-6 py-8 text-center text-graphite/40 text-sm italic">
                                Sin actividades — haz clic en "+ Agregar actividad"
                              </td>
                            </tr>
                          ) : (
                            activitiesInCap.map((act) => {
                              const actTotal = (act.valorManual || 0) * (act.cantidad || 0);
                              return (
                                <tr key={act.id} className="hover:bg-paper/50 transition-colors group">
                                  <td className="px-6 py-3">
                                    <input
                                      type="text"
                                      value={act.nombre}
                                      placeholder="Nombre de la actividad..."
                                      onChange={(e) => editItem('actividades', act.id, { nombre: e.target.value })}
                                      className="w-full bg-transparent outline-none font-medium placeholder:text-graphite/30"
                                    />
                                  </td>
                                  <td className="px-6 py-3">
                                    <input
                                      type="text"
                                      value={act.unidad}
                                      placeholder="m²"
                                      onChange={(e) => editItem('actividades', act.id, { unidad: e.target.value })}
                                      className="w-16 bg-transparent outline-none text-sm placeholder:text-graphite/30"
                                    />
                                  </td>
                                  <td className="px-6 py-3 text-right">
                                    <input
                                      type="number"
                                      value={act.cantidad}
                                      onChange={(e) => editItem('actividades', act.id, { cantidad: parseFloat(e.target.value) || 0 })}
                                      className="w-24 bg-transparent outline-none text-right font-medium tabular-nums pr-4"
                                    />
                                  </td>
                                  <td className="px-6 py-3 text-right">
                                    <input
                                      type="number"
                                      value={act.valorManual || 0}
                                      onChange={(e) => editItem('actividades', act.id, { valorManual: parseFloat(e.target.value) || 0 })}
                                      className="w-32 bg-transparent outline-none text-right font-medium tabular-nums pr-4"
                                    />
                                  </td>
                                  <td className="px-6 py-3 text-right font-bold tabular-nums text-forest">
                                    {formatCOP(actTotal)}
                                  </td>
                                  <td className="px-6 py-3 text-right">
                                    <button
                                      onClick={() => removeItem('actividades', act.id)}
                                      className="p-1.5 text-graphite/30 hover:text-red-600 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-linen bg-paper/50">
                            <td colSpan={4} className="px-6 py-3 text-right text-xs font-bold uppercase tracking-widest text-graphite">
                              Subtotal {cap.nombre}
                            </td>
                            <td className="px-6 py-3 text-right font-bold tabular-nums text-forest">
                              {formatCOP(capTotal)}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>

                      {/* Add activity button */}
                      <div className="px-6 py-3 border-t border-linen bg-paper/30 flex">
                        <button
                          onClick={() => addItem('actividades', {
                            capituloId: cap.id,
                            nombre: '',
                            unidad: '',
                            cantidad: 1,
                            valorManual: 0,
                          })}
                          className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold text-pine bg-pine/5 hover:bg-pine hover:text-white hover:shadow-lg hover:shadow-pine/20 transition-all active:scale-95"
                        >
                          <Plus size={14} />
                          Agregar actividad en {cap.nombre}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Grand Total Footer */}
      {state.capitulos.length > 0 && (
        <div className="bg-forest rounded-2xl p-6 flex items-center justify-between text-white">
          <div>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Total Costos Directos</p>
            <p className="text-sm text-white/40 mt-1">{state.actividades.length} actividades · {state.capitulos.length} capítulos</p>
          </div>
          <p className="font-serif text-3xl font-bold text-primary tabular-nums">{formatCOP(totals.totalDirecto)}</p>
        </div>
      )}
    </motion.div>
  );
};

// ─── APU Section ──────────────────────────────────────────────────────────────

const calcAPUTotals = (apu: APUActivity) => {
  const mat = apu.materiales.reduce((s, i) => s + i.cantidad * i.valorUnitario, 0);
  const mob = apu.manoDeObra.reduce((s, i) => s + i.cantidad * i.valorUnitario, 0);
  const eq  = apu.equipos.reduce((s, i) => s + i.cantidad * i.valorUnitario, 0);
  const subtotal = mat + mob + eq;
  const desperdicio = subtotal * (apu.desperdicio / 100);
  return { mat, mob, eq, subtotal, desperdicio, total: subtotal + desperdicio };
};

type APUCategory = 'materiales' | 'manoDeObra' | 'equipos';

interface SubTableProps {
  apuId: string;
  category: APUCategory;
  items: APUSubItem[];
  label: React.ReactNode;
  accentColor: string;
}

const APUSubTable: React.FC<SubTableProps> = ({ apuId, category, items, label, accentColor }) => {
  const { addAPUSubItem, removeAPUSubItem, editAPUSubItem } = usePresupuesto();
  const subtotal = items.reduce((s, i) => s + i.cantidad * i.valorUnitario, 0);

  return (
    <div className="border border-linen rounded-xl overflow-hidden">
      <div className={`px-5 py-2.5 flex items-center justify-between ${accentColor}`}>
        <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
        <span className="text-xs font-bold tabular-nums">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(subtotal)}</span>
      </div>
      <table className="w-full text-left border-collapse bg-white">
        <thead>
          <tr className="bg-paper text-graphite/60 text-[10px] font-bold uppercase tracking-widest border-b border-linen">
            <th className="px-5 py-2">Descripción</th>
            <th className="px-5 py-2">Unidad</th>
            <th className="px-5 py-2 text-right">Cant.</th>
            <th className="px-5 py-2 text-right">V. Unitario</th>
            <th className="px-5 py-2 text-right">Total</th>
            <th className="px-5 py-2 w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-linen">
          {items.length === 0 ? (
            <tr><td colSpan={6} className="px-5 py-4 text-center text-graphite/30 text-xs italic">Sin ítems — agrega uno</td></tr>
          ) : items.map(item => (
            <tr key={item.id} className="hover:bg-paper/40 transition-colors group">
              <td className="px-5 py-2">
                <input type="text" value={item.descripcion} placeholder="Descripción..."
                  onChange={e => editAPUSubItem(apuId, category, item.id, { descripcion: e.target.value })}
                  className="w-full bg-transparent outline-none text-sm placeholder:text-graphite/25" />
              </td>
              <td className="px-5 py-2">
                <input type="text" value={item.unidad} placeholder="un"
                  onChange={e => editAPUSubItem(apuId, category, item.id, { unidad: e.target.value })}
                  className="w-14 bg-transparent outline-none text-sm placeholder:text-graphite/25" />
              </td>
              <td className="px-5 py-2 text-right">
                <input type="number" value={item.cantidad}
                  onChange={e => editAPUSubItem(apuId, category, item.id, { cantidad: parseFloat(e.target.value) || 0 })}
                  className="w-20 bg-transparent outline-none text-right text-sm tabular-nums pr-3" />
              </td>
              <td className="px-5 py-2 text-right">
                <input type="number" value={item.valorUnitario}
                  onChange={e => editAPUSubItem(apuId, category, item.id, { valorUnitario: parseFloat(e.target.value) || 0 })}
                  className="w-28 bg-transparent outline-none text-right text-sm tabular-nums pr-3" />
              </td>
              <td className="px-5 py-2 text-right text-sm font-medium tabular-nums text-forest">
                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(item.cantidad * item.valorUnitario)}
              </td>
              <td className="px-5 py-2 text-right">
                <button onClick={() => removeAPUSubItem(apuId, category, item.id)}
                  className="p-1 text-graphite/20 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100">
                  <Trash2 size={13} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-5 py-2 border-t border-linen bg-paper/40 flex">
        <button
          onClick={() => addAPUSubItem(apuId, category, { descripcion: '', unidad: '', cantidad: 1, valorUnitario: 0 })}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold text-pine bg-pine/5 hover:bg-pine hover:text-white transition-all active:scale-95">
          <Plus size={12} /> Agregar ítem
        </button>
      </div>
    </div>
  );
};

const APUSection: React.FC = () => {
  const { state, addAPU, removeAPU, editAPU } = usePresupuesto();
  const [openAPUs, setOpenAPUs] = useState<Record<string, boolean>>({});
  const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  const toggleAPU = (id: string) => setOpenAPUs(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
      {/* Header */}
      <div className="relative">
        <span className="absolute -top-10 -left-6 text-8xl font-serif font-bold text-forest/[0.03] pointer-events-none">02</span>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-3xl font-bold text-forest">Análisis de Precios Unitarios</h3>
            <p className="text-graphite">Desglose de materiales, mano de obra y equipos por actividad.</p>
          </div>
          <button
            onClick={() => addAPU({ nombre: '', unidad: 'm²', desperdicio: 5, materiales: [], manoDeObra: [], equipos: [] })}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-forest text-white text-xs font-bold uppercase tracking-widest hover:bg-forest/80 hover:shadow-lg transition-all active:scale-95"
          >
            <Plus size={16} /> Nuevo APU
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-4 text-blue-800 text-sm">
        <Info className="shrink-0" size={20} />
        <p>Cada APU calcula el costo directo por unidad de una actividad. El resultado se usará como <strong>Valor Unitario</strong> en la tabla de Cantidades.</p>
      </div>

      {/* Empty state */}
      {state.apus.length === 0 && (
        <div className="bg-white rounded-2xl border border-linen p-16 text-center shadow-warm">
          <Calculator size={48} className="mx-auto text-graphite/20 mb-4" />
          <p className="text-graphite font-medium text-lg">No hay APUs creados</p>
          <p className="text-graphite/50 text-sm mt-1 mb-6">Crea el primer análisis de precios para tu proyecto</p>
          <button
            onClick={() => addAPU({ nombre: '', unidad: 'm²', desperdicio: 5, materiales: [], manoDeObra: [], equipos: [] })}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-forest text-white text-xs font-bold uppercase tracking-widest hover:bg-forest/80 transition-all"
          >
            <Plus size={16} /> Crear primer APU
          </button>
        </div>
      )}

      {/* APU Accordion list */}
      <div className="space-y-4">
        {state.apus.map((apu, idx) => {
          const t = calcAPUTotals(apu);
          const isOpen = openAPUs[apu.id] !== false; // default open

          return (
            <div key={apu.id} className="bg-white rounded-2xl shadow-warm border border-linen overflow-hidden">
              {/* APU Header row */}
              <div className="flex items-stretch">
                <button
                  onClick={() => toggleAPU(apu.id)}
                  className="flex-1 flex items-center gap-4 px-6 py-4 bg-forest text-white hover:bg-forest/90 transition-colors text-left"
                >
                  <span className="text-primary font-serif font-bold text-2xl opacity-60 shrink-0">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={apu.nombre}
                      placeholder="Nombre de la actividad..."
                      onClick={e => e.stopPropagation()}
                      onChange={e => editAPU(apu.id, { nombre: e.target.value })}
                      className="bg-transparent text-white font-bold text-base w-full outline-none placeholder:text-white/30 border-b border-transparent focus:border-primary/50 transition-all"
                    />
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-white/50 uppercase tracking-widest">Unidad:</span>
                      <input
                        type="text"
                        value={apu.unidad}
                        onClick={e => e.stopPropagation()}
                        onChange={e => editAPU(apu.id, { unidad: e.target.value })}
                        className="w-16 bg-white/10 rounded px-1.5 text-xs text-white font-bold outline-none border border-transparent focus:border-primary/50"
                      />
                      <span className="text-[10px] text-white/50 uppercase tracking-widest">Desperdicio:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={apu.desperdicio}
                          onClick={e => e.stopPropagation()}
                          onChange={e => editAPU(apu.id, { desperdicio: parseFloat(e.target.value) || 0 })}
                          className="w-12 bg-white/10 rounded px-1.5 text-xs text-white font-bold outline-none text-right border border-transparent focus:border-primary/50"
                        />
                        <span className="text-xs text-white/50">%</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">V. Unitario</p>
                    <p className="font-serif text-xl font-bold text-primary tabular-nums">{fmt(t.total)}</p>
                    <p className="text-[10px] text-white/30 tabular-nums">/ {apu.unidad || 'un'}</p>
                  </div>
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={20} className="text-white/50 shrink-0" />
                  </motion.div>
                </button>
                <button
                  onClick={() => { if (window.confirm(`¿Eliminar APU "${apu.nombre || 'sin nombre'}"?`)) removeAPU(apu.id); }}
                  className="px-4 bg-red-500/10 hover:bg-red-600 text-red-300 hover:text-white transition-all"
                  title="Eliminar APU"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* APU Body */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="px-6 py-6 space-y-4 bg-paper/30"
                  >
                    <APUSubTable apuId={apu.id} category="materiales" items={apu.materiales}
                      label={<span className="flex items-center gap-2"><Package size={14} /> Materiales</span>}
                      accentColor="bg-amber-50 text-amber-800 border-b border-amber-100" />
                    <APUSubTable apuId={apu.id} category="manoDeObra" items={apu.manoDeObra}
                      label={<span className="flex items-center gap-2"><HardHat size={14} /> Mano de Obra</span>}
                      accentColor="bg-sky-50 text-sky-800 border-b border-sky-100" />
                    <APUSubTable apuId={apu.id} category="equipos" items={apu.equipos}
                      label={<span className="flex items-center gap-2"><Wrench size={14} /> Equipos y Herramientas</span>}
                      accentColor="bg-violet-50 text-violet-800 border-b border-violet-100" />

                    {/* APU Summary */}
                    <div className="bg-forest rounded-xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-white">
                      <div>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">Materiales</p>
                        <p className="font-bold tabular-nums mt-0.5">{fmt(t.mat)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">Mano de Obra</p>
                        <p className="font-bold tabular-nums mt-0.5">{fmt(t.mob)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">Equipos</p>
                        <p className="font-bold tabular-nums mt-0.5">{fmt(t.eq)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">Desperdicio ({apu.desperdicio}%)</p>
                        <p className="font-bold tabular-nums mt-0.5">{fmt(t.desperdicio)}</p>
                      </div>
                      <div className="col-span-2 md:col-span-4 pt-4 border-t border-white/10 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-white/50 uppercase tracking-widest">Subtotal directo</p>
                          <p className="font-bold tabular-nums">{fmt(t.subtotal)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-primary/70 uppercase tracking-widest font-bold">Valor Unitario Final</p>
                          <p className="font-serif text-3xl font-bold text-primary tabular-nums">{fmt(t.total)}</p>
                          <p className="text-xs text-white/30">por {apu.unidad || 'unidad'}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
