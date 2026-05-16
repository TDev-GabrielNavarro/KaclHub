import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Calendar, BarChart, Info, Layers, Zap, RefreshCw } from 'lucide-react';
import { usePresupuesto } from '../context/PresupuestoContext';
import { cn, formatCOP } from '../utils/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer
} from 'recharts';

export const CronogramaTab: React.FC = () => {
  const { state, totals, editItem, updateState } = usePresupuesto();
  
  const duracionMeses = state.cronograma.duracionMeses || 12;
  const mesesArray = Array.from({ length: duracionMeses }, (_, i) => i + 1);

  // Toggle active month for a chapter
  const toggleMonth = (capituloId: string, mes: number) => {
    const capitulo = state.capitulos.find(c => c.id === capituloId);
    if (!capitulo) return;
    
    // Default to all months if undefined
    const currentMeses = capitulo.mesesActivos || mesesArray;
    let newMeses;
    
    if (currentMeses.includes(mes)) {
      newMeses = currentMeses.filter(m => m !== mes);
    } else {
      newMeses = [...currentMeses, mes].sort((a, b) => a - b);
    }
    
    editItem('capitulos', capituloId, { mesesActivos: newMeses });
  };

  // Regenerate Gantt with strict sequential distribution (waterfall)
  const resetGantt = () => {
    if (!window.confirm('¿Regenerar el Gantt? Esto distribuirá los capítulos de forma estrictamente secuencial a lo largo del proyecto.')) return;
    
    const C = state.capitulos.length;
    const M = duracionMeses;
    
    if (C === 0) return;
    
    state.capitulos.forEach((cap, index) => {
      const startMonth = Math.floor(index * (M / C)) + 1;
      const endMonth = Math.floor((index + 1) * (M / C));
      
      const newMeses = [];
      for (let m = startMonth; m <= endMonth; m++) {
        if (m <= M) newMeses.push(m);
      }
      
      // Asegurar que el último capítulo llegue hasta el final si hay redondeos
      if (index === C - 1 && newMeses[newMeses.length - 1] < M) {
        for (let m = newMeses[newMeses.length - 1] + 1; m <= M; m++) {
          newMeses.push(m);
        }
      }
      
      // Asegurar al menos 1 mes por capítulo
      if (newMeses.length === 0) {
        const fallback = Math.min(startMonth, M);
        newMeses.push(fallback);
      }

      editItem('capitulos', cap.id, { mesesActivos: newMeses });
    });
  };


  // Cash flow calculation
  const flujoMensual = useMemo(() => {
    let acumulado = 0;
    const totalDesasignado = 0; // if we want to track unassigned cost
    
    const flujo = mesesArray.map(mes => {
      let inversionMes = 0;
      
      state.capitulos.forEach(cap => {
        const activos = cap.mesesActivos || mesesArray;
        if (activos.includes(mes) && activos.length > 0) {
          const capTotal = totals.chapterTotals.find((t: any) => t.id === cap.id)?.total || 0;
          inversionMes += (capTotal / activos.length);
        }
      });

      acumulado += inversionMes;
      const porcentaje = totals.totalDirecto > 0 ? (acumulado / totals.totalDirecto) * 100 : 0;

      return {
        mes: `M${mes}`,
        inversion: inversionMes,
        acumulado,
        porcentaje,
        rawMes: mes
      };
    });
    
    return flujo;
  }, [state.capitulos, totals.chapterTotals, totals.totalDirecto, mesesArray]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-7xl mx-auto px-6 py-12 space-y-12"
    >
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-serif font-bold text-forest tracking-tight">Cronograma y Flujo</h2>
          <p className="text-graphite/60 mt-2 text-lg">Planificación temporal y proyección de inversión mensual.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white border border-linen p-4 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="bg-primary/10 p-2 rounded-lg text-primary shadow-sm">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-graphite/40">Duración Proyecto</p>
              <div className="flex items-center gap-2">
                <input 
                  type="number"
                  min="1"
                  max="48"
                  value={duracionMeses}
                  onChange={(e) => updateState('cronograma.duracionMeses', Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 bg-transparent text-lg font-serif font-bold text-forest border-b border-linen focus:border-primary outline-none"
                />
                <span className="text-lg font-serif font-bold text-forest">Meses</span>
              </div>
            </div>
          </div>
          <button
            onClick={resetGantt}
            title="Ajustar todas las actividades a la duración actual"
            className="flex items-center justify-center gap-2 bg-white border border-linen p-4 rounded-2xl shadow-sm hover:bg-paper hover:border-graphite/20 transition-all text-xs font-bold uppercase tracking-widest text-forest"
          >
            <RefreshCw size={18} className="text-primary" />
            <span className="hidden sm:inline">Regenerar Gantt</span>
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-4 text-blue-800 text-sm">
        <Info className="shrink-0" size={20} />
        <p>Haz clic en las celdas de la cuadrícula para indicar en qué meses se ejecuta cada capítulo. El costo de cada capítulo se dividirá equitativamente entre sus meses activos para generar el flujo de inversión.</p>
      </div>

      {/* GANTT INTERACTIVO */}
      <div className="bg-white rounded-3xl border border-linen shadow-warm overflow-hidden">
        <div className="px-6 py-5 border-b border-linen bg-paper/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="text-primary" size={20} />
            <h3 className="font-serif text-xl font-bold text-forest">Gantt de Ejecución</h3>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-pine text-white text-xs font-bold uppercase tracking-widest">
                <th className="px-6 py-4 sticky left-0 bg-pine z-10 shadow-[2px_0_5px_rgba(0,0,0,0.1)]">Capítulo</th>
                <th className="px-6 py-4 text-right">Costo Total</th>
                {mesesArray.map(mes => (
                  <th key={mes} className="px-2 py-4 text-center min-w-[40px] border-l border-white/10">
                    M{mes}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-linen">
              {state.capitulos.length === 0 ? (
                <tr>
                  <td colSpan={duracionMeses + 2} className="px-6 py-12 text-center text-graphite/40 text-sm italic">
                    Aún no hay capítulos definidos en el presupuesto.
                  </td>
                </tr>
              ) : state.capitulos.map((cap) => {
                const capTotal = totals.chapterTotals.find((t: any) => t.id === cap.id)?.total || 0;
                const activos = cap.mesesActivos || mesesArray;
                
                return (
                  <tr key={cap.id} className="hover:bg-paper/50 transition-colors group">
                    <td className="px-6 py-3 sticky left-0 bg-white group-hover:bg-paper/50 transition-colors z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)] border-r border-linen">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-primary">{cap.numero}</span>
                        <span className="font-bold text-forest uppercase text-xs truncate max-w-[250px]" title={cap.nombre}>
                          {cap.nombre || 'Capítulo sin nombre'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-forest tabular-nums text-sm">
                      {formatCOP(capTotal)}
                    </td>
                    {mesesArray.map(mes => {
                      const isActive = activos.includes(mes);
                      return (
                        <td key={mes} className="px-1 py-1 text-center border-l border-linen/50">
                          <button
                            onClick={() => toggleMonth(cap.id, mes)}
                            className={cn(
                              "w-full h-8 rounded-md transition-all border border-transparent",
                              isActive 
                                ? "bg-primary text-forest shadow-sm hover:bg-primary-light" 
                                : "bg-paper/50 hover:bg-linen hover:border-graphite/20"
                            )}
                            title={`M${mes} - ${isActive ? 'Activo' : 'Inactivo'}`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FLUJO DE INVERSION MENSUAL */}
      <div className="bg-white rounded-3xl border border-linen shadow-warm overflow-hidden">
        <div className="px-6 py-5 border-b border-linen bg-paper/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="text-primary" size={20} />
            <h3 className="font-serif text-xl font-bold text-forest">Flujo de Inversión (Costos Directos)</h3>
          </div>
        </div>
        
        {/* Gráfico de flujo */}
        <div className="p-6 h-[300px] border-b border-linen">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={flujoMensual} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorInv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fec31b" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#fec31b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="mes" stroke="#4a4a42" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis 
                stroke="#4a4a42" 
                fontSize={10} 
                tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
                tickLine={false}
                axisLine={false}
              />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e4dc" />
              <ReTooltip 
                formatter={(value: number) => formatCOP(value)}
                labelStyle={{ color: '#1a1a1a', fontWeight: 'bold' }}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e8e4dc', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="inversion" stroke="#fec31b" strokeWidth={3} fillOpacity={1} fill="url(#colorInv)" name="Inversión Mensual" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Tabla de flujo */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-pine text-white text-xs font-bold uppercase tracking-widest">
                <th className="px-6 py-4">Concepto (Mes)</th>
                <th className="px-6 py-4 text-right">Inversión Mensual</th>
                <th className="px-6 py-4 text-right">Acumulado</th>
                <th className="px-6 py-4 text-right">% Avance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-linen">
              {flujoMensual.map((fila) => (
                <tr key={fila.mes} className="hover:bg-paper/50 transition-colors">
                  <td className="px-6 py-3 font-bold text-graphite uppercase text-xs">
                    Mes {fila.rawMes}
                  </td>
                  <td className="px-6 py-3 text-right font-medium tabular-nums text-forest">
                    {formatCOP(fila.inversion)}
                  </td>
                  <td className="px-6 py-3 text-right font-bold tabular-nums text-forest">
                    {formatCOP(fila.acumulado)}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <div className="w-24 h-1.5 bg-linen rounded-full overflow-hidden hidden sm:block">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${fila.porcentaje}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-graphite tabular-nums w-12">
                        {fila.porcentaje.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-paper font-bold text-forest uppercase tracking-widest text-xs border-t-2 border-linen">
                <td className="px-6 py-4">Totales</td>
                <td className="px-6 py-4 text-right">{formatCOP(flujoMensual.reduce((acc, curr) => acc + curr.inversion, 0))}</td>
                <td className="px-6 py-4 text-right">{formatCOP(totals.totalDirecto)}</td>
                <td className="px-6 py-4 text-right">100.0%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </motion.div>
  );
};
