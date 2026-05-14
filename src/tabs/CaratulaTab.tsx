import React from 'react';
import { motion } from 'motion/react';
import { usePresupuesto } from '../context/PresupuestoContext';
import { ArrowRight, MapPin, Calendar, Building, User } from 'lucide-react';

export const CaratulaTab: React.FC = () => {
  const { state, updateState, setActiveTab } = usePresupuesto();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Handle numeric fields
    const numericFields = ['areaConstruida', 'areaLote', 'numeroPisos'];
    const val = numericFields.includes(name) ? Math.max(0, parseFloat(value) || 0) : value;
    
    updateState(`caratula.${name}`, val);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-7xl mx-auto px-6 py-12"
    >
      <div className="bg-white rounded-2xl shadow-warm border border-linen overflow-hidden relative card-hover">
        <div className="absolute top-0 right-0 p-12 opacity-[0.05] pointer-events-none">
          <Building size={150} />
        </div>

        <div className="p-8 lg:p-12">
          <div className="mb-12">
            <h3 className="font-serif text-3xl font-bold text-forest mb-2">Carátula del Proyecto</h3>
            <p className="text-graphite">Identificación completa del proyecto y el profesional responsable.</p>
          </div>

          <div className="space-y-12">
            {/* Sección A */}
            <section>
              <div className="flex items-center gap-2 mb-6 border-b border-linen pb-2">
                <span className="text-primary font-bold font-serif text-2xl">01</span>
                <h4 className="font-bold text-forest uppercase tracking-widest text-sm">Identificación del Proyecto</h4>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-graphite flex items-center gap-2">
                    <Building size={14} /> Nombre del Proyecto
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={state.caratula.nombre}
                    onChange={handleInputChange}
                    placeholder="Ej. Edificio Las Palmas · Fase 1"
                    className="w-full px-4 py-3 rounded-xl border border-linen bg-cream/50 focus:bg-white focus:border-primary outline-none transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-graphite flex items-center gap-2">
                    <User size={14} /> Propietario / Comitente
                  </label>
                  <input
                    type="text"
                    name="propietario"
                    value={state.caratula.propietario}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-linen bg-cream/50 focus:bg-white focus:border-primary outline-none transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-graphite">Uso del Proyecto</label>
                  <select
                    name="uso"
                    value={state.caratula.uso}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-linen bg-cream/50 focus:bg-white focus:border-primary outline-none transition-all font-medium"
                  >
                    <option>Residencial Unifamiliar</option>
                    <option>Multifamiliar</option>
                    <option>Comercial</option>
                    <option>Institucional</option>
                    <option>Industrial</option>
                    <option>Mixto</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-graphite">N° de pisos</label>
                  <input
                    type="number"
                    name="numeroPisos"
                    value={state.caratula.numeroPisos}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-linen bg-cream/50 focus:bg-white focus:border-primary outline-none transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-graphite">Area construida (m²)</label>
                  <input
                    type="number"
                    name="areaConstruida"
                    value={state.caratula.areaConstruida}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-linen bg-cream/50 focus:bg-white focus:border-primary outline-none transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-graphite">Sistema constructivo</label>
                  <select
                    name="sistemaConstructivo"
                    value={state.caratula.sistemaConstructivo}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-linen bg-cream/50 focus:bg-white focus:border-primary outline-none transition-all font-medium"
                  >
                    <option>Concreto Reforzado</option>
                    <option>Acero</option>
                    <option>Madera</option>
                    <option>Mampostería</option>
                    <option>Mixto</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-graphite">Normativa</label>
                  <input
                    type="text"
                    name="normativa"
                    value={state.caratula.normativa}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-linen bg-cream/50 focus:bg-white focus:border-primary outline-none transition-all font-medium"
                  />
                </div>
                <div className="lg:col-span-2 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-graphite">Descripción</label>
                  <textarea
                    name="descripcion"
                    placeholder="Escribe una breve descripción del proyecto"
                    value={state.caratula.descripcion}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 min-h-24 max-h-38 resize-none rounded-xl border border-linen bg-cream/50 focus:bg-white focus:border-primary outline-none transition-all font-medium"
                  />
                </div>
              </div>
            </section>
            
            {/* Sección B */}
            <section>
              <div className="flex items-center gap-2 mb-6 border-b border-linen pb-2">
                <span className="text-primary font-bold font-serif text-2xl">02</span>
                <h4 className="font-bold text-forest uppercase tracking-widest text-sm">Datos del Profesional</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-graphite">Arquitecto / Ingeniero</label>
                  <input
                    type="text"
                    name="profesional"
                    value={state.caratula.profesional}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-linen bg-cream/50 focus:bg-white focus:border-primary outline-none transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-graphite">Matrícula Profesional</label>
                  <input
                    type="text"
                    name="matricula"
                    value={state.caratula.matricula}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-linen bg-cream/50 focus:bg-white focus:border-primary outline-none transition-all font-medium"
                  />
                </div>
              </div>
            </section>

            {/* Sección C */}
            <section>
              <div className="flex items-center gap-2 mb-6 border-b border-linen pb-2">
                <span className="text-primary font-bold font-serif text-2xl">03</span>
                <h4 className="font-bold text-forest uppercase tracking-widest text-sm">Ubicación y Cronología</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-graphite flex items-center gap-2">
                    <MapPin size={14} /> Ciudad
                  </label>
                  <input
                    type="text"
                    name="ciudad"
                    value={state.caratula.ciudad}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-linen bg-cream/50 focus:bg-white focus:border-primary outline-none transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-graphite">Dirección</label>
                  <input
                    type="text"
                    name="direccion"
                    value={state.caratula.direccion}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-linen bg-cream/50 focus:bg-white focus:border-primary outline-none transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-graphite flex items-center gap-2">
                    <Calendar size={14} /> Fecha Elaboración
                  </label>
                  <input
                    type="date"
                    name="fechaElaboracion"
                    value={state.caratula.fechaElaboracion}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-linen bg-cream/50 focus:bg-white focus:border-primary outline-none transition-all font-medium"
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="mt-16 flex justify-end">
            <button
              onClick={() => setActiveTab('presupuesto')}
              className="group flex items-center gap-3 px-10 py-4 bg-forest text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl shadow-forest/10"
            >
              Continuar al Presupuesto
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
