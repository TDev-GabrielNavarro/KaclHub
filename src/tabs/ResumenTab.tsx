import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as ReTooltip, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis,
  CartesianGrid 
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Download, 
  FileCheck,
  Zap,
  Percent
} from 'lucide-react';
import { formatCOP, cn } from '../utils/utils';
import { usePresupuesto } from '../context/PresupuestoContext';
import { generateProfessionalReport } from '../utils/pdfGenerator';

export const ResumenTab: React.FC = () => {
  const { state, totals } = usePresupuesto();

  const dataPie = useMemo(() => [
    { name: 'Costos Directos', value: totals.totalDirecto, color: '#1a1a1a' },
    { name: 'Adm (A)', value: totals.aiu.administracion, color: '#3b82f6' },
    { name: 'Imp (I)', value: totals.aiu.imprevistos, color: '#f59e0b' },
    { name: 'Util (U)', value: totals.aiu.utilidad, color: '#10b981' },
    { name: 'IVA', value: totals.aiu.iva, color: '#f43f5e' },
  ], [totals]);

  const duracionMeses = state.cronograma.duracionMeses || 12;
  const mesesArray = Array.from({ length: duracionMeses }, (_, i) => i + 1);

  const dataCurve = useMemo(() => {
    let acumulado = 0;
    return mesesArray.map(mes => {
      let inversionMes = 0;
      state.capitulos.forEach(cap => {
        const activos = cap.mesesActivos || mesesArray;
        if (activos.includes(mes) && activos.length > 0) {
          const capTotal = totals.chapterTotals.find((t: any) => t.id === cap.id)?.total || 0;
          inversionMes += (capTotal / activos.length);
        }
      });
      acumulado += inversionMes;
      return {
        month: `M${mes}`,
        investment: acumulado,
        rawInvestment: inversionMes
      };
    });
  }, [state.capitulos, totals.chapterTotals, mesesArray]);

  const handleExport = () => {
    generateProfessionalReport(state, totals);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-6 py-12 space-y-12"
    >
      {/* Sticky Summary Bar */}
      <div className="sticky top-[120px] z-40 bg-pine text-white px-8 py-4 rounded-2xl shadow-2xl flex flex-wrap items-center justify-between gap-6 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-xl">
            <DollarSign className="text-primary" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-primary/80 font-bold">Total Presupuesto</p>
            <h4 className="text-2xl font-serif font-bold">{formatCOP(totals.granTotal)}</h4>
          </div>
        </div>

        <div className="flex gap-12">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Costo / m²</p>
            <p className="font-bold tabular-nums text-primary">{formatCOP(totals.costoM2)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Duración</p>
            <p className="font-bold">{duracionMeses} Meses</p>
          </div>
        </div>

        <button 
          onClick={handleExport}
          className="px-8 py-3 bg-primary text-forest rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-primary-light transition-all shadow-lg shadow-primary/20"
        >
          <Download size={16} />
          Exportar PDF
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard 
          label="Costos Directos" 
          value={formatCOP(totals.totalDirecto)} 
          sub={`${totals.granTotal > 0 ? ((totals.totalDirecto / totals.granTotal) * 100).toFixed(1) : 0}% del total`} 
          icon={DollarSign} 
        />
        <KPICard 
          label="Administración" 
          value={formatCOP(totals.aiu.administracion)} 
          sub={(state.aiuDetalles?.administracion?.length > 0) ? `${state.aiu.administracion}% A + Detalle` : `${state.aiu.administracion}% A`} 
          icon={Zap} 
          color="border-blue-400" 
        />
        <KPICard 
          label="Imprevistos" 
          value={formatCOP(totals.aiu.imprevistos)} 
          sub={(state.aiuDetalles?.imprevistos?.length > 0) ? `${state.aiu.imprevistos}% I + Detalle` : `${state.aiu.imprevistos}% I`} 
          icon={Clock} 
          color="border-amber-400"
        />
        <KPICard 
          label="Utilidad" 
          value={formatCOP(totals.aiu.utilidad)} 
          sub={(state.aiuDetalles?.utilidad?.length > 0) ? `${state.aiu.utilidad}% U + Detalle` : `${state.aiu.utilidad}% U`} 
          icon={TrendingUp} 
          color="border-emerald-400"
        />
        <KPICard 
          label="IVA" 
          value={formatCOP(totals.aiu.iva)} 
          sub={(state.aiuDetalles?.iva?.length > 0) ? `${state.aiu.iva ?? 19}% IVA + Detalle` : `${state.aiu.iva ?? 19}% IVA`} 
          icon={Percent} 
          color="border-rose-400"
        />
      </div>

      {/* Charts Block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-linen shadow-warm h-[400px] flex flex-col card-hover">
          <h4 className="font-serif text-xl font-bold text-forest mb-8">Composición del Costo</h4>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataPie}
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dataPie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ReTooltip formatter={(value: number) => formatCOP(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 flex-wrap mt-4">
            {dataPie.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-graphite">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-linen shadow-warm h-[400px] flex flex-col card-hover">
          <h4 className="font-serif text-xl font-bold text-forest mb-8">Curva S de Inversión</h4>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataCurve}>
                <defs>
                  <linearGradient id="colorInv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fec31b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#fec31b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#4a4a42" />
                <YAxis hide />
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e4dc" />
                <ReTooltip formatter={(value: number) => formatCOP(value)} />
                <Area type="monotone" dataKey="investment" stroke="#fec31b" strokeWidth={3} fillOpacity={1} fill="url(#colorInv)" name="Acumulado" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="pt-12">
        <button 
          onClick={handleExport}
          className="w-full relative group overflow-hidden bg-forest rounded-3xl p-12 text-center transition-all hover:bg-pine"
        >
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FileCheck className="text-primary" size={40} />
            </div>
            <h2 className="font-serif text-4xl font-bold text-white mb-4">Generar Informe Profesional</h2>
            <p className="text-linen/60 max-w-lg mx-auto mb-8">
              Compila toda la información en un documento PDF estructurado bajo normativa legal colombiana y estándares de interventoría.
            </p>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-xs font-bold uppercase tracking-widest text-primary">
              <span className="flex items-center gap-2">● Carátula</span>
              <span className="flex items-center gap-2">● Presupuesto Global</span>
              <span className="flex items-center gap-2">● Cronograma</span>
              <span className="flex items-center gap-2">● AIU Sustentado</span>
            </div>
          </div>
        </button>
      </div>
    </motion.div>
  );
};

const KPICard = ({ label, value, sub, icon: Icon, color = "border-linen" }: any) => (
  <div className={cn("bg-white p-6 rounded-2xl border border-linen border-b-4 shadow-warm flex flex-col gap-4 card-hover", color)}>
    <div className="flex items-center justify-between">
      <p className="text-[10px] font-bold uppercase tracking-widest text-graphite">{label}</p>
      <div className="p-2 bg-paper rounded-lg text-forest">
        <Icon size={16} />
      </div>
    </div>
    <div>
      <h5 className="text-xl font-bold text-forest tabular-nums">{value}</h5>
      <p className="text-xs text-graphite mt-1">{sub}</p>
    </div>
  </div>
);
