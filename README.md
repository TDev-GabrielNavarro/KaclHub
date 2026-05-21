<div align="center">

<img width="80" height="80" alt="KaclHub Logo" src="public/assets/img/favicon_bg.svg" />

# KaclHub

**Sistema de Presupuestación de Obras · Barranquilla, Colombia**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![License](https://img.shields.io/badge/Licencia-Académica-green?style=flat-square)](./LICENSE)

*Herramienta profesional para estructurar, calcular y presentar presupuestos de construcción bajo normativa colombiana.*

---

[Demo en Vivo](#) · [Reportar Bug](../../issues) · [Solicitar Feature](../../issues)

</div>

---

## ¿Qué es KaclHub?

KaclHub es una aplicación web orientada a arquitectos e ingenieros civiles que necesitan elaborar presupuestos de obra de forma rigurosa, visual y eficiente. Cubre el flujo completo: desde los **estudios previos** del anteproyecto, pasando por el **Análisis de Precios Unitarios (APU)** actividad por actividad, hasta el cálculo del **AIU** (Administración, Imprevistos y Utilidad) y la generación de un **informe PDF profesional** listo para entregar a clientes o interventorías.

El proyecto nació como entrega académica para la asignatura *Costos y Presupuestos* (CUC, Barranquilla), pero fue diseñado con visión de producto profesional desde el primer día.

---

## Características Principales

### Presupuesto
- **Carátula completa** — Datos del proyecto, profesional, normativa (NSR-10 · POT Barranquilla), área construida y uso
- **Anteproyecto** — Gestión de estudios previos (topografía, suelos, diseños, licencias) independientes del presupuesto
- **Capítulos y Actividades** — Estructura jerárquica con los 15 capítulos constructivos estándar, actividades anidadas por capítulo
- **APU por actividad** — Desglose en 5 categorías: Equipos, Materiales, Mano de Obra, Transporte y Herramientas. Factor de desperdicio configurable
- **Costos Directos** — Acumulación automática de `Cantidad × Valor Unitario APU` por capítulo
- **AIU sustentado** — Administración, Imprevistos y Utilidad calculados sobre el total de costos directos. IVA sobre la utilidad. Desglose analítico opcional por rubro

### Importación Inteligente
- **Smart Parser** — Reconocimiento automático de la plantilla oficial con mapeo de columnas por heurísticas
- **Fallback IA (Gemini 2.5 Flash)** — Para cualquier Excel de formato libre: la IA extrae capítulos, actividades, APUs y AIU sin configuración manual
- Soporta `.xlsx`, `.xls` · Confianza medida en porcentaje antes de aplicar

### Visualización y Entrega
- **Cronograma de Gantt** interactivo — Celdas clicables para asignar meses de ejecución por capítulo
- **Curva S** y flujo de inversión mensual — Gráficas Recharts responsivas
- **Exportación PDF profesional** — Portada, APU por capítulo, tablas de costos, AIU sustentado, Gantt, Curva S y flujo mensual en un documento multipágina con jsPDF + autoTable

### UX
- Recálculo automático en cascada (editar un ítem actualiza APU → Capítulo → AIU → Gran Total en tiempo real)
- Persistencia automática en `localStorage`
- Animaciones con Framer Motion
- Diseño tipográfico profesional (Playfair Display + Inter)
- Paleta coherente: negro carbón, dorado primario, blanco hueso

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Framework UI | React 18 + TypeScript |
| Bundler | Vite 6 |
| Estilos | Tailwind CSS v4 |
| Estado global | Context API + `useMemo` para totales |
| Gráficas | Recharts |
| Animaciones | Framer Motion (`motion/react`) |
| PDF | jsPDF + jspdf-autotable |
| Excel | SheetJS (xlsx) |
| IA (importación) | Google Gemini 2.5 Flash (`@google/genai`) |
| Iconos | Lucide React |
| Persistencia | localStorage |

---

## Estructura del Proyecto

```
kaclhub/
├── public/
│   └── assets/
│       ├── img/            # Favicon y recursos estáticos
│       └── excel/          # Archivo de ejemplo para importación
├── src/
│   ├── components/
│   │   └── layout/
│   │       ├── Header.tsx          # Navegación global y acciones
│   │       └── ImportModal.tsx     # Modal de importación con Smart Parser + IA
│   ├── context/
│   │   └── PresupuestoContext.tsx  # Estado global, totales derivados, acciones
│   ├── tabs/
│   │   ├── CaratulaTab.tsx         # Datos generales del proyecto
│   │   ├── PresupuestoTab.tsx      # Anteproyecto, Capítulos, APU, Directos, AIU
│   │   ├── CronogramaTab.tsx       # Gantt interactivo + flujo mensual
│   │   └── ResumenTab.tsx          # KPIs, gráficas y exportación PDF
│   ├── utils/
│   │   ├── calculations.ts         # Helpers de cálculo (AIU, costo/m², etc.)
│   │   ├── excelTemplate.ts        # Generador y parser Smart de plantilla Excel
│   │   ├── geminiParser.ts         # Parser por IA con Gemini 2.5 Flash
│   │   ├── pdfGenerator.ts         # Generador de informe PDF multipágina
│   │   └── utils.ts                # cn(), formatCOP()
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                   # Tokens de diseño (@theme Tailwind v4)
├── index.html
├── package.json
└── vite.config.ts
```

---

## Primeros Pasos

### Prerrequisitos

- Node.js 18+
- npm 9+ o pnpm

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/kaclhub.git
cd kaclhub

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local y añadir tu clave de Gemini:
# GEMINI_API_KEY=tu_clave_aqui

# 4. Iniciar en desarrollo
npm run dev
```

La app estará disponible en `http://localhost:5173`.

### Build de producción

```bash
npm run build
npm run preview
```

---

## Flujo de Uso

```
Carátula → Presupuesto → Cronograma → Resumen & Entrega PDF
              │
              ├── 01 Anteproyecto     (estudios previos)
              ├── 02 Capítulos        (estructura jerárquica)
              ├── 03 APU              (desglose por actividad)
              ├── 04 Costos Directos  (acumulado automático)
              └── 05 AIU              (indirectos + IVA)
```

1. **Carátula** — Llenar datos del proyecto y el profesional responsable
2. **Capítulos** — Crear capítulos y agregar actividades (cada actividad genera su APU automáticamente)
3. **APU** — Desglosar materiales, mano de obra, equipos, transporte y herramientas para cada actividad
4. **AIU** — Ajustar porcentajes y opcionalmente desglosar el rubro de administración ítem por ítem
5. **Cronograma** — Hacer clic en las celdas del Gantt para indicar en qué meses se ejecuta cada capítulo
6. **Resumen** — Exportar el informe PDF profesional

### Importar un presupuesto existente

Hacer clic en **Importar** en el encabezado y subir cualquier archivo `.xlsx`. El sistema intentará primero el parser automático. Si el formato no coincide con la plantilla oficial, activará el análisis por Gemini AI. Al final muestra un resumen con los datos detectados antes de confirmar la importación.

Para máxima compatibilidad, descargar la **plantilla oficial** desde el mismo modal.

---

## Hoja de Ruta

Este repositorio corresponde a la **V1 — Web App Académica**. La versión profesional (V2 SaaS) está planificada con las siguientes fases:

| Versión | Estado | Descripción |
|---|---|---|
| **V1** | ✅ En desarrollo | MVP React + IA para la Semana del Diseño (CUC) |
| **V2 Base** | 🔜 Planificado | Multi-proyecto, auth con Supabase, persistencia cloud |
| **V2 Pro** | 🔜 Planificado | Plantillas, versionado, comparativa de presupuestos |
| **V2 Avanzado** | 🔜 Planificado | Colaboración, análisis de sensibilidad, Gantt avanzado |

---

## Contribuir

Este proyecto es actualmente de desarrollo personal y académico. Si encuentras un bug o tienes una sugerencia, abre un [Issue](../../issues).

---

## Licencia

Distribuido bajo licencia académica. Ver `LICENSE` para más información.

---

<div align="center">

Hecho con dedicación en Barranquilla, Colombia 🇨🇴

**KaclHub · 2026**

</div>
