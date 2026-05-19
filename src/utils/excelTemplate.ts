import * as XLSX from 'xlsx';
import type { PresupuestoState, Capitulo, Activity, APUActivity, APUSubItem, AnteproyectoItem, AIUDetailItem } from '../context/PresupuestoContext';

// Helper to sanitize strings for matching
const cleanString = (str: any): string => {
  if (str === null || str === undefined) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .trim()
    .toLowerCase();
};

/**
 * Generates and downloads an Excel file pre-populated with the current state data
 * or with standard sample rows if the state is empty.
 */
export const generateExcelTemplate = (state: PresupuestoState) => {
  const wb = XLSX.utils.book_new();

  // 1. Carátula Sheet
  const caratulaData = [
    ['CAMPO DE LA CARÁTULA', 'VALOR DEL CAMPO', 'DESCRIPCIÓN / INSTRUCCIONES'],
    ['Nombre del Proyecto', state.caratula.nombre || '', 'Nombre del proyecto de construcción'],
    ['Propietario', state.caratula.propietario || '', 'Propietario del proyecto o cliente'],
    ['Profesional a cargo', state.caratula.profesional || '', 'Arquitecto o Ingeniero a cargo'],
    ['Matrícula Profesional', state.caratula.matricula || '', 'Número de matrícula profesional'],
    ['Ciudad', state.caratula.ciudad || '', 'Ciudad del proyecto'],
    ['Dirección', state.caratula.direccion || '', 'Dirección física de la obra'],
    ['Barrio', state.caratula.barrio || '', 'Barrio o sector de la obra'],
    ['Área Construida (m2)', state.caratula.areaConstruida || 0, 'Área total construida en metros cuadrados'],
    ['Área Lote (m2)', state.caratula.areaLote || 0, 'Área total del terreno en metros cuadrados'],
    ['Número de Pisos', state.caratula.numeroPisos || 1, 'Cantidad de pisos de la edificación'],
    ['Uso de la Edificación', state.caratula.uso || '', 'Ej. Residencial Unifamiliar, Comercial, Multifamiliar'],
    ['Sistema Constructivo', state.caratula.sistemaConstructivo || '', 'Ej. Concreto reforzado + pórticos metálicos'],
    ['Normativa Aplicable', state.caratula.normativa || '', 'Ej. NSR-10 · POT de Barranquilla'],
    ['Descripción del Proyecto', state.caratula.descripcion || '', 'Descripción breve de las características de la obra']
  ];
  const wsCaratula = XLSX.utils.aoa_to_sheet(caratulaData);
  // Auto-adjust column widths roughly
  wsCaratula['!cols'] = [{ wch: 30 }, { wch: 40 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsCaratula, 'Caratula');

  // 2. Anteproyecto Sheet
  const anteproyectoData = [
    ['ESTUDIO / SERVICIO', 'RESPONSABLE', 'UNIDAD', 'CANTIDAD', 'VALOR UNITARIO'],
  ];
  if (state.anteproyecto && state.anteproyecto.length > 0) {
    state.anteproyecto.forEach(item => {
      anteproyectoData.push([item.item, item.responsable, item.unidad, item.cantidad, item.valorUnitario]);
    });
  } else {
    // Standard template placeholders
    anteproyectoData.push(['Estudio de Suelos (Geotecnia)', 'Ing. Geotecnista', 'GL', '1', '1800000']);
    anteproyectoData.push(['Diseño Estructural y Cálculo', 'Ing. Calculista', 'GL', '1', '4000000']);
    anteproyectoData.push(['Levantamiento Topográfico', 'Topógrafo', 'GL', '1', '1200000']);
  }
  const wsAnteproyecto = XLSX.utils.aoa_to_sheet(anteproyectoData);
  wsAnteproyecto['!cols'] = [{ wch: 35 }, { wch: 25 }, { wch: 10 }, { wch: 12 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsAnteproyecto, 'Anteproyecto');

  // 3. Presupuesto Sheet (Capítulos y Actividades)
  const presupuestoData = [
    ['Nº CAPÍTULO', 'NOMBRE CAPÍTULO', 'ACTIVIDAD / ITEM', 'UNIDAD', 'CANTIDAD'],
  ];
  if (state.actividades && state.actividades.length > 0) {
    state.actividades.forEach(act => {
      const cap = state.capitulos.find(c => c.id === act.capituloId);
      presupuestoData.push([
        cap ? cap.numero : '',
        cap ? cap.nombre : '',
        act.nombre,
        act.unidad,
        act.cantidad
      ]);
    });
  } else {
    // Template placeholders
    presupuestoData.push(['01', 'Preliminares', 'Localización, trazado y replanteo', 'm2', '150']);
    presupuestoData.push(['01', 'Preliminares', 'Cerramiento provisional en lámina H=2.0m', 'm', '60']);
    presupuestoData.push(['02', 'Cimentación y Estructura', 'Excavación manual para zapatas', 'm3', '35']);
    presupuestoData.push(['02', 'Cimentación y Estructura', 'Concreto para zapatas de 3000 PSI', 'm3', '15']);
    presupuestoData.push(['02', 'Cimentación y Estructura', 'Acero de refuerzo 60,000 PSI', 'kg', '1200']);
    presupuestoData.push(['03', 'Mampostería y Acabados', 'Muro en bloque de arcilla de 10cm', 'm2', '180']);
  }
  const wsPresupuesto = XLSX.utils.aoa_to_sheet(presupuestoData);
  wsPresupuesto['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 45 }, { wch: 10 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsPresupuesto, 'Presupuesto');

  // 4. APU Sheet
  // Columns: Actividad | Tipo Recurso | Descripción | Unidad | Cantidad | Valor Unitario
  const apuData = [
    ['ACTIVIDAD ASOCIADA', 'TIPO RECURSO', 'DESCRIPCIÓN', 'UNIDAD', 'CANTIDAD', 'VALOR UNITARIO'],
  ];

  let hasAPUs = false;
  if (state.apus && state.apus.length > 0) {
    state.apus.forEach(apu => {
      const act = state.actividades.find(a => a.apuId === apu.id);
      const actName = act ? act.nombre : apu.nombre;
      if (!actName) return;

      const categories: { key: 'equipos' | 'materiales' | 'manoDeObra' | 'transporte' | 'herramientas', label: string }[] = [
        { key: 'equipos', label: 'Equipos' },
        { key: 'materiales', label: 'Materiales' },
        { key: 'manoDeObra', label: 'Mano de Obra' },
        { key: 'transporte', label: 'Transporte' },
        { key: 'herramientas', label: 'Herramientas' }
      ];

      categories.forEach(cat => {
        const items = apu[cat.key] || [];
        if (items.length > 0) hasAPUs = true;
        items.forEach(item => {
          apuData.push([
            actName,
            cat.label,
            item.descripcion,
            item.unidad,
            item.cantidad,
            item.valorUnitario
          ]);
        });
      });
    });
  }

  if (!hasAPUs) {
    // Add placeholders linking to the sample activities in Sheet 3
    apuData.push(['Localización, trazado y replanteo', 'Materiales', 'Madera común para formaletas', 'un', '2', '6500']);
    apuData.push(['Localización, trazado y replanteo', 'Materiales', 'Pintura reflectiva o cal', 'bolsa', '0.5', '12000']);
    apuData.push(['Localización, trazado y replanteo', 'Mano de Obra', 'Oficial de obra', 'día', '0.1', '125000']);
    apuData.push(['Localización, trazado y replanteo', 'Mano de Obra', 'Ayudante de obra', 'día', '0.2', '85000']);
    apuData.push(['Localización, trazado y replanteo', 'Herramientas', 'Herramienta menor (10% MO)', 'gl', '1', '2950']);
    
    apuData.push(['Excavación manual para zapatas', 'Mano de Obra', 'Ayudante de obra (Rendimiento 1.2 m3/día)', 'día', '0.83', '85000']);
    apuData.push(['Excavación manual para zapatas', 'Herramientas', 'Palas, picas y carretillas', 'gl', '1', '3500']);
    
    apuData.push(['Concreto para zapatas de 3000 PSI', 'Materiales', 'Concreto premezclado 3000 PSI', 'm3', '1.05', '450000']);
    apuData.push(['Concreto para zapatas de 3000 PSI', 'Mano de Obra', 'Oficial de construcción', 'día', '0.15', '125000']);
    apuData.push(['Concreto para zapatas de 3000 PSI', 'Mano de Obra', 'Ayudante de construcción', 'día', '0.45', '85000']);
    apuData.push(['Concreto para zapatas de 3000 PSI', 'Equipos', 'Vibrador de concreto a gasolina', 'día', '0.05', '40000']);
  }
  const wsAPU = XLSX.utils.aoa_to_sheet(apuData);
  wsAPU['!cols'] = [{ wch: 35 }, { wch: 15 }, { wch: 35 }, { wch: 10 }, { wch: 12 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsAPU, 'APU');

  // 5. AIU Sheet
  const aiuData = [
    ['CONCEPTO DEL AIU', 'PORCENTAJE (%)', 'DESCRIPCIÓN'],
    ['Administración', state.aiu.administracion, 'Gastos de personal de ingeniería, oficina, etc.'],
    ['Imprevistos', state.aiu.imprevistos, 'Margen para situaciones fuera de planeación'],
    ['Utilidad', state.aiu.utilidad, 'Margen de beneficio esperado del contratista'],
    ['IVA sobre Utilidad', state.aiu.iva, 'Porcentaje de IVA aplicado ÚNICAMENTE sobre el valor de Utilidad (ej. 19%)']
  ];
  const wsAIU = XLSX.utils.aoa_to_sheet(aiuData);
  wsAIU['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsAIU, 'AIU');

  // 6. AIU Detalles Sheet (Optional, if detail items exist)
  const aiuDetailsData = [
    ['CONCEPTO AIU', 'DESCRIPCIÓN DEL ÍTEM', 'UNIDAD', 'CANTIDAD', 'VALOR UNITARIO']
  ];
  let hasAIUDetails = false;
  const categoriesAIU = ['administracion', 'imprevistos', 'utilidad', 'iva'] as const;
  categoriesAIU.forEach(cat => {
    const items = state.aiuDetalles[cat] || [];
    const label = cat === 'administracion' ? 'Administración' : cat === 'imprevistos' ? 'Imprevistos' : cat === 'utilidad' ? 'Utilidad' : 'IVA sobre Utilidad';
    if (items.length > 0) hasAIUDetails = true;
    items.forEach(item => {
      aiuDetailsData.push([label, item.descripcion, item.unidad, item.cantidad, item.valorUnitario]);
    });
  });

  if (hasAIUDetails) {
    const wsAIUDetails = XLSX.utils.aoa_to_sheet(aiuDetailsData);
    wsAIUDetails['!cols'] = [{ wch: 20 }, { wch: 35 }, { wch: 10 }, { wch: 12 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsAIUDetails, 'AIU_Detalles');
  }

  // Save/Download Excel File
  const projectTitle = state.caratula.nombre ? state.caratula.nombre.trim().replace(/[^a-zA-Z0-9]/g, '_') : 'KaclHub';
  XLSX.writeFile(wb, `Plantilla_Presupuesto_${projectTitle}.xlsx`);
};

/**
 * Attempts to parse an uploaded Excel file using smart client-side heuristics.
 * Returns parsed state and a confidence score indicating how well it matched the template.
 */
export const parseExcelFile = (file: File, currentState?: PresupuestoState): Promise<{ data: any; score: number; details: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    
    reader.onload = (e) => {
      try {
        if (!e.target?.result) {
          throw new Error('No se pudo leer el archivo Excel.');
        }

        const data = new Uint8Array(e.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        let score = 0;
        let detailsLog: string[] = [];

        // Identify sheets
        let caratulaSheetName = '';
        let anteproyectoSheetName = '';
        let presupuestoSheetName = '';
        let apuSheetName = '';
        let aiuSheetName = '';
        let aiuDetailsSheetName = '';

        // Count identified sheets
        let identifiedSheetsCount = 0;
        workbook.SheetNames.forEach(name => {
          const clean = cleanString(name);
          if (clean.includes('caratula') || clean.includes('caratula') || clean.includes('datos') || clean.includes('general')) {
            caratulaSheetName = name; identifiedSheetsCount++;
          } else if (clean.includes('anteproyecto') || clean.includes('estudios') || clean.includes('previo')) {
            anteproyectoSheetName = name; identifiedSheetsCount++;
          } else if (clean.includes('presupuesto') || clean.includes('actividad') || clean.includes('capitulo') || clean.includes('item') || clean.includes('directo')) {
            presupuestoSheetName = name; identifiedSheetsCount++;
          } else if (clean.includes('apu') || clean.includes('analisis') || clean.includes('unitario') || clean.includes('insumo')) {
            apuSheetName = name; identifiedSheetsCount++;
          } else if (clean.includes('aiu_detalle') || clean.includes('aiudetalle')) {
            aiuDetailsSheetName = name; identifiedSheetsCount++;
          } else if (clean.includes('aiu')) {
            aiuSheetName = name; identifiedSheetsCount++;
          }
        });
        score += identifiedSheetsCount * 2; // Max 10-12 points for sheet presence

        // Initialize state arrays
        const caratula: any = {};
        const anteproyecto: AnteproyectoItem[] = [];
        const capitulos: Capitulo[] = [];
        const actividades: Activity[] = [];
        const apus: APUActivity[] = [];
        const aiu: any = { administracion: 12, imprevistos: 5, utilidad: 8, iva: 19 };
        const aiuDetalles: any = { administracion: [], imprevistos: [], utilidad: [], iva: [] };

        // 1. CARÁTULA PARSING
        if (caratulaSheetName) {
          detailsLog.push(`✓ Hoja de Carátula identificada: "${caratulaSheetName}"`);
          const sheet = workbook.Sheets[caratulaSheetName];
          const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          
          let caratulaFieldsFound = 0;
          rows.forEach(row => {
            if (!row || row.length < 2) return;
            const keyClean = cleanString(row[0]);
            const val = row[1];

            if (keyClean.includes('nombre del proyecto') || keyClean.includes('proyecto')) {
              caratula.nombre = String(val || ''); caratulaFieldsFound++;
            } else if (keyClean.includes('propietario') || keyClean.includes('cliente')) {
              caratula.propietario = String(val || ''); caratulaFieldsFound++;
            } else if (keyClean.includes('profesional a cargo') || keyClean.includes('profesional') || keyClean.includes('arquitecto') || keyClean.includes('ingeniero')) {
              caratula.profesional = String(val || ''); caratulaFieldsFound++;
            } else if (keyClean.includes('matricula')) {
              caratula.matricula = String(val || ''); caratulaFieldsFound++;
            } else if (keyClean.includes('ciudad')) {
              caratula.ciudad = String(val || ''); caratulaFieldsFound++;
            } else if (keyClean.includes('direccion') || keyClean.includes('dirección')) {
              caratula.direccion = String(val || ''); caratulaFieldsFound++;
            } else if (keyClean.includes('barrio')) {
              caratula.barrio = String(val || ''); caratulaFieldsFound++;
            } else if (keyClean.includes('construida')) {
              caratula.areaConstruida = parseFloat(val) || 0; caratulaFieldsFound++;
            } else if (keyClean.includes('lote')) {
              caratula.areaLote = parseFloat(val) || 0; caratulaFieldsFound++;
            } else if (keyClean.includes('pisos')) {
              caratula.numeroPisos = parseInt(val) || 1; caratulaFieldsFound++;
            } else if (keyClean.includes('uso')) {
              caratula.uso = String(val || ''); caratulaFieldsFound++;
            } else if (keyClean.includes('sistema')) {
              caratula.sistemaConstructivo = String(val || ''); caratulaFieldsFound++;
            } else if (keyClean.includes('norma') || keyClean.includes('normativa')) {
              caratula.normativa = String(val || ''); caratulaFieldsFound++;
            } else if (keyClean.includes('descripcion') || keyClean.includes('descripción')) {
              caratula.descripcion = String(val || ''); caratulaFieldsFound++;
            }
          });
          detailsLog.push(`  - Se mapearon ${caratulaFieldsFound} campos de carátula.`);
          if (caratulaFieldsFound >= 5) score += 15;
          else if (caratulaFieldsFound > 0) score += 5;
        } else {
          detailsLog.push(`✗ No se encontró hoja de Carátula.`);
        }

        // 2. ANTEPROYECTO PARSING
        if (anteproyectoSheetName) {
          detailsLog.push(`✓ Hoja de Anteproyecto identificada: "${anteproyectoSheetName}"`);
          const sheet = workbook.Sheets[anteproyectoSheetName];
          const rows: any[] = XLSX.utils.sheet_to_json(sheet);
          
          let count = 0;
          rows.forEach(row => {
            // Find key column values
            let itemStr = '';
            let respStr = '';
            let unitStr = '';
            let cantNum = 1;
            let valNum = 0;

            Object.entries(row).forEach(([colKey, colVal]: [string, any]) => {
              const cleanKey = cleanString(colKey);
              if (cleanKey.includes('estudio') || cleanKey.includes('servicio') || cleanKey.includes('item') || cleanKey.includes('descripcion')) {
                itemStr = String(colVal || '');
              } else if (cleanKey.includes('responsable') || cleanKey.includes('quien')) {
                respStr = String(colVal || '');
              } else if (cleanKey.includes('unidad') || cleanKey.includes('un')) {
                unitStr = String(colVal || '');
              } else if (cleanKey.includes('cantidad') || cleanKey.includes('cant')) {
                cantNum = parseFloat(colVal) || 0;
              } else if (cleanKey.includes('unitario') || cleanKey.includes('valor') || cleanKey.includes('precio') || cleanKey.includes('costo')) {
                valNum = parseFloat(colVal) || 0;
              }
            });

            if (itemStr) {
              anteproyecto.push({
                id: crypto.randomUUID(),
                item: itemStr,
                responsable: respStr,
                unidad: unitStr,
                cantidad: cantNum,
                valorUnitario: valNum
              });
              count++;
            }
          });
          detailsLog.push(`  - Se importaron ${count} registros de estudios previos/anteproyecto.`);
          if (count > 0) score += 15;
        } else {
          detailsLog.push(`✗ No se encontró hoja de Anteproyecto.`);
        }

        // 3. PRESUPUESTO PARSING (Chapters & Activities)
        let budgetMatchedSuccessfully = false;
        if (presupuestoSheetName) {
          detailsLog.push(`✓ Hoja de Presupuesto identificada: "${presupuestoSheetName}"`);
          const sheet = workbook.Sheets[presupuestoSheetName];
          const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          
          // Let's identify the header row
          let headerIndex = -1;
          let colIndices = { capituloNum: -1, capituloNombre: -1, actividadNombre: -1, unidad: -1, cantidad: -1 };

          for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
            const row = rawRows[r];
            if (!row) continue;
            let matchCount = 0;
            
            row.forEach((cellVal, c) => {
              const clean = cleanString(cellVal);
              if (clean.includes('capitulo') && (clean.includes('n') || clean.includes('num') || clean.includes('code') || clean.includes('cod'))) {
                colIndices.capituloNum = c; matchCount++;
              } else if (clean.includes('nombre') && clean.includes('capitulo')) {
                colIndices.capituloNombre = c; matchCount++;
              } else if (clean.includes('actividad') || clean.includes('item') || clean.includes('descripcion') || clean.includes('detalle')) {
                colIndices.actividadNombre = c; matchCount++;
              } else if (clean.includes('unidad') || clean.includes('un')) {
                colIndices.unidad = c; matchCount++;
              } else if (clean.includes('cantidad') || clean.includes('cant')) {
                colIndices.cantidad = c; matchCount++;
              }
            });

            // If we found at least activity and quantity/unit columns, it's a solid header!
            if (colIndices.actividadNombre !== -1 && (colIndices.cantidad !== -1 || colIndices.unidad !== -1)) {
              headerIndex = r;
              budgetMatchedSuccessfully = true;
              break;
            }
          }

          if (headerIndex !== -1) {
            detailsLog.push(`  - Mapeo de columnas de Presupuesto: Actividad (Col ${colIndices.actividadNombre}), Cantidad (Col ${colIndices.cantidad}), Unidad (Col ${colIndices.unidad})`);
            
            // Loop through data rows
            let currentChapter: Capitulo | null = null;
            let chapterMapByNum = new Map<string, string>(); // maps "01" -> chapter.id

            for (let r = headerIndex + 1; r < rawRows.length; r++) {
              const row = rawRows[r];
              if (!row || row.length === 0) continue;

              const actName = String(row[colIndices.actividadNombre] || '').trim();
              const capNum = String(colIndices.capituloNum !== -1 ? row[colIndices.capituloNum] : '').trim();
              const capName = String(colIndices.capituloNombre !== -1 ? row[colIndices.capituloNombre] : '').trim();
              const unit = String(colIndices.unidad !== -1 ? row[colIndices.unidad] : '').trim();
              const qty = parseFloat(colIndices.cantidad !== -1 ? row[colIndices.cantidad] : '0') || 0;

              // Check if it's a chapter header row
              if (capNum && capName && !actName) {
                // Creates a new chapter
                const capId = crypto.randomUUID();
                const newCap: Capitulo = {
                  id: capId,
                  numero: capNum.padStart(2, '0'),
                  nombre: capName,
                  valManual: 0,
                  mesesActivos: []
                };
                capitulos.push(newCap);
                currentChapter = newCap;
                chapterMapByNum.set(newCap.numero, capId);
                continue;
              }

              // What if it is an activity but has capNum/capName specified on the same row?
              if (capNum && capName && actName) {
                const normCapNum = capNum.padStart(2, '0');
                let capId = chapterMapByNum.get(normCapNum);
                if (!capId) {
                  capId = crypto.randomUUID();
                  const newCap: Capitulo = {
                    id: capId,
                    numero: normCapNum,
                    nombre: capName,
                    valManual: 0,
                    mesesActivos: []
                  };
                  capitulos.push(newCap);
                  currentChapter = newCap;
                  chapterMapByNum.set(normCapNum, capId);
                } else {
                  // Sync current chapter
                  currentChapter = capitulos.find(c => c.id === capId) || null;
                }
              }

              // Create activity
              if (actName) {
                // If there's no chapter defined yet, create a default "01 Preliminares"
                if (!currentChapter) {
                  const capId = crypto.randomUUID();
                  const defaultCap: Capitulo = {
                    id: capId,
                    numero: '01',
                    nombre: 'Trabajos Preliminares',
                    valManual: 0,
                    mesesActivos: []
                  };
                  capitulos.push(defaultCap);
                  currentChapter = defaultCap;
                  chapterMapByNum.set('01', capId);
                }

                const apuId = crypto.randomUUID();
                actividades.push({
                  id: crypto.randomUUID(),
                  capituloId: currentChapter.id,
                  nombre: actName,
                  unidad: unit,
                  cantidad: qty,
                  apuId,
                  valorManual: 0
                });
              }
            }
            detailsLog.push(`  - Se extrajeron ${capitulos.length} Capítulos y ${actividades.length} Actividades.`);
            if (colIndices.capituloNum !== -1) {
              score += 25; // High confidence (includes chapters mapping)
            } else {
              score += 10; // Moderate confidence (matched activities only)
            }
            if (actividades.length > 0) score += 5;
          } else {
            detailsLog.push(`✗ Error: Las columnas del Presupuesto no siguen la estructura estándar (Actividad, Cantidad, Unidad).`);
            budgetMatchedSuccessfully = false;
          }
        } else {
          detailsLog.push(`✗ No se encontró hoja de Presupuesto.`);
        }

        // 4. APU PARSING
        let apuMatchedSuccessfully = false;
        if (apuSheetName && budgetMatchedSuccessfully) {
          detailsLog.push(`✓ Hoja de APUs identificada: "${apuSheetName}"`);
          const sheet = workbook.Sheets[apuSheetName];
          const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          
          let headerIndex = -1;
          let colIndices = { actividad: -1, tipo: -1, descripcion: -1, unidad: -1, cantidad: -1, valorUnitario: -1 };

          for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
            const row = rawRows[r];
            if (!row) continue;
            
            row.forEach((cellVal, c) => {
              const clean = cleanString(cellVal);
              if (clean.includes('actividad')) {
                colIndices.actividad = c;
              } else if (clean.includes('tipo') || clean.includes('categoria')) {
                colIndices.tipo = c;
              } else if (clean.includes('descripcion') || clean.includes('detalle') || clean.includes('insumo')) {
                colIndices.descripcion = c;
              } else if (clean.includes('unidad') || clean.includes('un')) {
                colIndices.unidad = c;
              } else if (clean.includes('cantidad') || clean.includes('cant')) {
                colIndices.cantidad = c;
              } else if (clean.includes('unitario') || clean.includes('valor') || clean.includes('precio') || clean.includes('costo')) {
                colIndices.valorUnitario = c;
              }
            });

            if (colIndices.actividad !== -1 && colIndices.descripcion !== -1 && colIndices.valorUnitario !== -1) {
              headerIndex = r;
              apuMatchedSuccessfully = true;
              break;
            }
          }

          if (headerIndex !== -1 && apuMatchedSuccessfully) {
            detailsLog.push(`  - Mapeo de columnas de APU: Actividad (Col ${colIndices.actividad}), Descripción (Col ${colIndices.descripcion}), Valor Unitario (Col ${colIndices.valorUnitario})`);
            
            // Map to store APU items grouped by activity name
            // ActivityName -> { category -> items[] }
            const apusGrouped = new Map<string, Record<string, APUSubItem[]>>();

            for (let r = headerIndex + 1; r < rawRows.length; r++) {
              const row = rawRows[r];
              if (!row || row.length === 0) continue;

              const actNameKey = cleanString(row[colIndices.actividad]);
              const desc = String(row[colIndices.descripcion] || '').trim();
              const typeStr = cleanString(row[colIndices.tipo]);
              const unit = String(colIndices.unidad !== -1 ? row[colIndices.unidad] : '').trim();
              const qty = parseFloat(colIndices.cantidad !== -1 ? row[colIndices.cantidad] : '1') || 0;
              const valUnit = parseFloat(colIndices.valorUnitario !== -1 ? row[colIndices.valorUnitario] : '0') || 0;

              if (!actNameKey || !desc) continue;

              // Map resource category
              let categoryKey = 'materiales';
              if (typeStr.includes('equipo') || typeStr.includes('maquinaria')) {
                categoryKey = 'equipos';
              } else if (typeStr.includes('mano') || typeStr.includes('obra') || typeStr.includes('personal') || typeStr.includes('mo')) {
                categoryKey = 'manoDeObra';
              } else if (typeStr.includes('transporte') || typeStr.includes('flete')) {
                categoryKey = 'transporte';
              } else if (typeStr.includes('herramienta') || typeStr.includes('herra')) {
                categoryKey = 'herramientas';
              }

              if (!apusGrouped.has(actNameKey)) {
                apusGrouped.set(actNameKey, {
                  equipos: [],
                  materiales: [],
                  manoDeObra: [],
                  transporte: [],
                  herramientas: []
                });
              }

              const group = apusGrouped.get(actNameKey)!;
              group[categoryKey].push({
                id: crypto.randomUUID(),
                descripcion: desc,
                unidad: unit,
                cantidad: qty,
                valorUnitario: valUnit
              });
            }

            // Bind parsed APUs to our activities in state
            let apusCount = 0;
            actividades.forEach(act => {
              const cleanActName = cleanString(act.nombre);
              const groupedData = apusGrouped.get(cleanActName);

              const apuId = act.apuId || crypto.randomUUID();
              act.apuId = apuId;

              if (groupedData) {
                apus.push({
                  id: apuId,
                  nombre: act.nombre,
                  unidad: act.unidad,
                  desperdicio: 5,
                  equipos: groupedData.equipos,
                  materiales: groupedData.materiales,
                  manoDeObra: groupedData.manoDeObra,
                  transporte: groupedData.transporte,
                  herramientas: groupedData.herramientas
                });
                apusCount++;
              } else {
                // Create an empty APU
                apus.push({
                  id: apuId,
                  nombre: act.nombre,
                  unidad: act.unidad,
                  desperdicio: 5,
                  equipos: [],
                  materiales: [],
                  manoDeObra: [],
                  transporte: [],
                  herramientas: []
                });
              }
            });

            detailsLog.push(`  - Se asignaron desgloses de APU a ${apusCount} actividades.`);
            if (apusCount > 0) score += 20;
            else score += 5;
          } else {
            detailsLog.push(`✗ Error: Las columnas del APU no tienen la estructura requerida (Actividad, Descripción, Valor Unitario).`);
          }
        } else {
          detailsLog.push(`✗ No se encontró hoja de APU (o falló importación de Presupuesto). Se generarán APUs vacíos.`);
        }

        // 5. AIU PERCENTAGES PARSING
        if (aiuSheetName) {
          detailsLog.push(`✓ Hoja de porcentajes de AIU identificada: "${aiuSheetName}"`);
          const sheet = workbook.Sheets[aiuSheetName];
          const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          
          let aiuMatchedCount = 0;
          rows.forEach(row => {
            if (!row || row.length < 2) return;
            const conceptClean = cleanString(row[0]);
            // Extract percentage. Excel could return a decimal (e.g. 0.12) or percentage integer (e.g. 12)
            let valNum = parseFloat(row[1]) || 0;
            // Standardize: if user wrote 0.12, convert to 12. If wrote 12, keep 12.
            if (valNum > 0 && valNum < 1) {
              valNum = Math.round(valNum * 100);
            }

            if (conceptClean.includes('administracion') || conceptClean === 'a') {
              aiu.administracion = valNum; aiuMatchedCount++;
            } else if (conceptClean.includes('imprevistos') || conceptClean === 'i') {
              aiu.imprevistos = valNum; aiuMatchedCount++;
            } else if (conceptClean.includes('utilidad') || conceptClean === 'u') {
              aiu.utilidad = valNum; aiuMatchedCount++;
            } else if (conceptClean.includes('iva')) {
              aiu.iva = valNum; aiuMatchedCount++;
            }
          });
          detailsLog.push(`  - Se leyeron ${aiuMatchedCount} porcentajes del AIU.`);
          if (aiuMatchedCount >= 3) score += 15;
          else if (aiuMatchedCount > 0) score += 5;
        } else {
          detailsLog.push(`✗ No se encontró hoja de AIU. Usando valores predeterminados (12%, 5%, 8%, 19%).`);
        }

        // 6. AIU DETALLES PARSING
        if (aiuDetailsSheetName) {
          detailsLog.push(`✓ Hoja de detalles de AIU identificada: "${aiuDetailsSheetName}"`);
          const sheet = workbook.Sheets[aiuDetailsSheetName];
          const rows: any[] = XLSX.utils.sheet_to_json(sheet);
          
          let detailCount = 0;
          rows.forEach(row => {
            let catLabel = '';
            let desc = '';
            let unit = '';
            let qty = 1;
            let valUnit = 0;

            Object.entries(row).forEach(([colKey, colVal]: [string, any]) => {
              const cleanKey = cleanString(colKey);
              if (cleanKey.includes('concepto') || cleanKey.includes('tipo') || cleanKey.includes('cat')) {
                catLabel = cleanString(colVal);
              } else if (cleanKey.includes('descripcion') || cleanKey.includes('item') || cleanKey.includes('detalle')) {
                desc = String(colVal || '').trim();
              } else if (cleanKey.includes('unidad') || cleanKey.includes('un')) {
                unit = String(colVal || '').trim();
              } else if (cleanKey.includes('cantidad') || cleanKey.includes('cant')) {
                qty = parseFloat(colVal) || 0;
              } else if (cleanKey.includes('unitario') || cleanKey.includes('valor') || cleanKey.includes('precio') || cleanKey.includes('costo')) {
                valUnit = parseFloat(colVal) || 0;
              }
            });

            if (desc && catLabel) {
              let targetCategory = '';
              if (catLabel.includes('admin') || catLabel.includes('personal') || catLabel === 'a') {
                targetCategory = 'administracion';
              } else if (catLabel.includes('imp') || catLabel === 'i') {
                targetCategory = 'imprevistos';
              } else if (catLabel.includes('util') || catLabel === 'u') {
                targetCategory = 'utilidad';
              } else if (catLabel.includes('iva')) {
                targetCategory = 'iva';
              }

              if (targetCategory && aiuDetalles[targetCategory]) {
                aiuDetalles[targetCategory].push({
                  id: crypto.randomUUID(),
                  descripcion: desc,
                  unidad: unit,
                  cantidad: qty,
                  valorUnitario: valUnit
                });
                detailCount++;
              }
            }
          });
          detailsLog.push(`  - Se importaron ${detailCount} ítems sustentados de AIU.`);
        }

        const parsedResult = {
          meta: {
            savedAt: new Date().toISOString(),
            version: '1.0.0'
          },
          caratula: {
            nombre: caratula.nombre || '',
            propietario: caratula.propietario || '',
            profesional: caratula.profesional || '',
            matricula: caratula.matricula || '',
            ciudad: caratula.ciudad || 'Barranquilla',
            direccion: caratula.direccion || '',
            barrio: caratula.barrio || '',
            fechaElaboracion: caratula.fechaElaboracion || new Date().toISOString().split('T')[0],
            fechaCortePrecios: caratula.fechaCortePrecios || new Date().toISOString().split('T')[0],
            areaConstruida: caratula.areaConstruida || 0,
            areaLote: caratula.areaLote || 0,
            numeroPisos: caratula.numeroPisos || 1,
            uso: caratula.uso || 'Residencial Unifamiliar',
            sistemaConstructivo: caratula.sistemaConstructivo || '',
            normativa: caratula.normativa || 'NSR-10 · POT Barranquilla',
            descripcion: caratula.descripcion || ''
          },
          anteproyecto,
          capitulos,
          actividades,
          apus,
          aiu,
          aiuDetalles,
          cronograma: {
            duracionMeses: currentState?.cronograma?.duracionMeses || 12,
            fechaInicio: currentState?.cronograma?.fechaInicio || new Date().toISOString().split('T')[0]
          }
        };

        resolve({
          data: parsedResult,
          score: Math.min(score, 100),
          details: detailsLog.join('\n')
        });

      } catch (err: any) {
        reject(new Error(`Error al parsear Excel: ${err.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Fallo la lectura del archivo.'));
    };
  });
};
