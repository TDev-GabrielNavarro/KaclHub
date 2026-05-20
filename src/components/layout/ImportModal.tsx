import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { 
  X, 
  Download, 
  Upload, 
  Brain, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  ChevronRight,
  Database,
  ShieldCheck,
  Info
} from 'lucide-react';
import { usePresupuesto } from '../../context/PresupuestoContext';
import { generateExcelTemplate, parseExcelFile } from '../../utils/excelTemplate';
import { parseExcelWithGemini } from '../../utils/geminiParser';
import { formatCOP } from '../../utils/utils';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose }) => {
  const { state, importState } = usePresupuesto();
  
  // Local states
  const [dragActive, setDragActive] = useState(false);
  const [apiKey, setApiKey] = useState(() => {
    // Attempt to load manual key from localStorage or fallback to environment
    const saved = localStorage.getItem('kaclhub_user_gemini_key');
    if (saved) return saved;
    // process.env.GEMINI_API_KEY is injected at compile time by Vite config
    const envKey = (process.env.GEMINI_API_KEY as string) || '';
    if (envKey === 'MY_GEMINI_API_KEY') return '';
    return envKey;
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<'idle' | 'reading' | 'parsing' | 'ai_fallback' | 'success' | 'error' | 'imported_alert'>('idle');
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<any>(null);
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);
  const [importMethod, setImportMethod] = useState<'smart' | 'ai' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs to bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logMessages]);

  if (!isOpen) return null;

  // Add a message to the logging window
  const addLog = (msg: string) => {
    setLogMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };



  // Main flow coordinator
  const processFile = async (file: File) => {
    setIsProcessing(true);
    setProcessStep('reading');
    setLogMessages([]);
    setErrorMessage('');
    setParsedData(null);
    setConfidenceScore(null);
    
    addLog(`Cargando archivo: "${file.name}" (${(file.size / 1024).toFixed(1)} KB)...`);
    
    try {
      // Step 1: Read workbook in memory first to pass to either parser
      addLog("Analizando celdas con librería interna...");
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
      addLog(`✓ Excel leído. Se detectaron hojas: ${workbook.SheetNames.join(', ')}`);

      // Step 2: Try Smart Parser (Option 1)
      setProcessStep('parsing');
      addLog("Ejecutando Smart Parser para mapeo de columnas...");
      
      const parsed = await parseExcelFile(file, state);
      setConfidenceScore(parsed.score);
      
      // Split and add the parser's log
      parsed.details.split('\n').forEach(line => {
        if (line.trim()) addLog(line);
      });

      addLog(`Cálculo de coincidencia: ${parsed.score}% de estructura reconocida.`);

      if (parsed.score >= 70) {
        addLog("¡Mapeo exitoso! Confianza suficiente para importación directa.");
        setParsedData(parsed.data);
        setImportMethod('smart');
        setProcessStep('success');
      } else {
        // Step 3: Trigger Gemini AI Fallback (Option 2)
        addLog("⚠️ Estructura no coincide con la plantilla oficial.");
        
        if (!apiKey) {
          addLog("✗ Error: Se requiere clave de API para procesar con IA.");
          setErrorMessage("El Excel no sigue el formato oficial y no hay una API Key de Gemini configurada para estructurarlo con Inteligencia Artificial. Descarga la plantilla oficial o proporciona una API Key.");
          setProcessStep('error');
          setIsProcessing(false);
          return;
        }

        setProcessStep('ai_fallback');
        addLog("Iniciando análisis por Inteligencia Artificial (Gemini 2.5)...");
        addLog("Serializando tablas a formato optimizado de texto para IA...");
        
        const aiResult = await parseExcelWithGemini(workbook, apiKey, state);
        
        addLog("✓ Respuesta de IA recibida y parseada correctamente.");
        addLog(`  - Capítulos detectados: ${aiResult.capitulos.length}`);
        addLog(`  - Actividades estructuradas: ${aiResult.actividades.length}`);
        addLog(`  - APUs vinculados: ${aiResult.apus.filter(a => a.equipos.length + a.materiales.length + a.manoDeObra.length > 0).length}`);
        
        setParsedData(aiResult);
        setImportMethod('ai');
        setProcessStep('success');
      }
    } catch (err: any) {
      addLog(`✗ Error durante el proceso: ${err.message}`);
      setErrorMessage(err.message || 'Ocurrió un error inesperado al procesar el archivo.');
      setProcessStep('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const executeImport = () => {
    if (!parsedData) return;
    importState(parsedData);
    setProcessStep('imported_alert');
  };

  // Helper to compute direct cost total in preview
  const getParsedTotalDirecto = (): number => {
    if (!parsedData) return 0;
    
    // Helper to calculate APU total
    const getAPUTotal = (apu: any): number => {
      const eq = apu.equipos?.reduce((s: number, i: any) => s + i.cantidad * i.valorUnitario, 0) || 0;
      const mat = apu.materiales?.reduce((s: number, i: any) => s + i.cantidad * i.valorUnitario, 0) || 0;
      const mob = apu.manoDeObra?.reduce((s: number, i: any) => s + i.cantidad * i.valorUnitario, 0) || 0;
      const trans = apu.transporte?.reduce((s: number, i: any) => s + i.cantidad * i.valorUnitario, 0) || 0;
      const herr = apu.herramientas?.reduce((s: number, i: any) => s + i.cantidad * i.valorUnitario, 0) || 0;
      const subtotal = eq + mat + mob + trans + herr;
      return subtotal + subtotal * ((apu.desperdicio || 0) / 100);
    };

    return parsedData.actividades.reduce((acc: number, act: any) => {
      const apu = parsedData.apus.find((a: any) => a.id === act.apuId);
      const unitCost = apu ? getAPUTotal(apu) : (act.valorManual || 0);
      return acc + unitCost * (act.cantidad || 0);
    }, 0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-forest text-white border border-white/10 rounded-3xl max-w-2xl w-full p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Grain Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        
        {/* Header */}
        <div className="flex items-start justify-between pb-6 border-b border-white/10 relative z-10">
          <div>
            <h3 className="font-serif text-2xl font-bold flex items-center gap-2">
              <Upload className="text-primary" />
              Importar Presupuesto
            </h3>
            <p className="text-xs text-linen/60 mt-1">Carga cualquier archivo Excel de presupuesto. Soporta plantillas oficiales y estructuración inteligente por IA.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-linen/40 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-6 space-y-6 scrollbar-hide relative z-10">
          
          {processStep === 'idle' && (
            <>
              {/* Option 3: Download Template Panel */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 text-primary rounded-xl">
                    <Download size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">¿No tienes un formato?</h4>
                    <p className="text-xs text-linen/50 mt-0.5">Descarga nuestra plantilla Excel oficial para garantizar un parseo instantáneo del 100%.</p>
                  </div>
                </div>
                <button
                  onClick={() => generateExcelTemplate(state)}
                  className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-primary text-forest hover:bg-primary-light transition-all rounded-full text-xs font-bold uppercase tracking-widest"
                >
                  Plantilla
                </button>
              </div>

              {/* API Key Status Panel */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 text-primary rounded-xl">
                    <Brain size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Estructuración Inteligente por IA</h4>
                    <p className="text-xs text-linen/50 mt-0.5">
                      Este módulo utiliza Inteligencia Artificial (Gemini) para analizar, extraer y organizar de forma autónoma cualquier formato de presupuesto que subas.
                    </p>
                  </div>
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-300 ${
                  dragActive 
                    ? "border-primary bg-primary/10 shadow-lg shadow-primary/5" 
                    : "border-white/20 hover:border-primary hover:bg-white/5"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="mx-auto text-linen/40 mb-4 animate-bounce" size={40} />
                <h5 className="font-bold text-sm">Arrastra tu archivo Excel aquí</h5>
                <p className="text-xs text-linen/50 mt-1">o haz clic para explorar en tu equipo</p>
                <div className="mt-6 inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] uppercase tracking-wider text-linen/40 font-bold">
                  <Database size={10} />
                  Soporta .xlsx y .xls
                </div>
              </div>
            </>
          )}

          {/* Processing Log Overlay */}
          {isProcessing && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <RefreshCw className="animate-spin text-primary" size={14} />
                  {processStep === 'reading' && "Leyendo archivo..."}
                  {processStep === 'parsing' && "Ejecutando Smart Parser..."}
                  {processStep === 'ai_fallback' && "Analizando con IA Gemini..."}
                </span>
                <span className="text-[10px] text-linen/40">Esto puede tomar unos segundos</span>
              </div>
              
              {/* Fake progress bar */}
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-primary" 
                  initial={{ width: 0 }}
                  animate={{ 
                    width: 
                      processStep === 'reading' ? '25%' : 
                      processStep === 'parsing' ? '50%' : '85%' 
                  }}
                  transition={{ duration: 1.5 }}
                />
              </div>

              {/* Console Logs */}
              <div className="bg-black/40 border border-white/5 rounded-2xl p-4 font-mono text-[10px] text-linen/70 h-44 overflow-y-auto space-y-1.5">
                {logMessages.map((log, i) => (
                  <div key={i} className="leading-relaxed whitespace-pre-wrap">{log}</div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          )}

          {/* Preview / Success Screen */}
          {processStep === 'success' && parsedData && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                <CheckCircle className="shrink-0" size={24} />
                <div>
                  <h4 className="font-bold text-sm">¡Estructuración Exitosa!</h4>
                  <p className="text-xs text-linen/70 mt-0.5">
                    El presupuesto ha sido procesado mediante el método: <strong>
                      {importMethod === 'smart' ? `Smart Parser (${confidenceScore}% plantilla)` : "Fallback por IA (Gemini)"}
                    </strong>
                  </p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                <h5 className="font-bold text-xs uppercase tracking-widest text-primary">Resumen de Datos Extraídos</h5>
                
                <table className="w-full text-xs text-left">
                  <tbody className="divide-y divide-white/5">
                    <tr>
                      <td className="py-2 text-linen/50">Proyecto</td>
                      <td className="py-2 font-bold text-right truncate max-w-[250px]">{parsedData.caratula.nombre || 'Sin título'}</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-linen/50">Profesional a cargo</td>
                      <td className="py-2 text-right">{parsedData.caratula.profesional || 'No especificado'}</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-linen/50">Área Construida</td>
                      <td className="py-2 text-right">{parsedData.caratula.areaConstruida} m²</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-linen/50 font-bold">Capítulos y Actividades</td>
                      <td className="py-2 text-right font-bold">{parsedData.capitulos.length} Capítulos · {parsedData.actividades.length} Actividades</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-linen/50">Análisis de Precios Unitarios (APU)</td>
                      <td className="py-2 text-right">
                        {parsedData.apus.filter((a: any) => a.equipos.length + a.materiales.length + a.manoDeObra.length > 0).length} desglosados
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 text-linen/50">Porcentajes AIU</td>
                      <td className="py-2 text-right">
                        A: {parsedData.aiu.administracion}% · I: {parsedData.aiu.imprevistos}% · U: {parsedData.aiu.utilidad}% · IVA: {parsedData.aiu.iva}%
                      </td>
                    </tr>
                    <tr className="text-primary font-bold bg-white/5">
                      <td className="py-3 px-3 text-primary">Costo Directo Estimado</td>
                      <td className="py-3 px-3 text-right text-sm">{formatCOP(getParsedTotalDirecto())}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-xs p-4 rounded-xl flex gap-3">
                <AlertCircle className="shrink-0" size={18} />
                <p><strong>Advertencia:</strong> Al importar este presupuesto se sobrescribirán de forma permanente los datos del proyecto actual. Te recomendamos exportar un respaldo primero si lo necesitas.</p>
              </div>
            </motion.div>
          )}

          {/* Imported Success / Review Warning Screen */}
          {processStep === 'imported_alert' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="flex flex-col items-center text-center p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl space-y-4">
                <div className="p-4 bg-emerald-500/20 text-emerald-300 rounded-full animate-bounce">
                  <CheckCircle size={40} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif text-xl font-bold text-emerald-300">¡Presupuesto Importado con Éxito!</h4>
                  <p className="text-xs text-linen/75 leading-relaxed">
                    Los datos han sido incorporados al estado global de la aplicación.
                  </p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2.5 text-primary font-bold text-xs uppercase tracking-widest">
                  <Info size={16} />
                  <span>Recomendaciones Importantes de Revisión</span>
                </div>
                
                <p className="text-xs text-linen/75 leading-relaxed">
                  Aunque la IA de Gemini estructuró el archivo con éxito, los formatos libres de Excel pueden variar ligeramente. Para garantizar la exactitud de tu presupuesto, te recomendamos revisar estos puntos críticos:
                </p>

                <ul className="space-y-3.5 text-xs text-linen/70">
                  <li className="flex items-start gap-3">
                    <span className="shrink-0 flex items-center justify-center w-5 h-5 bg-white/5 border border-white/10 rounded-full font-bold text-[10px] text-primary">1</span>
                    <div>
                      <strong className="text-white block font-semibold mb-0.5">Completa el apartado de Caratula del proyecto</strong>
                      Dirigete a la pestaña "Caratula del proyecto" y completa los campos que esten vacios.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="shrink-0 flex items-center justify-center w-5 h-5 bg-white/5 border border-white/10 rounded-full font-bold text-[10px] text-primary">2</span>
                    <div>
                      <strong className="text-white block font-semibold mb-0.5">Revisar Actividades y Cantidades</strong>
                      Verifica que todas las actividades del Excel estén asignadas a su capítulo correspondiente y que sus cantidades y unidades sean correctas.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="shrink-0 flex items-center justify-center w-5 h-5 bg-white/5 border border-white/10 rounded-full font-bold text-[10px] text-primary">3</span>
                    <div>
                      <strong className="text-white block font-semibold mb-0.5">Validar el Desglose de APUs</strong>
                      Ingresa a la pestaña de **APUs** en el menú principal. Asegúrate de que las actividades tengan vinculados todos sus materiales, herramientas y mano de obra con los rendimientos adecuados.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="shrink-0 flex items-center justify-center w-5 h-5 bg-white/5 border border-white/10 rounded-full font-bold text-[10px] text-primary">4</span>
                    <div>
                      <strong className="text-white block font-semibold mb-0.5">Confirmar Costos Indirectos (AIU)</strong>
                      Valida que los porcentajes de Administración (y sus detalles de personal), Imprevistos, Utilidad e IVA en la pestaña AIU correspondan exactamente a lo que requiere tu proyecto.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="shrink-0 flex items-center justify-center w-5 h-5 bg-white/5 border border-white/10 rounded-full font-bold text-[10px] text-primary">5</span>
                    <div>
                      <strong className="text-white block font-semibold mb-0.5">Genera el cronograma del proyecto entrando a la pestaña de "Cronograma"</strong>
                      y valida que sea correcto.
                    </div>
                  </li>
                </ul>
              </div>
            </motion.div>
          )}

          {/* Error Screen */}
          {processStep === 'error' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-start gap-3 text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
                <AlertCircle className="shrink-0 mt-0.5" size={24} />
                <div className="space-y-2">
                  <h4 className="font-bold text-sm">Error en la Importación</h4>
                  <p className="text-xs text-linen/70 leading-relaxed">{errorMessage}</p>
                </div>
              </div>

              {/* Console Logs showing error context */}
              {logMessages.length > 0 && (
                <div className="bg-black/40 border border-white/5 rounded-2xl p-4 font-mono text-[9px] text-linen/50 h-32 overflow-y-auto">
                  {logMessages.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setProcessStep('idle')}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all"
              >
                <RefreshCw size={14} /> Volver a intentar
              </button>
            </motion.div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-white/10 flex justify-end gap-3 relative z-10 bg-forest">
          {processStep === 'imported_alert' ? (
            <button 
              onClick={onClose}
              className="px-8 py-3 bg-primary text-forest hover:bg-primary-light rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-primary/20 flex items-center gap-2 font-bold"
            >
              Comenzar a Revisar <ChevronRight size={14} />
            </button>
          ) : processStep === 'success' ? (
            <>
              <button 
                onClick={() => setProcessStep('idle')}
                className="px-6 py-3 border border-white/10 hover:bg-white/5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors"
              >
                Cargar otro
              </button>
              <button 
                onClick={executeImport}
                className="px-6 py-3 bg-primary text-forest hover:bg-primary-light rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-primary/20"
              >
                Confirmar e Importar
              </button>
            </>
          ) : (
            <button 
              onClick={onClose}
              disabled={isProcessing}
              className="px-6 py-3 border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:pointer-events-none rounded-full text-xs font-bold uppercase tracking-widest transition-colors"
            >
              Cerrar
            </button>
          )}
        </div>

      </motion.div>
    </div>
  );
};
