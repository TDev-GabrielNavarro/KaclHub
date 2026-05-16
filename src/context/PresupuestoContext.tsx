import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

export type TabType = 'caratula' | 'presupuesto' | 'cronograma'| 'resumen';

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

export interface APUSubItem {
  id: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  valorUnitario: number;
}

export interface APUActivity {
  id: string;
  nombre: string;
  unidad: string;
  desperdicio: number; // % factor de desperdicio
  materiales: APUSubItem[];
  manoDeObra: APUSubItem[];
  equipos: APUSubItem[];
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
  apus: APUActivity[];
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
  anteproyecto: [],
  actividades: [],
  apus: [],
  capitulos: [],
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
  removeChapterWithDependencies: (chapterId: string) => void;
  addActivityWithAPU: (capituloId: string, nombre: string) => void;
  removeActivityWithAPU: (activityId: string) => void;
  addAPU: (apu: Omit<APUActivity, 'id'>) => void;
  removeAPU: (id: string) => void;
  editAPU: (id: string, data: Partial<APUActivity>) => void;
  addAPUSubItem: (apuId: string, category: 'materiales' | 'manoDeObra' | 'equipos', item: Omit<APUSubItem, 'id'>) => void;
  removeAPUSubItem: (apuId: string, category: 'materiales' | 'manoDeObra' | 'equipos', itemId: string) => void;
  editAPUSubItem: (apuId: string, category: 'materiales' | 'manoDeObra' | 'equipos', itemId: string, data: Partial<APUSubItem>) => void;
  getAPUTotal: (apuId: string) => number;
}

const PresupuestoContext = createContext<PresupuestoContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'kaclhub_budget_data';

export const PresupuestoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PresupuestoState>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with initialState so any NEW fields added after a save
        // always have a fallback default value (prevents undefined crashes).
        return { ...initialState, ...parsed };
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
    // Helper: calculate APU total for a given APU id
    const getAPUTotal = (apuId: string | undefined): number => {
      if (!apuId) return 0;
      const apu = state.apus.find(a => a.id === apuId);
      if (!apu) return 0;
      const mat = apu.materiales.reduce((s, i) => s + i.cantidad * i.valorUnitario, 0);
      const mob = apu.manoDeObra.reduce((s, i) => s + i.cantidad * i.valorUnitario, 0);
      const eq  = apu.equipos.reduce((s, i) => s + i.cantidad * i.valorUnitario, 0);
      const subtotal = mat + mob + eq;
      return subtotal + subtotal * ((apu.desperdicio || 0) / 100);
    };

    const totalAnteproyecto = state.anteproyecto.reduce((acc, curr) => acc + (curr.valorUnitario * curr.cantidad), 0);
    
    const chapterTotals = state.capitulos.map(cap => {
      const activitiesInCap = state.actividades.filter(a => a.capituloId === cap.id);
      const activitiesTotal = activitiesInCap.reduce((acc, curr) => {
        // Use APU unit price if linked, otherwise fallback to valorManual
        const unitPrice = curr.apuId ? getAPUTotal(curr.apuId) : (curr.valorManual || 0);
        return acc + unitPrice * (curr.cantidad || 0);
      }, 0);
      return {
        id: cap.id,
        total: activitiesTotal
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
      costoM2,
      _getAPUTotal: getAPUTotal, // internal helper exposed for provider
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

  const addAPU = (apu: Omit<APUActivity, 'id'>) => {
    setState(prev => ({ ...prev, apus: [...prev.apus, { id: crypto.randomUUID(), ...apu }] }));
  };

  const removeAPU = (id: string) => {
    setState(prev => ({ ...prev, apus: prev.apus.filter(a => a.id !== id) }));
  };

  const editAPU = (id: string, data: Partial<APUActivity>) => {
    setState(prev => ({ ...prev, apus: prev.apus.map(a => a.id === id ? { ...a, ...data } : a) }));
  };

  const addAPUSubItem = (apuId: string, category: 'materiales' | 'manoDeObra' | 'equipos', item: Omit<APUSubItem, 'id'>) => {
    setState(prev => ({
      ...prev,
      apus: prev.apus.map(a => a.id === apuId
        ? { ...a, [category]: [...a[category], { id: crypto.randomUUID(), ...item }] }
        : a
      )
    }));
  };

  const removeAPUSubItem = (apuId: string, category: 'materiales' | 'manoDeObra' | 'equipos', itemId: string) => {
    setState(prev => ({
      ...prev,
      apus: prev.apus.map(a => a.id === apuId
        ? { ...a, [category]: a[category].filter((item: APUSubItem) => item.id !== itemId) }
        : a
      )
    }));
  };

  const editAPUSubItem = (apuId: string, category: 'materiales' | 'manoDeObra' | 'equipos', itemId: string, data: Partial<APUSubItem>) => {
    setState(prev => ({
      ...prev,
      apus: prev.apus.map(a => a.id === apuId
        ? { ...a, [category]: a[category].map((item: APUSubItem) => item.id === itemId ? { ...item, ...data } : item) }
        : a
      )
    }));
  };

  // Add an activity AND auto-create a linked APU
  const addActivityWithAPU = (capituloId: string, nombre: string) => {
    const actId = crypto.randomUUID();
    const apuId = crypto.randomUUID();
    setState(prev => ({
      ...prev,
      actividades: [...prev.actividades, {
        id: actId,
        capituloId,
        nombre: nombre || '',
        unidad: '',
        cantidad: 1,
        apuId,
        valorManual: 0,
      }],
      apus: [...prev.apus, {
        id: apuId,
        nombre: nombre || '',
        unidad: '',
        desperdicio: 5,
        materiales: [],
        manoDeObra: [],
        equipos: [],
      }]
    }));
  };

  // Remove an activity AND its linked APU
  const removeActivityWithAPU = (activityId: string) => {
    setState(prev => {
      const activity = prev.actividades.find(a => a.id === activityId);
      return {
        ...prev,
        actividades: prev.actividades.filter(a => a.id !== activityId),
        apus: activity?.apuId
          ? prev.apus.filter(a => a.id !== activity.apuId)
          : prev.apus,
      };
    });
  };

  // Remove a chapter AND all its activities AND all their linked APUs
  const removeChapterWithDependencies = (chapterId: string) => {
    setState(prev => {
      const activitiesToRemove = prev.actividades.filter(a => a.capituloId === chapterId);
      const apusToRemove = activitiesToRemove.map(a => a.apuId).filter(Boolean);
      
      return {
        ...prev,
        capitulos: prev.capitulos.filter(c => c.id !== chapterId),
        actividades: prev.actividades.filter(a => a.capituloId !== chapterId),
        apus: prev.apus.filter(a => !apusToRemove.includes(a.id)),
      };
    });
  };

  // Expose getAPUTotal as a function consumers can call
  const getAPUTotalFn = (apuId: string): number => {
    return totals._getAPUTotal(apuId);
  };

  return (
    <PresupuestoContext.Provider value={{
      state, activeTab, setActiveTab, updateState, resetState, totals,
      addItem, removeItem, editItem,
      removeChapterWithDependencies,
      addActivityWithAPU, removeActivityWithAPU,
      addAPU, removeAPU, editAPU,
      addAPUSubItem, removeAPUSubItem, editAPUSubItem,
      getAPUTotal: getAPUTotalFn,
    }}>
      {children}
    </PresupuestoContext.Provider>
  );
};

export const usePresupuesto = () => {
  const context = useContext(PresupuestoContext);
  if (!context) throw new Error('usePresupuesto must be used within a PresupuestoProvider');
  return context;
};
