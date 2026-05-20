import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCOP } from './utils';

type RGB = [number, number, number];

// ─── Paleta ────────────────────────────────────────────────────────────────
const C = {
  forest:    [26,  26,  26]  as RGB,
  dark:      [39,  39,  42]  as RGB,
  gold:      [254, 195, 27]  as RGB,
  white:     [255, 255, 255] as RGB,
  gray:      [113, 113, 122] as RGB,
  light:     [244, 244, 245] as RGB,
  cream:     [250, 248, 240] as RGB,
  blue:      [37,  99,  235] as RGB,
  amber:     [180, 100, 10]  as RGB,
  green:     [16,  130, 90]  as RGB,
  red:       [200, 38,  38]  as RGB,
};

const W = 210, H = 297, ML = 14, CW = 182;

// ─── Helpers de dibujo ─────────────────────────────────────────────────────
const fill  = (d: jsPDF, c: RGB) => d.setFillColor(c[0], c[1], c[2]);
const draw  = (d: jsPDF, c: RGB) => d.setDrawColor(c[0], c[1], c[2]);
const txt   = (d: jsPDF, c: RGB) => d.setTextColor(c[0], c[1], c[2]);

function rect(d: jsPDF, x: number, y: number, w: number, h: number, c: RGB) {
  fill(d, c); d.rect(x, y, w, h, 'F');
}

function hline(d: jsPDF, x1: number, y: number, x2: number, c: RGB, lw = 0.2) {
  draw(d, c); d.setLineWidth(lw); d.line(x1, y, x2, y); d.setLineWidth(0.2);
}

function font(d: jsPDF, size: number, style: 'normal'|'bold'|'italic' = 'normal', color: RGB = C.forest) {
  d.setFont('helvetica', style); d.setFontSize(size); txt(d, color);
}

// ─── Encabezado de sección ────────────────────────────────────────────────
function secHead(d: jsPDF, title: string, right: string, y: number): number {
  rect(d, ML, y, CW, 11, C.forest);
  rect(d, ML, y + 11, CW, 2, C.gold);
  font(d, 9.5, 'bold', C.white);
  d.text(title, ML + 3, y + 7.5);
  font(d, 8.5, 'normal', C.gold);
  d.text(right, W - ML - 3, y + 7.5, { align: 'right' });
  return y + 17;
}

// ─── Gráfica de barras ────────────────────────────────────────────────────
function barChart(
  d: jsPDF, x: number, y: number, w: number, h: number,
  data: { label: string; value: number; color: RGB }[]
) {
  if (!data.length) return;
  const max = Math.max(...data.map(i => i.value));
  if (!max) return;
  const bw = (w / data.length) * 0.6;
  const gap = (w / data.length) * 0.4;
  const ch = h - 14;

  // grid
  for (let i = 0; i <= 4; i++) {
    const gy = y + (i / 4) * ch;
    d.setDrawColor(220, 220, 220); d.setLineWidth(0.1);
    d.line(x, gy, x + w, gy);
  }
  d.setLineWidth(0.2);

  data.forEach((item, i) => {
    const bh = (item.value / max) * ch;
    const bx = x + i * (w / data.length) + gap / 2;
    const by = y + ch - bh;
    fill(d, item.color); d.rect(bx, by, bw, bh, 'F');
    // valor
    font(d, 5.5, 'bold', C.gray);
    const vs = formatCOP(item.value).replace('$\u00a0', '').replace('$', '');
    d.text(vs.slice(0, 11), bx + bw / 2, by - 1, { align: 'center' });
    // etiqueta
    font(d, 6, 'normal', C.gray);
    d.text((item.label.length > 9 ? item.label.slice(0, 9) + '…' : item.label), bx + bw / 2, y + ch + 5, { align: 'center' });
  });

  draw(d, C.gray); d.setLineWidth(0.3);
  d.line(x, y, x, y + ch); d.line(x, y + ch, x + w, y + ch);
  d.setLineWidth(0.2);
}

// ─── Gráfica de línea (Curva S) ───────────────────────────────────────────
function lineChart(d: jsPDF, x: number, y: number, w: number, h: number, pts: number[], labels: string[]) {
  if (pts.length < 2) return;
  const max = Math.max(...pts);
  if (!max) return;

  rect(d, x, y, w, h, [252, 252, 250] as RGB);

  // grid
  for (let i = 0; i <= 4; i++) {
    const gy = y + (i / 4) * h;
    d.setDrawColor(225, 225, 225); d.setLineWidth(0.1); d.line(x, gy, x + w, gy);
    font(d, 5, 'normal', C.gray);
    d.text(formatCOP(max * (1 - i / 4)).replace(/\$\s*/, '').replace(/\..*/, ''), x - 1, gy + 1.5, { align: 'right' });
  }
  d.setLineWidth(0.2);

  const coords = pts.map((v, i) => ({
    px: x + (i / (pts.length - 1)) * w,
    py: y + h - (v / max) * h,
  }));

  // área bajo la curva (rects aproximados)
  fill(d, [255, 248, 200] as RGB);
  coords.forEach((c, i) => {
    if (!i) return;
    const prev = coords[i - 1];
    d.rect(prev.px, Math.min(c.py, prev.py), c.px - prev.px, y + h - Math.min(c.py, prev.py), 'F');
  });

  // línea
  draw(d, C.gold); d.setLineWidth(0.8);
  coords.forEach((c, i) => { if (i) d.line(coords[i-1].px, coords[i-1].py, c.px, c.py); });
  d.setLineWidth(0.2);

  // puntos
  fill(d, C.gold);
  coords.forEach(c => d.circle(c.px, c.py, 0.9, 'F'));

  // ejes
  draw(d, C.gray); d.setLineWidth(0.3);
  d.line(x, y, x, y + h); d.line(x, y + h, x + w, y + h);
  d.setLineWidth(0.2);

  // etiquetas X
  const step = Math.max(1, Math.floor(pts.length / 10));
  labels.forEach((lbl, i) => {
    if (i % step !== 0 && i !== pts.length - 1) return;
    font(d, 5.5, 'normal', C.gray);
    d.text(lbl, coords[i].px, y + h + 5, { align: 'center' });
  });
}

// ─── Barra apilada horizontal ─────────────────────────────────────────────
function stackedBar(d: jsPDF, x: number, y: number, w: number, h: number, data: { label: string; value: number; color: RGB }[]) {
  const total = data.reduce((s, i) => s + i.value, 0);
  if (!total) return;
  let cx = x;
  data.forEach(item => {
    const sw = (item.value / total) * w;
    rect(d, cx, y, sw, h, item.color);
    cx += sw;
  });
  // leyenda
  let lx = x;
  let ly = y + h + 5;
  data.forEach(item => {
    if (!item.value) return;
    rect(d, lx, ly, 4, 4, item.color);
    font(d, 6, 'normal', C.gray);
    d.text(`${item.label}: ${total > 0 ? (item.value / total * 100).toFixed(1) : 0}%`, lx + 6, ly + 3.3);
    lx += 38;
    if (lx + 36 > x + w) { lx = x; ly += 7; }
  });
}

// ─── APU: calcular totales ────────────────────────────────────────────────
function calcAPU(apu: any) {
  const s = (arr: any[]) => (arr || []).reduce((acc: number, i: any) => acc + (i.cantidad || 0) * (i.valorUnitario || 0), 0);
  const eq = s(apu?.equipos), mat = s(apu?.materiales), mo = s(apu?.manoDeObra);
  const tr = s(apu?.transporte), her = s(apu?.herramientas);
  const sub = eq + mat + mo + tr + her;
  const des = sub * ((apu?.desperdicio || 0) / 100);
  return { eq, mat, mo, tr, her, sub, des, total: sub + des };
}

// ─── FLUJO MENSUAL ────────────────────────────────────────────────────────
function buildFlujo(capitulos: any[], chapterTotals: any[], meses: number[]) {
  let acc = 0;
  return meses.map(mes => {
    let inv = 0;
    capitulos.forEach((cap: any) => {
      const activos = cap.mesesActivos || meses;
      const capTotal = chapterTotals.find((t: any) => t.id === cap.id)?.total || 0;
      if (activos.includes(mes) && activos.length > 0) inv += capTotal / activos.length;
    });
    acc += inv;
    return { mes, inv, acc };
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// GENERADOR PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export const generateProfessionalReport = (state: any, totals: any) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const { caratula, capitulos, actividades, apus, aiu, cronograma, anteproyecto } = state;
  const { totalDirecto, totalAIU, granTotal, costoM2, chapterTotals } = totals;
  const dur   = cronograma?.duracionMeses || 12;
  const meses = Array.from({ length: dur }, (_, i) => i + 1);

  // ── P1: PORTADA ────────────────────────────────────────────────────────
  rect(doc, 0, 0, W, 52, C.forest);
  rect(doc, 0, 52, W, 3, C.gold);

  font(doc, 22, 'bold', C.gold);
  doc.text('KaclHub', ML, 21);
  font(doc, 8, 'normal', [160, 160, 160] as RGB);
  doc.text('Sistema de Presupuestación de Obras · Barranquilla, Colombia', ML, 29);
  doc.text('INFORME TÉCNICO DE PRESUPUESTO DE OBRA', ML, 36);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}`, W - ML, 36, { align: 'right' });
  doc.text(`Corte de precios: ${caratula?.fechaCortePrecios || '—'}`, W - ML, 42, { align: 'right' });

  let y = 66;

  font(doc, 18, 'bold', C.forest);
  const nlines = doc.splitTextToSize(caratula?.nombre || 'Proyecto sin nombre', CW);
  doc.text(nlines, ML, y);
  y += nlines.length * 8 + 3;

  font(doc, 10, 'normal', C.gray);
  doc.text(`${caratula?.uso || ''} · ${caratula?.ciudad || 'Barranquilla'}`, ML, y);
  y += 5;
  hline(doc, ML, y, ML + 55, C.gold, 0.8);
  y += 8;

  // Info 2 columnas
  const info: [string, string][] = [
    ['PROPIETARIO',        caratula?.propietario || '—'],
    ['PROFESIONAL',        `${caratula?.profesional || '—'}${caratula?.matricula ? ` · Mat. ${caratula.matricula}` : ''}`],
    ['DIRECCIÓN',          `${caratula?.direccion || '—'}${caratula?.barrio ? `, ${caratula.barrio}` : ''}`],
    ['CIUDAD',             caratula?.ciudad || 'Barranquilla'],
    ['ÁREA CONSTRUIDA',    caratula?.areaConstruida ? `${caratula.areaConstruida} m²` : '—'],
    ['N° PISOS',           caratula?.numeroPisos ? `${caratula.numeroPisos}` : '—'],
    ['SISTEMA CONSTRUCTIVO', caratula?.sistemaConstructivo || '—'],
    ['NORMATIVA',          caratula?.normativa || '—'],
    ['FECHA ELABORACIÓN',  caratula?.fechaElaboracion || '—'],
    ['CORTE DE PRECIOS',   caratula?.fechaCortePrecios || '—'],
  ];
  const hw = (CW - 5) / 2;
  info.forEach(([lbl, val], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const ix = ML + col * (hw + 5), iy = y + row * 10;
    font(doc, 7, 'bold', C.gray); doc.text(lbl, ix, iy);
    font(doc, 8.5, 'normal', C.forest);
    doc.text(doc.splitTextToSize(String(val), hw)[0], ix, iy + 4.5);
  });
  y += Math.ceil(info.length / 2) * 10 + 5;

  if (caratula?.descripcion) {
    rect(doc, ML, y, 3, 10, C.gold);
    font(doc, 8, 'italic', C.gray);
    doc.text(doc.splitTextToSize(caratula.descripcion, CW - 8).slice(0, 2), ML + 6, y + 4.5);
    y += 14;
  }

  // Banner financiero
  const by = Math.max(y + 4, 212);
  rect(doc, ML, by, CW, 42, C.forest);
  rect(doc, ML, by + 34, CW, 8, C.gold);
  font(doc, 7.5, 'bold', C.gold); doc.text('VALOR TOTAL DEL PRESUPUESTO', ML + 5, by + 7);
  font(doc, 19, 'bold', C.white); doc.text(formatCOP(granTotal), ML + 5, by + 18);

  const kpis = [
    ['COSTOS DIRECTOS', formatCOP(totalDirecto)],
    ['AIU TOTAL',       formatCOP(totalAIU)],
    ['COSTO / m²',      costoM2 > 0 ? formatCOP(costoM2) : '—'],
    ['DURACIÓN',        `${dur} meses`],
  ];
  kpis.forEach((k, i) => {
    const kx = ML + i * (CW / 4) + CW / 8;
    font(doc, 6, 'normal', [155, 155, 155] as RGB); doc.text(k[0], kx, by + 26, { align: 'center' });
    font(doc, 8, 'bold', C.white);                  doc.text(k[1], kx, by + 32, { align: 'center' });
  });
  font(doc, 7.5, 'bold', C.forest);
  doc.text(`${capitulos.length} capítulos · ${actividades.length} actividades · ${apus.length} APU elaborados`, ML + CW / 2, by + 38.5, { align: 'center' });

  // ── P2: ANTEPROYECTO ──────────────────────────────────────────────────
  doc.addPage(); y = ML;
  y = secHead(doc, 'PARTE 1 — ANTEPROYECTO · Estudios y Diseños Previos', 'Referencia — independiente del AIU', y);
  font(doc, 7.5, 'italic', C.gray);
  doc.text('Estudios técnicos y legales previos al inicio de obra. Se presentan como referencia de inversión inicial para el cliente.', ML, y, { maxWidth: CW });
  y += 9;

  const ant = anteproyecto || [];
  const antTotal = ant.reduce((s: number, r: any) => s + (r.valorUnitario || 0) * (r.cantidad || 1), 0);

  if (ant.length === 0) {
    font(doc, 9, 'italic', C.gray); doc.text('Sin estudios previos registrados.', ML, y + 6);
  } else {
    autoTable(doc, {
      startY: y,
      head: [['#', 'Estudio / Servicio', 'Responsable', 'Unidad', 'Cant.', 'Valor Unitario', 'Total']],
      body: ant.map((r: any, i: number) => [
        i + 1, r.item || '—', r.responsable || '—', r.unidad || 'Global',
        r.cantidad || 1, formatCOP(r.valorUnitario || 0),
        formatCOP((r.valorUnitario || 0) * (r.cantidad || 1)),
      ]),
      foot: [['', '', '', '', '', 'TOTAL ESTUDIOS PREVIOS', formatCOP(antTotal)]],
      theme: 'grid',
      headStyles: { fillColor: C.forest, textColor: C.white, fontSize: 8, fontStyle: 'bold' },
      footStyles: { fillColor: C.cream, textColor: C.forest, fontStyle: 'bold', fontSize: 9 },
      columnStyles: { 0: { cellWidth: 8, halign: 'center' }, 4: { cellWidth: 14, halign: 'center' }, 5: { halign: 'right' }, 6: { halign: 'right', fontStyle: 'bold' } },
      styles: { fontSize: 8 },
    });
  }

  // ── P3+: APU POR CAPÍTULO ─────────────────────────────────────────────
  const catDefs = [
    { key: 'equipos',      label: 'EQUIPOS',      color: [52,  52,  60]  as RGB },
    { key: 'materiales',   label: 'MATERIALES',   color: [110, 60,  10]  as RGB },
    { key: 'manoDeObra',   label: 'MANO DE OBRA', color: [20,  60, 120]  as RGB },
    { key: 'transporte',   label: 'TRANSPORTE',   color: [10,  75,  60]  as RGB },
    { key: 'herramientas', label: 'HERRAMIENTAS', color: [70,  20, 100]  as RGB },
  ];

  capitulos.forEach((cap: any) => {
    const capActs = actividades.filter((a: any) => a.capituloId === cap.id);
    if (!capActs.length) return;

    doc.addPage(); y = ML;
    const capTotal = chapterTotals.find((t: any) => t.id === cap.id)?.total || 0;
    y = secHead(doc, `PARTE 2 — CAP. ${cap.numero}: ${(cap.nombre || 'Sin nombre').toUpperCase()}`, formatCOP(capTotal), y);

    capActs.forEach((act: any) => {
      const apu = apus.find((a: any) => a.id === act.apuId);
      const apuT = apu ? calcAPU(apu) : null;
      const vu   = apuT?.total || act.valorManual || 0;
      const tot  = vu * (act.cantidad || 0);

      // salto de página si hace falta
      const lastY = (doc as any).lastAutoTable?.finalY || y;
      if (lastY > H - 70) { doc.addPage(); y = ML; } else { y = lastY + 7; }

      // cabecera de actividad
      rect(doc, ML, y, CW, 9, C.dark);
      font(doc, 8, 'bold', C.white);
      doc.text(`${act.nombre || 'Actividad'} — ${act.cantidad || 0} ${act.unidad || 'un'}`, ML + 3, y + 6);
      font(doc, 8, 'normal', C.gold);
      doc.text(`V.U.: ${formatCOP(vu)}  ·  Total: ${formatCOP(tot)}`, W - ML - 3, y + 6, { align: 'right' });
      y += 11;

      if (!apu || !apuT) {
        font(doc, 7.5, 'italic', C.gray); doc.text('Sin APU detallado.', ML + 3, y + 4); y += 9; return;
      }

      const rows: any[][] = [];
      let hasItems = false;
      catDefs.forEach(({ key, label, color }) => {
        const items = (apu as any)[key] || [];
        if (!items.length) return;
        hasItems = true;
        rows.push([{ content: label, colSpan: 5, styles: { fillColor: color, textColor: C.white, fontStyle: 'bold', fontSize: 7, cellPadding: { top: 2, bottom: 2, left: 4, right: 2 } } }]);
        items.forEach((item: any) => {
          const itot = (item.cantidad || 0) * (item.valorUnitario || 0);
          rows.push([item.descripcion || '—', item.unidad || '—', String(item.cantidad || 0), formatCOP(item.valorUnitario || 0), formatCOP(itot)]);
        });
      });

      if (!hasItems) { font(doc, 7.5, 'italic', C.gray); doc.text('APU sin ítems.', ML + 3, y + 4); y += 9; return; }

      rows.push([{ content: `Factor de desperdicio (${apu.desperdicio || 0}%)`, colSpan: 4, styles: { fillColor: [245, 235, 200] as RGB, fontStyle: 'bold', fontSize: 7.5, textColor: C.forest } }, { content: formatCOP(apuT.des), styles: { fillColor: [245, 235, 200] as RGB, fontStyle: 'bold', halign: 'right', textColor: C.forest, fontSize: 7.5 } }]);
      rows.push([{ content: `VALOR UNITARIO TOTAL / ${act.unidad || 'un'}`, colSpan: 4, styles: { fillColor: C.gold, fontStyle: 'bold', fontSize: 9, textColor: C.forest } }, { content: formatCOP(apuT.total), styles: { fillColor: C.gold, fontStyle: 'bold', halign: 'right', textColor: C.forest, fontSize: 9 } }]);

      autoTable(doc, {
        startY: y,
        head: [['Descripción', 'Unidad', 'Cantidad', 'V. Unitario', 'Total']],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [60, 60, 65] as RGB, textColor: C.white, fontSize: 7, fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 67 }, 1: { cellWidth: 18, halign: 'center' }, 2: { cellWidth: 18, halign: 'right' }, 3: { cellWidth: 29, halign: 'right' }, 4: { cellWidth: 29, halign: 'right', fontStyle: 'bold' } },
        styles: { fontSize: 7.5, cellPadding: 2 },
      });
    });
  });

  // ── COSTOS DIRECTOS + BAR CHART ───────────────────────────────────────
  doc.addPage(); y = ML;
  y = secHead(doc, 'PARTE 3 — COSTOS DIRECTOS POR CAPÍTULO', `Total: ${formatCOP(totalDirecto)}`, y);

  autoTable(doc, {
    startY: y,
    head: [['N°', 'Capítulo', 'Total ($)', '% del CD']],
    body: capitulos.map((cap: any) => {
      const ct = chapterTotals.find((t: any) => t.id === cap.id)?.total || 0;
      return [cap.numero || '—', cap.nombre || '—', formatCOP(ct), `${totalDirecto > 0 ? (ct / totalDirecto * 100).toFixed(1) : 0}%`];
    }),
    foot: [['', 'TOTAL COSTOS DIRECTOS', formatCOP(totalDirecto), '100%']],
    theme: 'striped',
    headStyles: { fillColor: C.forest, textColor: C.white, fontSize: 8, fontStyle: 'bold' },
    footStyles: { fillColor: C.cream, textColor: C.forest, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 12, halign: 'center' }, 2: { halign: 'right', fontStyle: 'bold' }, 3: { halign: 'right' } },
    styles: { fontSize: 8 },
  });

  const afterCD = (doc as any).lastAutoTable.finalY + 8;
  if (afterCD < H - 60 && capitulos.length > 0) {
    font(doc, 8.5, 'bold', C.forest); doc.text('Distribución de Costos Directos por Capítulo', ML, afterCD);
    const bd = capitulos
      .map((cap: any) => ({ label: (cap.nombre || 'Cap').replace(/^\d+[- ]+/, '').slice(0, 11), value: chapterTotals.find((t: any) => t.id === cap.id)?.total || 0, color: C.forest }))
      .filter((d: any) => d.value > 0).slice(0, 10);
    if (bd.length) barChart(doc, ML, afterCD + 4, CW, Math.min(48, H - afterCD - 24), bd);
  }

  // ── AIU + STACKED BAR ────────────────────────────────────────────────
  doc.addPage(); y = ML;
  y = secHead(doc, 'PARTE 4 — COSTOS INDIRECTOS · A.I.U. e IVA', `Base: ${formatCOP(totalDirecto)}`, y);
  font(doc, 7.5, 'italic', C.gray);
  doc.text('El AIU se aplica sobre el Total de Costos Directos. Sustentación obligatoria en contratos públicos (Consejo de Estado, 2013).', ML, y, { maxWidth: CW });
  y += 9;

  const aiuDefs = [
    { key: 'administracion', label: 'Administración (A)', pct: aiu?.administracion,  val: totals.aiu?.administracion, color: C.blue  },
    { key: 'imprevistos',    label: 'Imprevistos (I)',    pct: aiu?.imprevistos,     val: totals.aiu?.imprevistos,    color: C.amber },
    { key: 'utilidad',       label: 'Utilidad (U)',       pct: aiu?.utilidad,        val: totals.aiu?.utilidad,       color: C.green },
    { key: 'iva',            label: 'IVA',                pct: aiu?.iva ?? 19,       val: totals.aiu?.iva,            color: C.red   },
  ];

  const aiuRows: any[][] = [];
  aiuDefs.forEach(cat => {
    aiuRows.push([
      { content: cat.label,           styles: { fillColor: cat.color, textColor: C.white, fontStyle: 'bold', fontSize: 8.5 } },
      { content: `${cat.pct}%`,       styles: { fillColor: cat.color, textColor: C.white, fontStyle: 'bold', halign: 'center', fontSize: 8.5 } },
      { content: cat.key === 'iva' ? 'Sobre Utilidad' : 'Sobre Costo Directo Total', styles: { fillColor: cat.color, textColor: C.white, fontSize: 8 } },
      { content: formatCOP(cat.val),  styles: { fillColor: cat.color, textColor: C.white, fontStyle: 'bold', halign: 'right', fontSize: 8.5 } },
    ]);
    (state.aiuDetalles?.[cat.key] || []).forEach((item: any) => {
      const showPrestaciones = cat.key === 'administracion' && item.prestaciones && item.prestaciones !== 1;
      const calcStr = showPrestaciones
        ? `${item.cantidad || 0} × ${formatCOP(item.valorUnitario || 0)} × ${item.prestaciones}`
        : `${item.cantidad || 0} × ${formatCOP(item.valorUnitario || 0)}`;
      const subtotal = (item.cantidad || 0) * (item.valorUnitario || 0) * (item.prestaciones || 1);
      aiuRows.push([
        `   · ${item.descripcion || '—'}`, item.unidad || '—',
        calcStr,
        { content: formatCOP(subtotal), styles: { halign: 'right' } },
      ]);
    });
  });
  aiuRows.push([
    { content: 'TOTAL COSTOS INDIRECTOS (A.I.U. + IVA)', colSpan: 3, styles: { fillColor: C.cream, fontStyle: 'bold', textColor: C.forest, fontSize: 9 } },
    { content: formatCOP(totalAIU), styles: { fillColor: C.cream, fontStyle: 'bold', halign: 'right', textColor: C.forest, fontSize: 9 } },
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Componente', '%', 'Base de Cálculo', 'Valor ($)']],
    body: aiuRows,
    theme: 'grid',
    headStyles: { fillColor: C.forest, textColor: C.white, fontSize: 8, fontStyle: 'bold' },
    columnStyles: { 1: { halign: 'center', cellWidth: 18 }, 3: { halign: 'right', fontStyle: 'bold' } },
    styles: { fontSize: 8 },
  });

  const afterAIU = (doc as any).lastAutoTable.finalY + 10;
  if (afterAIU < H - 35) {
    font(doc, 8.5, 'bold', C.forest); doc.text('Composición del Presupuesto Total', ML, afterAIU);
    stackedBar(doc, ML, afterAIU + 5, CW, 12, [
      { label: 'Costos Directos', value: totalDirecto,               color: C.forest },
      { label: 'Adm',            value: totals.aiu?.administracion,  color: C.blue   },
      { label: 'Imp',            value: totals.aiu?.imprevistos,     color: C.amber  },
      { label: 'Util',           value: totals.aiu?.utilidad,        color: C.green  },
      { label: 'IVA',            value: totals.aiu?.iva,             color: C.red    },
    ]);
  }

  // ── RESUMEN GENERAL ───────────────────────────────────────────────────
  doc.addPage(); y = ML;
  y = secHead(doc, 'PARTE 5 — RESUMEN GENERAL DEL PRESUPUESTO', `Gran Total: ${formatCOP(granTotal)}`, y);

  autoTable(doc, {
    startY: y,
    head: [['Componente', 'Valor ($)', '% del Total']],
    body: [
      ['Costos Directos (CD)',       formatCOP(totalDirecto),              `${granTotal > 0 ? (totalDirecto / granTotal * 100).toFixed(1) : 0}%`],
      ['  · Administración (A)',     formatCOP(totals.aiu?.administracion),`${granTotal > 0 ? (totals.aiu?.administracion / granTotal * 100).toFixed(1) : 0}%`],
      ['  · Imprevistos (I)',        formatCOP(totals.aiu?.imprevistos),   `${granTotal > 0 ? (totals.aiu?.imprevistos / granTotal * 100).toFixed(1) : 0}%`],
      ['  · Utilidad (U)',           formatCOP(totals.aiu?.utilidad),      `${granTotal > 0 ? (totals.aiu?.utilidad / granTotal * 100).toFixed(1) : 0}%`],
      ['IVA',                        formatCOP(totals.aiu?.iva),           `${granTotal > 0 ? (totals.aiu?.iva / granTotal * 100).toFixed(1) : 0}%`],
      ['Total A.I.U. + IVA',        formatCOP(totalAIU),                  `${granTotal > 0 ? (totalAIU / granTotal * 100).toFixed(1) : 0}%`],
    ],
    foot: [['VALOR TOTAL DEL PRESUPUESTO DE OBRA', formatCOP(granTotal), '100%']],
    theme: 'grid',
    headStyles: { fillColor: C.forest, textColor: C.white, fontSize: 8, fontStyle: 'bold' },
    footStyles: { fillColor: C.gold, textColor: C.forest, fontStyle: 'bold', fontSize: 9 },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' }, 2: { halign: 'right' } },
    styles: { fontSize: 8 },
  });

  let ry = (doc as any).lastAutoTable.finalY + 8;

  // highlight total
  rect(doc, ML, ry, CW, 24, C.forest);
  rect(doc, ML, ry + 16, CW, 8, C.gold);
  font(doc, 7.5, 'bold', C.gold);  doc.text('VALOR TOTAL DEL PRESUPUESTO DE OBRA', ML + 5, ry + 7);
  font(doc, 18, 'bold', C.white);  doc.text(formatCOP(granTotal), ML + 5, ry + 15);
  if (costoM2 > 0) {
    font(doc, 7, 'normal', [180, 180, 180] as RGB);
    doc.text(`Directo/m²: ${formatCOP(totalDirecto / (caratula?.areaConstruida || 1))}   ·   Total/m²: ${formatCOP(costoM2)}`, W - ML - 4, ry + 15, { align: 'right' });
  }
  font(doc, 7.5, 'bold', C.forest);
  doc.text(`${capitulos.length} caps · ${actividades.length} actividades · ${dur} meses · Barranquilla, Colombia`, ML + CW / 2, ry + 21, { align: 'center' });

  ry += 32;

  // bar chart en resumen
  if (ry < H - 65 && capitulos.length > 0) {
    font(doc, 8.5, 'bold', C.forest); doc.text('Distribución por Capítulo', ML, ry);
    const bd = capitulos
      .map((cap: any) => ({ label: (cap.nombre || 'Cap').replace(/^\d+[- ]+/, '').slice(0, 10), value: chapterTotals.find((t: any) => t.id === cap.id)?.total || 0, color: C.forest as RGB }))
      .filter((d: any) => d.value > 0).sort((a: any, b: any) => b.value - a.value).slice(0, 8);
    if (bd.length) barChart(doc, ML, ry + 4, CW, Math.min(48, H - ry - 22), bd);
  }

  // ── CRONOGRAMA + FLUJO + CURVA S ─────────────────────────────────────
  doc.addPage(); y = ML;
  y = secHead(doc, 'PARTE 6 — CRONOGRAMA Y FLUJO DE INVERSIÓN', `Duración: ${dur} meses`, y);

  // Gantt (solo si ≤ 18 meses para que quepa)
  if (dur <= 18) {
    font(doc, 8, 'bold', C.forest); doc.text('Diagrama de Gantt', ML, y); y += 5;
    autoTable(doc, {
      startY: y,
      head: [['N°', 'Capítulo', 'Costo', ...meses.map(m => `M${m}`)]],
      body: capitulos.map((cap: any) => {
        const activos  = cap.mesesActivos || meses;
        const capTotal = chapterTotals.find((t: any) => t.id === cap.id)?.total || 0;
        return [cap.numero || '—', (cap.nombre || '—').slice(0, 22), formatCOP(capTotal), ...meses.map(m => activos.includes(m) ? '' : '')];
      }),
      theme: 'grid',
      headStyles: { fillColor: C.forest, textColor: C.white, fontSize: 6.5, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' }, 1: { cellWidth: 40 }, 2: { cellWidth: 22, halign: 'right' },
        ...Object.fromEntries(meses.map((_, i) => [i + 3, { cellWidth: Math.max(4, (CW - 70) / dur), halign: 'center', fontSize: 6 }])),
      },
      styles: { fontSize: 6.5, cellPadding: 1.5 },
      didDrawCell: (data: any) => {
        if (data.section !== 'body' || data.column.index < 3) return;
        const cap = capitulos[data.row.index];
        if (!cap) return;
        const activos = cap.mesesActivos || meses;
        const mesNum  = data.column.index - 2; // M1=col3→mesNum=1
        if (activos.includes(mesNum)) {
          const { x, y: cy, width, height } = data.cell;
          fill(doc, C.gold); doc.rect(x + 0.5, cy + 0.5, width - 1, height - 1, 'F');
        }
      },
    });
  } else {
    font(doc, 8, 'italic', C.gray); doc.text(`Proyecto de ${dur} meses — ver flujo mensual abajo.`, ML, y + 5); y += 10;
  }

  // Tabla flujo mensual
  const flujo  = buildFlujo(capitulos, chapterTotals, meses);
  const ganttY = (doc as any).lastAutoTable?.finalY || y;
  font(doc, 8.5, 'bold', C.forest); doc.text('Flujo de Inversión Mensual', ML, ganttY + 8);

  autoTable(doc, {
    startY: ganttY + 12,
    head: [['Mes', 'Inversión Mensual', 'Inversión Acumulada', '% Avance']],
    body: flujo.map(f => {
      const pct = granTotal > 0 ? (f.acc / granTotal * 100).toFixed(1) : '0.0';
      return [`Mes ${f.mes}`, formatCOP(f.inv), formatCOP(f.acc), `${pct}%`];
    }),
    foot: [['TOTAL', '', formatCOP(granTotal), '100%']],
    theme: 'striped',
    headStyles: { fillColor: C.forest, textColor: C.white, fontSize: 8, fontStyle: 'bold' },
    footStyles: { fillColor: C.cream, fontStyle: 'bold' },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right', fontStyle: 'bold' }, 3: { halign: 'right' } },
    styles: { fontSize: 8 },
  });

  // Curva S
  const flujoY = (doc as any).lastAutoTable?.finalY || 220;
  const curvaData = flujo.map(f => f.acc);

  if (flujoY < H - 55) {
    font(doc, 8.5, 'bold', C.forest); doc.text('Curva S — Inversión Acumulada', ML, flujoY + 8);
    lineChart(doc, ML, flujoY + 13, CW, 38, curvaData, meses.map(m => `M${m}`));
  } else {
    doc.addPage(); y = ML;
    y = secHead(doc, 'PARTE 6 (cont.) — CURVA S DE INVERSIÓN ACUMULADA', '', y);
    lineChart(doc, ML, y, CW, 55, curvaData, meses.map(m => `M${m}`));
  }

  // ── NÚMEROS DE PÁGINA ─────────────────────────────────────────────────
  const total = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    font(doc, 7, 'normal', C.gray);
    doc.text(
      `KaclHub · ${caratula?.nombre || 'Proyecto'} · Página ${i} de ${total}`,
      W / 2, H - 7, { align: 'center' }
    );
    hline(doc, ML, H - 11, W - ML, C.light);
  }

  doc.save(`Presupuesto_${(caratula?.nombre || 'Proyecto').replace(/[\s/\\]+/g, '_')}_KaclHub.pdf`);
};
