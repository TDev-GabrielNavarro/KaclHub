import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCOP } from './utils';

export const generateProfessionalReport = (state: any, totals: any) => {
  const doc = new jsPDF();
  const { caratula, capitulos, actividades, aiu, cronograma } = state;
  const { totalDirecto, totalAIU, granTotal, costoM2 } = totals;

  // Helper for adding headers
  const addHeader = (title: string) => {
    doc.setFontSize(18);
    doc.setTextColor(26, 46, 38); // Forest color
    doc.text(title, 14, 22);
    doc.setLineWidth(0.5);
    doc.setDrawColor(254, 195, 27); // Primary color
    doc.line(14, 25, 60, 25);
    doc.setFontSize(10);
    doc.setTextColor(100);
  };

  // --- PAGE 1: CARÁTULA ---
  doc.setFillColor(26, 46, 38);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text('INFORME TÉCNICO DE PRESUPUESTO', 14, 25);
  doc.setFontSize(10);
  doc.text(`Generado por KaclHub - ${new Date().toLocaleDateString()}`, 14, 32);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  let y = 60;

  const addInfoRow = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value || 'N/A', 70, y);
    y += 10;
  };

  addInfoRow('Proyecto:', caratula.nombre);
  addInfoRow('Propietario:', caratula.propietario);
  addInfoRow('Profesional:', caratula.profesional);
  addInfoRow('Matrícula:', caratula.matricula);
  addInfoRow('Ubicación:', `${caratula.direccion}, ${caratula.barrio}, ${caratula.ciudad}`);
  addInfoRow('Uso:', caratula.uso);
  addInfoRow('Sistema Constructivo:', caratula.sistemaConstructivo);
  addInfoRow('Área Construida:', `${caratula.areaConstruida} m²`);

  y += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN FINANCIERO', 14, y);
  y += 10;

  const addFinanceRow = (label: string, value: number) => {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(label, 14, y);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCOP(value), 196, y, { align: 'right' });
    y += 8;
  };

  addFinanceRow('Total Costos Directos:', totalDirecto);
  addFinanceRow('Administración:', totals.aiu.administracion);
  addFinanceRow('Imprevistos:', totals.aiu.imprevistos);
  addFinanceRow('Utilidad:', totals.aiu.utilidad);
  
  y += 4;
  doc.setLineWidth(0.5);
  doc.line(14, y, 196, y);
  y += 8;

  doc.setFontSize(16);
  doc.text('VALOR TOTAL PROYECTO:', 14, y);
  doc.text(formatCOP(granTotal), 196, y, { align: 'right' });
  
  y += 12;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Costo promedio por m²: ${formatCOP(costoM2)}`, 14, y);

  // --- PAGE 2: PRESUPUESTO DETALLADO ---
  doc.addPage();
  addHeader('RESUMEN DE PRESUPUESTO POR CAPÍTULOS');

  const budgetData = capitulos.map((cap: any) => {
    const capTotal = totals.chapterTotals.find((t: any) => t.id === cap.id)?.total || 0;
    const porcentaje = totalDirecto > 0 ? (capTotal / totalDirecto) * 100 : 0;
    return [
      cap.numero,
      cap.nombre.toUpperCase(),
      formatCOP(capTotal),
      `${porcentaje.toFixed(2)}%`
    ];
  });

  autoTable(doc, {
    startY: 35,
    head: [['Ítem', 'Descripción del Capítulo', 'Valor Total', '%']],
    body: budgetData,
    theme: 'striped',
    headStyles: { fillColor: [26, 46, 38], textColor: [255, 255, 255] },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' }
    },
    foot: [[
      '', 
      'TOTAL COSTOS DIRECTOS', 
      formatCOP(totalDirecto), 
      '100%'
    ]],
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
  });

  // --- PAGE 3: CRONOGRAMA Y FLUJO ---
  doc.addPage();
  addHeader('CRONOGRAMA DE INVERSIÓN (FLUJO DE CAJA)');

  const duracion = cronograma.duracionMeses || 12;
  const meses = Array.from({ length: duracion }, (_, i) => i + 1);
  
  let acumulado = 0;
  const flowData = meses.map(mes => {
    let inversionMes = 0;
    capitulos.forEach((cap: any) => {
      const activos = cap.mesesActivos || meses;
      if (activos.includes(mes) && activos.length > 0) {
        const capTotal = totals.chapterTotals.find((t: any) => t.id === cap.id)?.total || 0;
        inversionMes += (capTotal / activos.length);
      }
    });
    acumulado += inversionMes;
    const porcentajeAvance = totalDirecto > 0 ? (acumulado / totalDirecto) * 100 : 0;
    
    return [
      `Mes ${mes}`,
      formatCOP(inversionMes),
      formatCOP(acumulado),
      `${porcentajeAvance.toFixed(1)}%`
    ];
  });

  autoTable(doc, {
    startY: 35,
    head: [['Periodo', 'Inversión Mensual', 'Inversión Acumulada', '% Avance']],
    body: flowData,
    theme: 'grid',
    headStyles: { fillColor: [26, 46, 38], textColor: [255, 255, 255] },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' }
    }
  });

  // Footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Página ${i} de ${pageCount} - Generado por KaclHub`,
      105,
      290,
      { align: 'center' }
    );
  }

  doc.save(`Presupuesto_${caratula.nombre || 'Proyecto'}.pdf`);
};
