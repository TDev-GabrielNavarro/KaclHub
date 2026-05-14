/**
 * Utility functions for budget calculations in KaclHub
 */

export const calculateAIU = (subtotalDirecto: number, aiuPercents: { administracion: number, imprevistos: number, utilidad: number }) => {
  const admin = (subtotalDirecto * aiuPercents.administracion) / 100;
  const imprevistos = (subtotalDirecto * aiuPercents.imprevistos) / 100;
  const utilidad = (subtotalDirecto * aiuPercents.utilidad) / 100;
  
  return {
    administracion: admin,
    imprevistos: imprevistos,
    utilidad: utilidad,
    total: admin + imprevistos + utilidad
  };
};

export const calculateChapterTotal = (apuValue: number, manualValue: number) => {
  return apuValue + manualValue;
};

export const calculateCostPerM2 = (granTotal: number, areaConstruida: number) => {
  if (areaConstruida === 0) return 0;
  return granTotal / areaConstruida;
};
