import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

export type TabType = 'caratula' | 'presupuesto' | 'resumen';

export interface AnteproyectoItem {
  id: string;
  item: string;
  responsable: string;
  unidad: string;
  cantidad: number;
  valorUnitario: number;
}

export interface Activity {
  id: string;
  capituloId: string;
  nombre: string;
  unidad: string;
  cantidad: number;
  apuId?: string; // Optional link to an APU
  valorManual?: number;
}

export interface Capitulo {
  id: string;
  numero: string;
  nombre: string;
  valManual: number;
}

interface PresupuestoState {
  meta: {
    savedAt: string | null;
    version: string;
  };
  caratula: {
    nombre: string;
    propietario: string;
    profesional: string;
    matricula: string;
    ciudad: string;
    direccion: string;
    barrio: string;
    fechaElaboracion: string;
    fechaCortePrecios: string;
    areaConstruida: number;
    areaLote: number;
    numeroPisos: number;
    uso: string;
    sistemaConstructivo: string;
    normativa: string;
    descripcion: string;
  };
  anteproyecto: AnteproyectoItem[];
  actividades: Activity[];
  capitulos: Capitulo[];
  aiu: {
    administracion: number;
    imprevistos: number;
    utilidad: number;
  };
  adminDetalle: any[];
  cronograma: {
    duracionMeses: number;
    fechaInicio: string;
  };
}

const initialState: PresupuestoState = {
  meta: {
    savedAt: null,
    version: '1.0.0',
  },
  caratula: {
    nombre: '',
    propietario: '',
    profesional: '',
    matricula: '',
    ciudad: 'Barranquilla',
    direccion: '',
    barrio: '',
    fechaElaboracion: '',
    fechaCortePrecios: '',
    areaConstruida: 0,
    areaLote: 0,
    numeroPisos: 1,
    uso: 'Residencial Unifamiliar',
    sistemaConstructivo: '',
    normativa: 'NSR-10 · POT Barranquilla',
    descripcion: '',
  },
  anteproyecto: [
    { id: '1', item: 'Levantamiento topográfico', responsable: 'Topógrafo certificado', unidad: 'Global', cantidad: 1, valorUnitario: 2500000 },
    { id: '2', item: 'Estudio de suelos y geotecnia', responsable: 'Ing. Geotécnico', unidad: 'Global', cantidad: 1, valorUnitario: 4500000 },
  ],
  actividades: [],
  capitulos: [
    { id: 'c1', numero: '01', nombre: 'Preliminares y descapote', valManual: 0 },
    { id: 'c2', numero: '02', nombre: 'Movimiento de tierras', valManual: 0 },
    { id: 'c3', numero: '03', nombre: 'Cimentación', valManual: 0 },
  ],
  aiu: {
    administracion: 12,
    imprevistos: 5,
    utilidad: 8,
  },
  adminDetalle: [],
  cronograma: {
    duracionMeses: 12,
    fechaInicio: '',
  },
};

interface PresupuestoContextType {
  state: PresupuestoState;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  updateState: (path: string, value: any) => void;
  resetState: () => void;
  totals: any;
  addItem: (path: 'anteproyecto' | 'capitulos' | 'actividades', item: any) => void;
  removeItem: (path: 'anteproyecto' | 'capitulos' | 'actividades', id: string) => void;
  editItem: (path: 'anteproyecto' | 'capitulos' | 'actividades', id: string, data: any) => void;
}

const PresupuestoContext = createContext<PresupuestoContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'kaclhub_budget_data';

export const PresupuestoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PresupuestoState>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved state", e);
        return initialState;
      }
    }
    return initialState;
  });
  
  const [activeTab, setActiveTab] = useState<TabType>('caratula');

  // Derived State (Totals)
  const totals = useMemo(() => {
    const totalAnteproyecto = state.anteproyecto.reduce((acc, curr) => acc + (curr.valorUnitario * curr.cantidad), 0);
    
    const chapterTotals = state.capitulos.map(cap => {
      const activitiesInCap = state.actividades.filter(a => a.capituloId === cap.id);
      const activitiesTotal = activitiesInCap.reduce((acc, curr) => acc + (curr.valorManual || 0) * (curr.cantidad || 0), 0);
      return {
        id: cap.id,
        total: (cap.valManual || 0) + activitiesTotal
      };
    });

    const totalDirecto = chapterTotals.reduce((acc, curr) => acc + curr.total, 0);
    
    const aiu = {
      administracion: (totalDirecto * state.aiu.administracion) / 100,
      imprevistos: (totalDirecto * state.aiu.imprevistos) / 100,
      utilidad: (totalDirecto * state.aiu.utilidad) / 100,
    };
    
    const totalAIU = aiu.administracion + aiu.imprevistos + aiu.utilidad;
    const granTotal = totalDirecto + totalAIU;
    const costoM2 = state.caratula.areaConstruida > 0 ? granTotal / state.caratula.areaConstruida : 0;

    return {
      totalAnteproyecto,
      chapterTotals,
      totalDirecto,
      aiu,
      totalAIU,
      granTotal,
      costoM2
    };
  }, [state]);

  // Auto-save
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
      ...state,
      meta: { ...state.meta, savedAt: new Date().toISOString() }
    }));
  }, [state]);

  const updateState = (path: string, value: any) => {
    setState(prev => {
      const newState = { ...prev };
      const keys = path.split('.');
      let current: any = newState;
      
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        current[key] = { ...current[key] };
        current = current[key];
      }
      
      current[keys[keys.length - 1]] = value;
      return newState;
    });
  };

  const resetState = () => {
    if (window.confirm('¿Estás seguro de que deseas borrar todo el presupuesto y empezar de cero?')) {
      setState(initialState);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  const addItem = (path: 'anteproyecto' | 'capitulos' | 'actividades', item: any) => {
    setState(prev => ({
      ...prev,
      [path]: [...prev[path], { id: crypto.randomUUID(), ...item }]
    }));
  };

  const removeItem = (path: 'anteproyecto' | 'capitulos' | 'actividades', id: string) => {
    setState(prev => ({
      ...prev,
      [path]: prev[path].filter((item: any) => item.id !== id)
    }));
  };

  const editItem = (path: 'anteproyecto' | 'capitulos' | 'actividades', id: string, data: any) => {
    setState(prev => ({
      ...prev,
      [path]: prev[path].map((item: any) => item.id === id ? { ...item, ...data } : item)
    }));
  };

  return (
    <PresupuestoContext.Provider value={{ state, activeTab, setActiveTab, updateState, resetState, totals, addItem, removeItem, editItem }}>
      {children}
    </PresupuestoContext.Provider>
  );
};

export const usePresupuesto = () => {
  const context = useContext(PresupuestoContext);
  if (!context) throw new Error('usePresupuesto must be used within a PresupuestoProvider');
  return context;
};
