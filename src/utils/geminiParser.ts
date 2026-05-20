import * as XLSX from 'xlsx';
import { GoogleGenAI } from '@google/genai';
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

// Helper to tokenize and clean strings for similarity checking
const tokenizeAndClean = (str: string): string[] => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ') // replace punctuation/symbols with spaces
    .split(/\s+/)
    .filter(word => {
      const stopWords = ['de', 'del', 'y', 'en', 'la', 'el', 'los', 'las', 'con', 'para', 'un', 'una', 'e', 'o', 'u', 'debe', 'ser', 'a'];
      return word.trim().length > 0 && !stopWords.includes(word);
    });
};

// Check if two words are similar (accounting for plurals and prefixes/abbreviations)
const isSimilarWord = (w1: string, w2: string): boolean => {
  if (w1 === w2) return true;
  // Plural matches (simple suffixes)
  if (w1 + 's' === w2 || w2 + 's' === w1 || w1 + 'es' === w2 || w2 + 'es' === w1) return true;
  // Prefix matching for abbreviations (length >= 3)
  if (w1.length >= 3 && w2.length >= 3) {
    if (w1.startsWith(w2) || w2.startsWith(w1)) return true;
  }
  return false;
};

// Calculate word overlap score between two strings
const getWordOverlapScore = (str1: string, str2: string): number => {
  const words1 = tokenizeAndClean(str1);
  const words2 = tokenizeAndClean(str2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  let intersectionSize = 0;
  const matchedInWords2 = new Set<number>();
  
  words1.forEach(w1 => {
    // Find if there is a similar word in words2 that hasn't been matched yet
    for (let i = 0; i < words2.length; i++) {
      if (!matchedInWords2.has(i) && isSimilarWord(w1, words2[i])) {
        intersectionSize++;
        matchedInWords2.add(i);
        break;
      }
    }
  });
  
  const unionSize = words1.length + words2.length - intersectionSize;
  return unionSize > 0 ? intersectionSize / unionSize : 0;
};

/**
 * Serializes all sheet data from a workbook into CSV text formats.
 */
export const serializeWorkbookToCSV = (workbook: XLSX.WorkBook): string => {
  let excelTextContent = '';
  // Skip database reference catalogs to optimize context length and cost
  const skipSheets = ['materiales', 'equipos', 'transporte', 'mano de obra', 'mano_de_obra', 'db', 'database', 'catalogo'];
  workbook.SheetNames.forEach(name => {
    const cleanName = name.toLowerCase().trim();
    if (skipSheets.includes(cleanName)) {
      return;
    }
    const sheet = workbook.Sheets[name];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    if (csv.trim()) {
      excelTextContent += `=== HOJA DE EXCEL: ${name.toUpperCase()} ===\n${csv}\n\n`;
    }
  });
  return excelTextContent;
};

/**
 * Calls Gemini AI to parse unstructured budget Excel data and format it into a raw structured JSON.
 * Post-processes the output to apply valid UUIDs and correct state bindings.
 */
export const parseExcelWithGemini = async (
  workbook: XLSX.WorkBook,
  apiKey: string,
  currentState: PresupuestoState
): Promise<PresupuestoState> => {
  if (!apiKey) {
    throw new Error('Se requiere una clave de API de Gemini para usar la importación por IA.');
  }

  const excelCSVContent = serializeWorkbookToCSV(workbook);

  const systemPrompt = `
Eres un ingeniero civil de presupuestos y experto en estructuración de datos de construcción para Colombia.
Analiza el contenido de un archivo de Excel de presupuesto de obra (proporcionado en formato CSV) y organízalo en un formato JSON estructurado.

Tu objetivo es identificar y extraer:
1. Datos generales del proyecto (Carátula).
2. Estudios y diseños previos (Anteproyecto).
3. Capítulos de obra (ej. Preliminares, Cimentación, Mampostería) y sus Actividades.
4. El desglose de insumos de los Análisis de Precios Unitarios (APU) para cada actividad, agrupados en: Equipos, Materiales, Mano de Obra, Transporte y Herramientas.
5. Porcentajes de AIU (Administración, Imprevistos, Utilidad, IVA).
6. Desgloses de gastos de AIU si existen (ej. personal administrativo, seguros).

A continuación se muestra el esquema JSON EXACTO que debes producir:
{
  "caratula": {
    "nombre": "Nombre del proyecto",
    "propietario": "Nombre del propietario/cliente",
    "profesional": "Profesional a cargo (Arquitecto/Ingeniero)",
    "matricula": "Matrícula profesional",
    "ciudad": "Ciudad del proyecto",
    "direccion": "Dirección física",
    "barrio": "Barrio",
    "areaConstruida": 0, // número
    "areaLote": 0, // número
    "numeroPisos": 1, // número
    "uso": "Uso (ej. Residencial Unifamiliar, Comercial)",
    "sistemaConstructivo": "Sistema constructivo",
    "normativa": "Normativa aplicable (ej. NSR-10)",
    "descripcion": "Descripción del proyecto"
  },
  "anteproyecto": [
    {
      "item": "Nombre del estudio o servicio",
      "responsable": "Responsable del estudio",
      "unidad": "Unidad de medida (ej. GL, un)",
      "cantidad": 1, // número
      "valorUnitario": 1000 // número (costo unitario)
    }
  ],
  "capitulos": [
    {
      "numero": "01", // Código en texto de dos dígitos
      "nombre": "Nombre del capítulo"
    }
  ],
  "actividades": [
    {
      "capituloNumero": "01", // Debe corresponder al "numero" del capítulo
      "nombre": "Nombre de la actividad de obra",
      "unidad": "Unidad de medida (ej. m2, m3, un, kg)",
      "cantidad": 1.0, // número
      "valorManual": 0 // Valor unitario manual si NO hay APU detallado (por defecto 0)
    }
  ],
  "apus": [
    {
      "actividadNombre": "Nombre de la actividad (debe coincidir exactamente con el campo 'nombre' en actividades)",
      "desperdicio": 5, // % de desperdicio promedio (por defecto 5)
      "equipos": [
        { "descripcion": "Descripción insumo", "unidad": "un", "cantidad": 1, "valorUnitario": 100 }
      ],
      "materiales": [
        { "descripcion": "Descripción insumo", "unidad": "un", "cantidad": 1, "valorUnitario": 100 }
      ],
      "manoDeObra": [
        { "descripcion": "Descripción insumo", "unidad": "un", "cantidad": 1, "valorUnitario": 100 }
      ],
      "transporte": [
        { "descripcion": "Descripción insumo", "unidad": "un", "cantidad": 1, "valorUnitario": 100 }
      ],
      "herramientas": [
        { "descripcion": "Descripción insumo", "unidad": "un", "cantidad": 1, "valorUnitario": 100 }
      ]
    }
  ],
  "aiu": {
    "administracion": 12, // Porcentaje de 0 a 100
    "imprevistos": 5, // Porcentaje de 0 a 100
    "utilidad": 8, // Porcentaje de 0 a 100
    "iva": 19 // Porcentaje de IVA sobre la Utilidad (por defecto 19)
  },
  "aiuDetalles": {
    "administracion": [
      { "descripcion": "Ingeniero Residente", "unidad": "mes", "cantidad": 6, "valorUnitario": 3500000, "prestaciones": 1.6 }
    ],
    "imprevistos": [],
    "utilidad": [],
    "iva": []
  }
}

REGLAS DE INFERENCIA CRÍTICAS:
1. IDENTIFICACIÓN DE CAPÍTULOS Y ACTIVIDADES EN "PRESUPUESTO":
   - Las celdas y columnas pueden tener desplazamientos. Si la primera columna está vacía, busca en las siguientes.
   - Los capítulos son filas que tienen un nombre de categoría en la columna de descripción (ej. "OBRAS PRELIMINARES", "DEMOLICION") y suelen no tener valor en las columnas de unidad (UND) ni cantidad (CANTIDAD). Sin embargo, tienen un valor total sumado en la columna de costo/total. Extrae cada capítulo y asígnale un número secuencial ("01", "02", "03", etc.).
   - Las actividades son filas que tienen una unidad (ej. "ML", "M2", "GLB", "UN", "M3", "KG") y una cantidad numérica. Asígnalas al capítulo inmediatamente anterior que hayas identificado.
   - Si una actividad no tiene desglose de APU detallado, pero tiene un precio unitario en la columna de precio/valor unitario, asígnale este costo al campo "valorManual".

2. PARSEO DE APUS VERTICALES (HOJA "APU" U OTRAS HOJAS):
   - La hoja "APU" (o similares) suele listar los Análisis de Precios Unitarios de forma vertical y consecutiva, uno debajo del otro.
   - Cada bloque de APU comienza con la descripción/nombre de la actividad de obra (que coincide o es muy similar al de la hoja "PRESUPUESTO").
   - Debajo del nombre de la actividad, se listan los insumos agrupados en categorías como "EQUIPOS", "MATERIALES", "TRANSPORTE", "MANO DE OBRA", "HERRAMIENTAS".
   - Cada insumo de APU tiene una descripción, unidad de medida, cantidad/rendimiento y un valor unitario.
   - Agrúpalos en las categorías correctas en el JSON (materiales, equipos, manoDeObra, transporte, herramientas).
   - Utiliza las hojas de referencia que contienen catálogos de precios ("MATERIALES", "EQUIPOS", "TRANSPORTE", "MANO DE OBRA") para complementar o validar la descripción y el valor unitario de los insumos si fuese necesario.

3. CONVERSIÓN DE PORCENTAJES DE AIU Y DESGLOSE:
   - En la hoja "AIU", los porcentajes como "ADMINISTRACION", "IMPREVISTOS" o "UTILIDAD" pueden estar representados en formato decimal (ej. 0.1884 significa 18.84%). Multiplícalos por 100 para convertirlos en porcentajes de base 100 (ej. 18.84 en lugar de 0.1884) en el JSON.
   - Extrae también el desglose detallado de los rubros del AIU (ej. personal de administración, mantenimiento de oficina, etc.) en el objeto "aiuDetalles". Para cada ítem, extrae su descripción, unidad, cantidad (si la hoja separa cantidad de personas y meses, multiplica cantidad * meses para obtener la cantidad total del insumo), valor unitario, y el factor de prestaciones sociales si existe (asigna este factor al campo "prestaciones" como multiplicador decimal, ej: si indica 1.6 o 1.62 de factor, guárdalo tal cual; si no existe, guárdalo como 1.0).

4. FORMATO DE SALIDA:
   - Devuelve ÚNICAMENTE un string de JSON válido. No agregues explicaciones adicionales, introducciones ni bloques de formato markdown.
`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: `Aquí está el contenido CSV del Excel del presupuesto:\n\n${excelCSVContent}` }] }
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        temperature: 0.1, // low temperature for precise extraction
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Gemini retornó una respuesta vacía.');
    }

    const aiParsed = JSON.parse(responseText.trim());

    // --- POST-PROCESSING & AUTO-HEALING (Applying UUIDs and mapping references) ---
    
    // 1. Carátula Setup
    const caratula = {
      nombre: aiParsed.caratula?.nombre || '',
      propietario: aiParsed.caratula?.propietario || '',
      profesional: aiParsed.caratula?.profesional || '',
      matricula: aiParsed.caratula?.matricula || '',
      ciudad: aiParsed.caratula?.ciudad || 'Barranquilla',
      direccion: aiParsed.caratula?.direccion || '',
      barrio: aiParsed.caratula?.barrio || '',
      fechaElaboracion: aiParsed.caratula?.fechaElaboracion || new Date().toISOString().split('T')[0],
      fechaCortePrecios: aiParsed.caratula?.fechaCortePrecios || new Date().toISOString().split('T')[0],
      areaConstruida: parseFloat(aiParsed.caratula?.areaConstruida) || 0,
      areaLote: parseFloat(aiParsed.caratula?.areaLote) || 0,
      numeroPisos: parseInt(aiParsed.caratula?.numeroPisos) || 1,
      uso: aiParsed.caratula?.uso || 'Residencial Unifamiliar',
      sistemaConstructivo: aiParsed.caratula?.sistemaConstructivo || '',
      normativa: aiParsed.caratula?.normativa || 'NSR-10 · POT Barranquilla',
      descripcion: aiParsed.caratula?.descripcion || ''
    };

    // 2. Anteproyecto setup
    const anteproyecto: AnteproyectoItem[] = (aiParsed.anteproyecto || []).map((item: any) => ({
      id: crypto.randomUUID(),
      item: item.item || '',
      responsable: item.responsable || '',
      unidad: item.unidad || 'GL',
      cantidad: parseFloat(item.cantidad) || 0,
      valorUnitario: parseFloat(item.valorUnitario) || 0
    }));

    // 3. Capítulos setup
    const capitulosMap = new Map<string, string>(); // maps aiParsed capituloNumber -> generated UUID
    const capitulos: Capitulo[] = (aiParsed.capitulos || []).map((cap: any) => {
      const capId = crypto.randomUUID();
      const capNum = String(cap.numero || '').padStart(2, '0');
      capitulosMap.set(capNum, capId);
      return {
        id: capId,
        numero: capNum,
        nombre: cap.nombre || `Capítulo ${capNum}`,
        valManual: 0,
        mesesActivos: []
      };
    });

    // In case activities reference chapters that were not explicitly created
    const getOrCreateChapterId = (capNum: string): string => {
      const normNum = capNum.padStart(2, '0');
      if (capitulosMap.has(normNum)) {
        return capitulosMap.get(normNum)!;
      }
      const capId = crypto.randomUUID();
      capitulos.push({
        id: capId,
        numero: normNum,
        nombre: `Capítulo ${normNum}`,
        valManual: 0,
        mesesActivos: []
      });
      capitulosMap.set(normNum, capId);
      return capId;
    };

    // 4. Actividades and APUs setup
    const actividades: Activity[] = [];
    const apus: APUActivity[] = [];

    // Group AI-provided APUs by activity name for easier binding
    const apusFromAI = new Map<string, any>();
    if (aiParsed.apus && Array.isArray(aiParsed.apus)) {
      aiParsed.apus.forEach((apu: any) => {
        if (apu.actividadNombre) {
          apusFromAI.set(cleanString(apu.actividadNombre), apu);
        }
      });
    }

    if (aiParsed.actividades && Array.isArray(aiParsed.actividades)) {
      aiParsed.actividades.forEach((act: any) => {
        const capId = getOrCreateChapterId(String(act.capituloNumero || '01'));
        const apuId = crypto.randomUUID();
        const activityName = act.nombre || '';
        
        actividades.push({
          id: crypto.randomUUID(),
          capituloId: capId,
          nombre: activityName,
          unidad: act.unidad || 'un',
          cantidad: parseFloat(act.cantidad) || 0,
          apuId: apuId,
          valorManual: parseFloat(act.valorManual) || 0
        });

        // Find if this activity has APU sub-items from AI using fuzzy/similarity matching
        let aiApu = null;
        let bestScore = 0;
        
        if (aiParsed.apus && Array.isArray(aiParsed.apus)) {
          for (const apu of aiParsed.apus) {
            if (!apu.actividadNombre) continue;
            
            // Try exact clean match first
            if (cleanString(apu.actividadNombre) === cleanString(activityName)) {
              aiApu = apu;
              bestScore = 1.0;
              break;
            }
            
            // Calculate similarity score
            const score = getWordOverlapScore(apu.actividadNombre, activityName);
            if (score > bestScore) {
              bestScore = score;
              aiApu = apu;
            }
          }
        }
        
        // Only bind if we have a match above 0.35 similarity
        if (bestScore < 0.35) {
          aiApu = null;
        }
        
        const mapSubItems = (items: any[]): APUSubItem[] => {
          if (!items || !Array.isArray(items)) return [];
          return items.map(i => ({
            id: crypto.randomUUID(),
            descripcion: i.descripcion || '',
            unidad: i.unidad || 'un',
            cantidad: parseFloat(i.cantidad) || 0,
            valorUnitario: parseFloat(i.valorUnitario) || 0
          }));
        };

        if (aiApu) {
          apus.push({
            id: apuId,
            nombre: activityName,
            unidad: act.unidad || 'un',
            desperdicio: parseFloat(aiApu.desperdicio) || 5,
            equipos: mapSubItems(aiApu.equipos),
            materiales: mapSubItems(aiApu.materiales),
            manoDeObra: mapSubItems(aiApu.manoDeObra),
            transporte: mapSubItems(aiApu.transporte),
            herramientas: mapSubItems(aiApu.herramientas)
          });
        } else {
          // Empty APU
          apus.push({
            id: apuId,
            nombre: activityName,
            unidad: act.unidad || 'un',
            desperdicio: 5,
            equipos: [],
            materiales: [],
            manoDeObra: [],
            transporte: [],
            herramientas: []
          });
        }
      });
    }

    // 5. AIU Percentages and Detail Items
    const aiu = {
      administracion: parseFloat(aiParsed.aiu?.administracion) || 12,
      imprevistos: parseFloat(aiParsed.aiu?.imprevistos) || 5,
      utilidad: parseFloat(aiParsed.aiu?.utilidad) || 8,
      iva: parseFloat(aiParsed.aiu?.iva) || 19
    };

    const aiuDetalles: {
      administracion: AIUDetailItem[];
      imprevistos: AIUDetailItem[];
      utilidad: AIUDetailItem[];
      iva: AIUDetailItem[];
    } = {
      administracion: [],
      imprevistos: [],
      utilidad: [],
      iva: []
    };

    const mapAIUDetails = (items: any[]): AIUDetailItem[] => {
      if (!items || !Array.isArray(items)) return [];
      return items.map(i => ({
        id: crypto.randomUUID(),
        descripcion: i.descripcion || '',
        unidad: i.unidad || 'un',
        cantidad: parseFloat(i.cantidad) || 0,
        valorUnitario: parseFloat(i.valorUnitario) || 0,
        prestaciones: i.prestaciones !== undefined ? (parseFloat(i.prestaciones) || 1) : 1
      }));
    };

    if (aiParsed.aiuDetalles) {
      aiuDetalles.administracion = mapAIUDetails(aiParsed.aiuDetalles.administracion);
      aiuDetalles.imprevistos = mapAIUDetails(aiParsed.aiuDetalles.imprevistos);
      aiuDetalles.utilidad = mapAIUDetails(aiParsed.aiuDetalles.utilidad);
      aiuDetalles.iva = mapAIUDetails(aiParsed.aiuDetalles.iva);
    }

    // Sort chapters by number
    capitulos.sort((a, b) => a.numero.localeCompare(b.numero));

    return {
      meta: {
        savedAt: new Date().toISOString(),
        version: '1.0.0'
      },
      caratula,
      anteproyecto,
      capitulos,
      actividades,
      apus,
      aiu,
      aiuDetalles,
      adminDetalle: [], // legacy support
      cronograma: {
        duracionMeses: currentState.cronograma?.duracionMeses || 12,
        fechaInicio: currentState.cronograma?.fechaInicio || new Date().toISOString().split('T')[0]
      }
    };

  } catch (err: any) {
    throw new Error(`Fallo el parseo por Inteligencia Artificial: ${err.message}`);
  }
};
