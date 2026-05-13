import React, { createContext, useContext, useState, useEffect } from 'react';

export type TabType = 'caratula' | 'presupuesto' | 'resumen';

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
  anteproyecto: any[];
  actividades: any[];
  capitulos: any[];
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
  updateCaratula: (data: Partial<PresupuestoState['caratula']>) => void;
}

const PresupuestoContext = createContext<PresupuestoContextType | undefined>(undefined);

export const PresupuestoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PresupuestoState>(initialState);
  const [activeTab, setActiveTab] = useState<TabType>('caratula');

  const updateCaratula = (data: Partial<PresupuestoState['caratula']>) => {
    setState(prev => ({
      ...prev,
      caratula: { ...prev.caratula, ...data }
    }));
  };

  return (
    <PresupuestoContext.Provider value={{ state, activeTab, setActiveTab, updateCaratula }}>
      {children}
    </PresupuestoContext.Provider>
  );
};

export const usePresupuesto = () => {
  const context = useContext(PresupuestoContext);
  if (!context) throw new Error('usePresupuesto must be used within a PresupuestoProvider');
  return context;
};
