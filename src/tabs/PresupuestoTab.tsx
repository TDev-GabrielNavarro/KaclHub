import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePresupuesto } from '../context/PresupuestoContext';
import type { APUActivity, APUSubItem, AIUDetailItem } from '../context/PresupuestoContext';
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
  ChevronRight,
  Package,
  HardHat,
  Wrench,
  Truck,
  Construction,
  ArrowRight
} from 'lucide-react';
import { cn, formatCOP } from '../utils/utils';

const CurrencyInput = ({ value, onChange, className }: { value: number, onChange: (v: number) => void, className?: string }) => {
  const [focused, setFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value === 0 ? '' : value.toString());

  // Update local state when not focused to keep in sync with external changes
  React.useEffect(() => {
    if (!focused) {
      setLocalValue(value === 0 ? '' : value.toString());
    }
  }, [value, focused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and decimal point
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    setLocalValue(raw);
    onChange(parseFloat(raw) || 0);
  };

  return (
    <input
      type="text"
      value={focused ? localValue : formatCOP(value)}
      onChange={handleChange}
      onFocus={() => {
        setFocused(true);
        if (value === 0) setLocalValue('');
      }}
      onBlur={() => setFocused(false)}
      className={className}
    />
  );
};

const QuantityInput = ({ value, onChange, className }: { value: number, onChange: (v: number) => void, className?: string }) => {
  const [focused, setFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value === 0 ? '' : value.toString());

  React.useEffect(() => {
    if (!focused) {
      setLocalValue(value === 0 ? '' : value.toString());
    }
  }, [value, focused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setLocalValue(val);
      onChange(parseFloat(val) || 0);
    }
  };

  return (
    <input
      type="text"
      value={focused ? localValue : value.toString()}
      onChange={handleChange}
      onFocus={() => {
        setFocused(true);
        if (value === 0) setLocalValue('');
      }}
      onBlur={() => setFocused(false)}
      className={className}
    />
  );
};

export const PresupuestoTab: React.FC = () => {
  const { state } = usePresupuesto();
  const [activeSubTab, setActiveSubTab] = useState(0);

  const subTabs = [
    { id: 0, label: '01 Anteproyecto', icon: ClipboardList },
    { id: 1, label: '02 Capítulos', icon: Layers },
    { id: 2, label: '03 APU', icon: Calculator },
    { id: 3, label: '04 Costos Directos', icon: ListChecks },
    { id: 4, label: '05 AIU', icon: Percent },
  ];

  const progress = React.useMemo(() => {
    let score = 0;
    
    // 1. Capítulos existen (10%)
    if (state.capitulos.length > 0) score += 10;
    
    // 2. Actividades existen (20%)
    if (state.actividades.length > 0) score += 20;
    
    // 3. APUs desglosados (50%)
    if (state.apus.length > 0) {
      const apusCompletos = state.apus.filter(apu => 
        apu.materiales.length > 0 || apu.manoDeObra.length > 0 || apu.equipos.length > 0
      ).length;
      score += (apusCompletos / state.apus.length) * 50;
    }
    
    // 4. AIU definido y con actividades (20%)
    if (state.actividades.length > 0 && (state.aiu.administracion > 0 || state.aiu.imprevistos > 0 || state.aiu.utilidad > 0)) {
      score += 20;
    }
    
    return Math.round(score);
  }, [state]);

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
                animate={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{progress}% Completado</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {activeSubTab === 0 && <AnteproyectoSection key="anteproyecto" items={state.anteproyecto} />}
          {activeSubTab === 1 && <CapitulosSection key="capitulos" onTabChange={setActiveSubTab} />}
          {activeSubTab === 2 && <APUSection key="apu" onTabChange={setActiveSubTab} />}
          {activeSubTab === 3 && <CostosDirectosSection key="costos" items={state.capitulos} onTabChange={setActiveSubTab} />}
          {activeSubTab === 4 && <AIUSection key="aiu" />}
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
                  <QuantityInput 
                    value={item.cantidad} 
                    onChange={(val) => editItem('anteproyecto', item.id, { cantidad: val })}
                    className="w-20 bg-transparent border-none text-right focus:ring-0 font-medium tabular-nums outline-none pr-6"
                  />
                </td>
                <td className="px-6 py-4 text-right">
                  <CurrencyInput 
                    value={item.valorUnitario} 
                    onChange={(val) => editItem('anteproyecto', item.id, { valorUnitario: val })}
                    className="w-32 bg-transparent border-none text-right focus:ring-0 font-medium tabular-nums outline-none pr-6"
                  />
                </td>
                <td className="px-6 py-4 text-right font-bold tabular-nums text-forest">
                  {formatCOP(item.valorUnitario * item.cantidad)}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => removeItem('anteproyecto', item.id)}
                    className="p-2 text-graphite/40 hover:text-red-600 hover:bg-red-50 rounded-full opacity-50 hover:opacity-100 transition-all"
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

const CostosDirectosSection: React.FC<{ items: any[], onTabChange: (id: number) => void }> = ({ items, onTabChange }) => {
  const { totals } = usePresupuesto();

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
          <h3 className="font-serif text-3xl font-bold text-forest">Costos Directos</h3>
          <p className="text-graphite">Acumulado de costos por capítulo constructivo — derivado de Cantidades × APU.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-2xl shadow-warm border border-linen overflow-hidden card-hover">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-pine text-white text-xs font-bold uppercase tracking-widest">
                <th className="px-6 py-4 w-16">N°</th>
                <th className="px-6 py-4">Capítulo</th>
                <th className="px-6 py-4 text-right">Valor del Capítulo</th>
                <th className="px-6 py-4 w-40 text-center">% del Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-linen">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-graphite/40 text-sm italic">
                    Aún no hay capítulos definidos.
                  </td>
                </tr>
              ) : items.map((item) => {
                const capTotal = totals.chapterTotals.find((t: any) => t.id === item.id)?.total || 0;
                const percent = totals.totalDirecto > 0 ? (capTotal / totals.totalDirecto) * 100 : 0;
                
                return (
                  <tr key={item.id} className="hover:bg-paper transition-colors group">
                    <td className="px-6 py-4 text-xs font-bold text-graphite">{item.numero}</td>
                    <td className="px-6 py-4 font-bold text-forest uppercase text-sm tracking-wide">
                       {item.nombre || 'Capítulo sin nombre'}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-forest tabular-nums text-lg">
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
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-paper font-bold text-forest uppercase tracking-widest text-xs">
                <td colSpan={2} className="px-6 py-4 text-right">Total Costos Directos</td>
                <td className="px-6 py-4 text-right text-xl font-serif">
                  {formatCOP(totals.totalDirecto)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={() => onTabChange(4)}
          className="group flex items-center gap-3 px-10 py-4 bg-forest text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl shadow-forest/10"
        >
          Continuar al AIU
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
};

// ─── Capítulos Section (02 - define chapters + activities) ─────────────────

const CapitulosSection: React.FC<{ onTabChange: (id: number) => void }> = ({ onTabChange }) => {
  const { state, addItem, removeItem, editItem, removeChapterWithDependencies, addActivityWithAPU, removeActivityWithAPU, getAPUTotal, totals } = usePresupuesto();
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
            <h3 className="font-serif text-3xl font-bold text-forest">Capítulos y Actividades</h3>
            <p className="text-graphite">Define capítulos constructivos y sus actividades. Cada actividad genera un APU automático.</p>
          </div>
          <button
            onClick={() => addItem('capitulos', { numero: String(state.capitulos.length + 1).padStart(2, '0'), nombre: '', valManual: 0 })}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-forest text-white text-xs font-bold uppercase tracking-widest hover:bg-forest/80 hover:shadow-lg transition-all active:scale-95"
          >
            <Plus size={16} /> Nuevo Capítulo
          </button>
          <span className="px-4 py-1 bg-primary/20 text-forest text-[10px] font-bold uppercase tracking-widest rounded-full border border-primary/30">
            {state.actividades.length} actividades
          </span>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-4 text-blue-800 text-sm">
        <Info className="shrink-0" size={20} />
        <p>Crea capítulos y agrega actividades. Cada actividad genera su APU automáticamente en la pestaña <strong>03 APU</strong>, donde puedes desglosar materiales, mano de obra y equipos.</p>
      </div>

      {/* Chapter Groups */}
      {state.capitulos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-linen p-12 text-center shadow-warm">
          <Layers size={40} className="mx-auto text-graphite/30 mb-4" />
          <p className="text-graphite font-medium">No hay capítulos definidos.</p>
          <p className="text-graphite/60 text-sm mt-1 mb-6">Crea tu primer capítulo para empezar a agregar actividades.</p>
          <button
            onClick={() => addItem('capitulos', { numero: '01', nombre: '', valManual: 0 })}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-forest text-white text-xs font-bold uppercase tracking-widest hover:bg-forest/80 transition-all"
          >
            <Plus size={16} /> Crear primer capítulo
          </button>
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
                  <input
                    type="text"
                    value={cap.nombre}
                    placeholder="Nombre del capítulo..."
                    onClick={e => e.stopPropagation()}
                    onChange={e => editItem('capitulos', cap.id, { nombre: e.target.value })}
                    className="flex-1 bg-transparent text-white font-bold text-sm uppercase tracking-widest outline-none placeholder:text-white/30 border-b border-transparent focus:border-primary/50"
                  />
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
                {/* Delete chapter button */}
                <button
                  onClick={() => { if (window.confirm(`¿Eliminar capítulo "${cap.nombre || 'sin nombre'}" y TODAS sus actividades (y APUs)?`)) removeChapterWithDependencies(cap.id); }}
                  className="px-4 bg-red-500/10 hover:bg-red-600 text-red-300 hover:text-white transition-all"
                  title="Eliminar capítulo"
                >
                  <Trash2 size={16} />
                </button>
              </div>

                {/* Activities Table */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                      className="overflow-hidden"
                    >
                      <div>
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
                              <td colSpan={6} className="px-6 py-8 text-center bg-paper/20">
                                <p className="text-graphite/40 text-sm italic mb-3">Aún no hay actividades en este capítulo.</p>
                                <button
                                  onClick={() => addActivityWithAPU(cap.id, '')}
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-pine bg-pine/5 hover:bg-pine hover:text-white transition-all active:scale-95"
                                >
                                  <Plus size={14} /> Crear primera actividad
                                </button>
                              </td>
                            </tr>
                          ) : (
                            activitiesInCap.map((act) => {
                              const apuUnitPrice = act.apuId ? getAPUTotal(act.apuId) : (act.valorManual || 0);
                              const actTotal = apuUnitPrice * (act.cantidad || 0);
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
                                    <QuantityInput
                                      value={act.cantidad}
                                      onChange={(val) => editItem('actividades', act.id, { cantidad: val })}
                                      className="w-24 bg-transparent outline-none text-right font-medium tabular-nums pr-4"
                                    />
                                  </td>
                                  <td className="px-6 py-3 text-right">
                                    <span className={cn(
                                      "text-sm font-medium tabular-nums",
                                      apuUnitPrice > 0 ? "text-forest" : "text-graphite/40 italic"
                                    )}>
                                      {apuUnitPrice > 0 ? formatCOP(apuUnitPrice) : 'Sin APU'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-3 text-right font-bold tabular-nums text-forest">
                                    {formatCOP(actTotal)}
                                  </td>
                                  <td className="px-6 py-3 text-right">
                                    <button
                                      onClick={() => removeActivityWithAPU(act.id)}
                                      className="p-1.5 text-graphite/40 hover:text-red-600 hover:bg-red-50 rounded-full transition-all opacity-50 hover:opacity-100"
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
                      <div className="px-6 py-3 border-t border-linen bg-paper/30 flex justify-between items-center">
                        <button
                          onClick={() => addActivityWithAPU(cap.id, '')}
                          className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold text-pine bg-pine/5 hover:bg-pine hover:text-white hover:shadow-lg hover:shadow-pine/20 transition-all active:scale-95"
                        >
                          <Plus size={14} />
                          Agregar actividad
                        </button>
                        <button
                          onClick={() => onTabChange(2)}
                          className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold text-primary bg-primary/10 hover:bg-primary hover:text-forest transition-all active:scale-95"
                        >
                          <Calculator size={14} />
                          Ir al APU
                        </button>
                      </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          
          <button
            onClick={() => addItem('capitulos', { numero: String(state.capitulos.length + 1).padStart(2, '0'), nombre: '', valManual: 0 })}
            className="w-full flex items-center justify-center gap-2 px-6 py-6 rounded-2xl border-2 border-dashed border-primary bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary-dark hover:text-primary-dark transition-all active:scale-95 group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            <span className="font-bold uppercase tracking-widest text-xs">Agregar Nuevo Capítulo</span>
          </button>
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
  const eq = apu.equipos?.reduce((s, i) => s + i.cantidad * i.valorUnitario, 0) || 0;
  const mat = apu.materiales?.reduce((s, i) => s + i.cantidad * i.valorUnitario, 0) || 0;
  const mob = apu.manoDeObra?.reduce((s, i) => s + i.cantidad * i.valorUnitario, 0) || 0;
  const trans = apu.transporte?.reduce((s, i) => s + i.cantidad * i.valorUnitario, 0) || 0;
  const herr = apu.herramientas?.reduce((s, i) => s + i.cantidad * i.valorUnitario, 0) || 0;
  const subtotal = eq + mat + mob + trans + herr;
  const desperdicio = subtotal * ((apu.desperdicio || 0) / 100);
  return { eq, mat, mob, trans, herr, subtotal, desperdicio, total: subtotal + desperdicio };
};

type APUCategory = 'equipos' | 'materiales' | 'manoDeObra' | 'transporte' | 'herramientas';

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
            <tr>
              <td colSpan={6} className="px-5 py-6 text-center bg-paper/10">
                <p className="text-graphite/40 text-xs italic mb-2">Aún no hay registros aquí.</p>
                <button
                  onClick={() => addAPUSubItem(apuId, category, { descripcion: '', unidad: '', cantidad: 1, valorUnitario: 0 })}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold text-pine bg-pine/5 hover:bg-pine hover:text-white transition-all active:scale-95"
                >
                  <Plus size={12} /> Agregar primer ítem
                </button>
              </td>
            </tr>
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
                <QuantityInput value={item.cantidad}
                  onChange={val => editAPUSubItem(apuId, category, item.id, { cantidad: val })}
                  className="w-20 bg-transparent outline-none text-right text-sm tabular-nums pr-3" />
              </td>
              <td className="px-5 py-2 text-right">
                <CurrencyInput value={item.valorUnitario}
                  onChange={val => editAPUSubItem(apuId, category, item.id, { valorUnitario: val })}
                  className="w-28 bg-transparent outline-none text-right text-sm tabular-nums pr-3" />
              </td>
              <td className="px-5 py-2 text-right text-sm font-medium tabular-nums text-forest">
                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(item.cantidad * item.valorUnitario)}
              </td>
              <td className="px-5 py-2 text-right">
                <button onClick={() => removeAPUSubItem(apuId, category, item.id)}
                  className="p-1 text-graphite/40 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-50 hover:opacity-100">
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

const APUSection: React.FC<{ onTabChange: (id: number) => void }> = ({ onTabChange }) => {
  const { state, removeAPU, editAPU } = usePresupuesto();
  const [openAPUs, setOpenAPUs] = useState<Record<string, boolean>>({});
  const [selectedChapterId, setSelectedChapterId] = useState<string | 'all'>('all');
  
  const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  const toggleAPU = (id: string) => setOpenAPUs(prev => ({ ...prev, [id]: !prev[id] }));

  const filteredAPUs = state.apus.filter(apu => {
    if (selectedChapterId === 'all') return true;
    const linkedActivity = state.actividades.find(a => a.apuId === apu.id);
    return linkedActivity?.capituloId === selectedChapterId;
  });

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
          <div className="flex flex-wrap gap-2 justify-end max-w-md">
            <button
              onClick={() => setSelectedChapterId('all')}
              className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                selectedChapterId === 'all' 
                  ? "bg-forest text-white shadow-lg" 
                  : "bg-linen text-graphite hover:bg-forest/5"
              )}
            >
              Todos
            </button>
            {state.capitulos.map(cap => (
              <button
                key={cap.id}
                onClick={() => setSelectedChapterId(cap.id)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                  selectedChapterId === cap.id 
                    ? "bg-primary text-forest shadow-lg" 
                    : "bg-linen text-graphite hover:bg-forest/5"
                )}
              >
                Cap {cap.numero}
              </button>
            ))}
          </div>
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
          <p className="text-graphite font-medium text-lg">No hay Análisis de Precios Unitarios (APU)</p>
          <p className="text-graphite/50 text-sm mt-1 mb-6">Las APUs se generan y vinculan de forma automática cuando creas actividades en tus capítulos.</p>
          <button
            onClick={() => onTabChange(1)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-forest text-white text-xs font-bold uppercase tracking-widest hover:bg-forest/80 transition-all"
          >
            <Layers size={16} /> Ir a Capítulos
          </button>
        </div>
      )}

      {/* APU Accordion list */}
      <div className="space-y-4">
        {filteredAPUs.length === 0 && state.apus.length > 0 && (
          <div className="bg-white rounded-2xl border border-linen p-12 text-center shadow-warm">
            <p className="text-graphite font-medium">No hay actividades en este capítulo.</p>
          </div>
        )}
        {filteredAPUs.map((apu, idx) => {
          const t = calcAPUTotals(apu);
          const isOpen = openAPUs[apu.id] !== false; // default open
          
          const linkedActivity = state.actividades.find(a => a.apuId === apu.id);
          const linkedChapter = linkedActivity ? state.capitulos.find(c => c.id === linkedActivity.capituloId) : null;
          const apuName = linkedActivity ? linkedActivity.nombre : apu.nombre;
          const apuUnit = linkedActivity ? linkedActivity.unidad : apu.unidad;

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
                    {linkedChapter && (
                      <div className="mb-1.5">
                        <span className="text-[9px] bg-white/10 text-white/80 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">
                          Cap {linkedChapter.numero} · {linkedChapter.nombre || 'Sin nombre'}
                        </span>
                      </div>
                    )}
                    {linkedActivity ? (
                      <div className="text-white font-bold text-base truncate">
                        {apuName || 'Actividad sin nombre'}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={apu.nombre}
                        placeholder="Nombre de la actividad..."
                        onClick={e => e.stopPropagation()}
                        onChange={e => editAPU(apu.id, { nombre: e.target.value })}
                        className="bg-transparent text-white font-bold text-base w-full outline-none placeholder:text-white/30 border-b border-transparent focus:border-primary/50 transition-all"
                      />
                    )}
                    
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-white/50 uppercase tracking-widest">Unidad:</span>
                      {linkedActivity ? (
                        <span className="px-1.5 text-xs text-white font-bold">{apuUnit || '-'}</span>
                      ) : (
                        <input
                          type="text"
                          value={apu.unidad}
                          onClick={e => e.stopPropagation()}
                          onChange={e => editAPU(apu.id, { unidad: e.target.value })}
                          className="w-16 bg-white/10 rounded px-1.5 text-xs text-white font-bold outline-none border border-transparent focus:border-primary/50"
                        />
                      )}
                      
                      <span className="text-[10px] text-white/50 uppercase tracking-widest">Desperdicio:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={apu.desperdicio}
                          onClick={e => e.stopPropagation()}
                          onChange={e => editAPU(apu.id, { desperdicio: Math.max(0, parseFloat(e.target.value) || 0) })}
                          className="w-12 bg-white/10 rounded px-1.5 text-xs text-white font-bold outline-none text-right border border-transparent focus:border-primary/50"
                        />
                        <span className="text-xs text-white/50">%</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">V. Unitario</p>
                    <p className="font-serif text-xl font-bold text-primary tabular-nums">{fmt(t.total)}</p>
                    <p className="text-[10px] text-white/30 tabular-nums">/ {apuUnit || 'un'}</p>
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
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                    className="overflow-hidden bg-transparent"
                  >
                    <div className="px-6 py-6 space-y-4 bg-paper/30">
                      <APUSubTable apuId={apu.id} category="equipos" items={apu.equipos || []}
                        label={<span className="flex items-center gap-2"><Construction size={14} /> Equipo</span>}
                        accentColor="bg-slate-50 text-slate-800 border-b border-slate-100" />
                      <APUSubTable apuId={apu.id} category="materiales" items={apu.materiales || []}
                        label={<span className="flex items-center gap-2"><Package size={14} /> Materiales</span>}
                        accentColor="bg-amber-50 text-amber-800 border-b border-amber-100" />
                      <APUSubTable apuId={apu.id} category="manoDeObra" items={apu.manoDeObra || []}
                        label={<span className="flex items-center gap-2"><HardHat size={14} /> Mano de Obra</span>}
                        accentColor="bg-sky-50 text-sky-800 border-b border-sky-100" />
                      <APUSubTable apuId={apu.id} category="transporte" items={apu.transporte || []}
                        label={<span className="flex items-center gap-2"><Truck size={14} /> Transporte</span>}
                        accentColor="bg-emerald-50 text-emerald-800 border-b border-emerald-100" />
                      <APUSubTable apuId={apu.id} category="herramientas" items={apu.herramientas || []}
                        label={<span className="flex items-center gap-2"><Wrench size={14} /> Herramientas</span>}
                        accentColor="bg-violet-50 text-violet-800 border-b border-violet-100" />

                      {/* APU Summary */}
                      <div className="bg-forest rounded-xl p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-white">
                        <div>
                          <p className="text-[10px] text-white/40 uppercase tracking-widest">Equipo</p>
                          <p className="font-bold tabular-nums mt-0.5">{fmt(t.eq)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-white/40 uppercase tracking-widest">Materiales</p>
                          <p className="font-bold tabular-nums mt-0.5">{fmt(t.mat)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-white/40 uppercase tracking-widest">Mano de Obra</p>
                          <p className="font-bold tabular-nums mt-0.5">{fmt(t.mob)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-white/40 uppercase tracking-widest">Transporte</p>
                          <p className="font-bold tabular-nums mt-0.5">{fmt(t.trans)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-white/40 uppercase tracking-widest">Herramientas</p>
                          <p className="font-bold tabular-nums mt-0.5">{fmt(t.herr)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-white/40 uppercase tracking-widest">Desperdicio ({apu.desperdicio}%)</p>
                          <p className="font-bold tabular-nums mt-0.5">{fmt(t.desperdicio)}</p>
                        </div>
                        <div className="col-span-2 md:col-span-3 lg:col-span-6 pt-4 border-t border-white/10 flex items-center justify-between">
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

const AIUCategoryBreakdown: React.FC<{
  category: 'administracion' | 'imprevistos' | 'utilidad' | 'iva';
  label: string;
  items: AIUDetailItem[];
}> = ({ category, label, items }) => {
  const { addAIUDetailItem, removeAIUDetailItem, editAIUDetailItem } = usePresupuesto();
  const [isOpen, setIsOpen] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + (item.cantidad * item.valorUnitario), 0);

  return (
    <div className="mt-3 border border-linen rounded-xl overflow-hidden bg-paper">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-linen/30 hover:bg-linen/50 text-graphite text-[10px] font-bold uppercase tracking-widest transition-colors"
      >
        <span className="flex items-center gap-1.5">
          {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          Desglose Analítico ({items.length})
        </span>
        <span className="font-mono tabular-nums text-[10px] text-forest bg-white px-2 py-0.5 rounded border border-linen">
          Detalle: {formatCOP(subtotal)}
        </span>
      </button>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-linen"
          >
            <div className="p-3 bg-white space-y-3">
              {items.length === 0 ? (
                <div className="text-center py-4 bg-paper rounded border border-dashed border-linen">
                  <p className="text-graphite/40 text-[10px] italic mb-2">No hay componentes detallados para {label}.</p>
                  <button
                    onClick={() => addAIUDetailItem(category, { descripcion: '', unidad: '', cantidad: 1, valorUnitario: 0 })}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-bold text-pine bg-pine/5 hover:bg-pine hover:text-white transition-all"
                  >
                    <Plus size={10} /> Agregar primer ítem
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[300px]">
                    <thead>
                      <tr className="border-b border-linen text-[8px] font-bold uppercase tracking-widest text-graphite/60 bg-paper">
                        <th className="px-2 py-1 w-2/5">Descripción</th>
                        <th className="px-2 py-1 w-12">Und</th>
                        <th className="px-2 py-1 w-16 text-right">Cant</th>
                        <th className="px-2 py-1 w-20 text-right">V. Unitario</th>
                        <th className="px-2 py-1 w-20 text-right">Total</th>
                        <th className="px-2 py-1 w-6"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(item => (
                        <tr key={item.id} className="border-b border-linen hover:bg-paper/30 transition-colors">
                          <td className="px-2 py-1">
                            <input
                              type="text"
                              value={item.descripcion}
                              placeholder="Ej. Personal, Alquiler..."
                              onChange={e => editAIUDetailItem(category, item.id, { descripcion: e.target.value })}
                              className="w-full bg-transparent outline-none text-[11px] text-forest font-medium placeholder:text-graphite/30"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="text"
                              value={item.unidad}
                              placeholder="mes"
                              onChange={e => editAIUDetailItem(category, item.id, { unidad: e.target.value })}
                              className="w-full bg-transparent outline-none text-[11px] text-graphite placeholder:text-graphite/30"
                            />
                          </td>
                          <td className="px-2 py-1 text-right">
                            <QuantityInput
                              value={item.cantidad}
                              onChange={val => editAIUDetailItem(category, item.id, { cantidad: val })}
                              className="w-12 bg-transparent outline-none text-right text-[11px] tabular-nums font-medium"
                            />
                          </td>
                          <td className="px-2 py-1 text-right">
                            <CurrencyInput
                              value={item.valorUnitario}
                              onChange={val => editAIUDetailItem(category, item.id, { valorUnitario: val })}
                              className="w-16 bg-transparent outline-none text-right text-[11px] tabular-nums font-medium pr-1"
                            />
                          </td>
                          <td className="px-2 py-1 text-right font-bold text-[11px] text-forest tabular-nums">
                            {formatCOP(item.cantidad * item.valorUnitario)}
                          </td>
                          <td className="px-2 py-1 text-center">
                            <button
                              onClick={() => removeAIUDetailItem(category, item.id)}
                              className="text-graphite/40 hover:text-red-500 transition-colors p-0.5"
                            >
                              <Trash2 size={10} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {items.length > 0 && (
                <div className="flex justify-between items-center pt-2 border-t border-linen">
                  <button
                    onClick={() => addAIUDetailItem(category, { descripcion: '', unidad: '', cantidad: 1, valorUnitario: 0 })}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold text-pine bg-pine/5 hover:bg-pine hover:text-white transition-all active:scale-95"
                  >
                    <Plus size={10} /> Agregar ítem
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AIUSection: React.FC = () => {
  const { state, updateState, totals } = usePresupuesto();
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="relative">
        <span className="absolute -top-10 -left-6 text-8xl font-serif font-bold text-forest/[0.03] pointer-events-none">05</span>
        <div>
          <h3 className="font-serif text-3xl font-bold text-forest">A.I.U. e IVA y Gran Total</h3>
          <p className="text-graphite">Cálculo de Administración, Imprevistos, Utilidad e IVA con opción de desglose detallado.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column: AIU Inputs */}
        <div className="bg-white rounded-2xl shadow-warm border border-linen p-8 space-y-6 card-hover">
          <div className="flex items-center justify-between pb-4 border-b border-linen">
            <h4 className="font-bold text-forest uppercase tracking-widest text-sm">Costos Indirectos</h4>
            <span className="text-xs font-bold bg-primary/20 text-forest px-3 py-1 rounded-full">
              Base CD: {formatCOP(totals.totalDirecto)}
            </span>
          </div>

          <div className="space-y-4">
            {[
              { id: 'administracion', label: 'Administración', color: 'bg-blue-50 text-blue-700', border: 'focus:border-blue-500', baseVal: totals.totalDirecto, baseLabel: 'Costo Directo' },
              { id: 'imprevistos', label: 'Imprevistos', color: 'bg-amber-50 text-amber-700', border: 'focus:border-amber-500', baseVal: totals.totalDirecto, baseLabel: 'Costo Directo' },
              { id: 'utilidad', label: 'Utilidad', color: 'bg-emerald-50 text-emerald-700', border: 'focus:border-emerald-500', baseVal: totals.totalDirecto, baseLabel: 'Costo Directo' },
              { id: 'iva', label: 'IVA', color: 'bg-rose-50 text-rose-700', border: 'focus:border-rose-500', baseVal: totals.totalDirecto, baseLabel: 'Costo Directo' },
            ].map(item => {
              const hasBreakdown = (state.aiuDetalles?.[item.id as keyof typeof state.aiuDetalles] || []).length > 0;
              const currentValue = state.aiu[item.id as keyof typeof state.aiu] ?? (item.id === 'iva' ? 19 : 0);
              const calculatedCost = totals.aiu[item.id as keyof typeof totals.aiu] || 0;
              const effectivePercentage = item.baseVal > 0 ? (calculatedCost / item.baseVal) * 100 : 0;
              
              return (
                <div key={item.id} className="p-4 rounded-xl bg-paper border border-linen shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${item.color} mb-1 inline-block`}>
                        {item.label}
                      </span>
                      {hasBreakdown ? (
                        <p className="text-[9px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                          ✓ Desglose sumado al %
                        </p>
                      ) : (
                        <p className="text-[9px] text-graphite font-medium">Base: {item.baseLabel} ({formatCOP(item.baseVal)})</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={currentValue}
                        onChange={(e) => updateState(`aiu.${item.id}`, Math.max(0, parseFloat(e.target.value) || 0))}
                        className={`w-18 px-2 py-1 text-right font-bold text-sm rounded border border-linen bg-white outline-none transition-all ${item.border} focus:ring-4 focus:ring-black/5`}
                      />
                      <span className="text-graphite font-bold text-xs">%</span>
                    </div>
                    <div className="w-24 text-right">
                      <p className="text-[8px] text-graphite uppercase tracking-widest mb-0.5">
                        {hasBreakdown ? 'Efec. ' + effectivePercentage.toFixed(1) + '%' : 'Valor'}
                      </p>
                      <p className="font-bold text-forest tabular-nums text-xs">
                        {formatCOP(calculatedCost)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Detailed expandable component */}
                  <AIUCategoryBreakdown 
                    category={item.id as any} 
                    label={item.label} 
                    items={state.aiuDetalles?.[item.id as keyof typeof state.aiuDetalles] || []} 
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: Summary */}
        <div className="space-y-6">
          <div className="bg-forest text-white rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -right-24 text-[200px] text-white/5 pointer-events-none">
              <Percent />
            </div>
            
            <h4 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-8">Resumen Financiero</h4>
            
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-end pb-4 border-b border-white/10">
                <span className="text-white/70">Costo Directo</span>
                <span className="font-serif text-2xl tabular-nums">{formatCOP(totals.totalDirecto)}</span>
              </div>
              
              <div className="flex justify-between items-end pb-4 border-b border-white/10">
                <span className="text-white/70">
                  Total A.I.U. 
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded ml-2">
                    {((totals.aiu.administracion + totals.aiu.imprevistos + totals.aiu.utilidad) / (totals.totalDirecto || 1) * 100).toFixed(1)}%
                  </span>
                </span>
                <span className="font-serif text-2xl tabular-nums">
                  {formatCOP(totals.aiu.administracion + totals.aiu.imprevistos + totals.aiu.utilidad)}
                </span>
              </div>
              
              <div className="flex justify-between items-end pb-4 border-b border-white/10">
                <span className="text-white/70">
                  IVA
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded ml-2">
                    {((totals.aiu.iva / (totals.totalDirecto || 1)) * 100).toFixed(1)}%
                  </span>
                </span>
                <span className="font-serif text-2xl tabular-nums">
                  {formatCOP(totals.aiu.iva)}
                </span>
              </div>
              
              <div className="pt-4">
                <span className="text-primary text-sm font-bold uppercase tracking-widest block mb-1">Gran Total Presupuesto</span>
                <span className="font-serif text-5xl font-bold text-white tabular-nums tracking-tight">
                  {formatCOP(totals.granTotal)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-linen shadow-warm flex items-start gap-4">
            <Info className="text-primary shrink-0 mt-1" />
            <div>
              <p className="text-sm text-graphite leading-relaxed">
                El <strong>Costo Directo</strong> representa todos los gastos intrínsecos de la obra. 
                El <strong>A.I.U.</strong> y el <strong>IVA</strong> se calculan sobre el costo directo.
                Puedes desglosar cada rubro detalladamente para mayor precisión; al agregar ítems a un desglose, la suma de los mismos **se sumará al valor porcentual general**.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
