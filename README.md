# 🚛 CamiónControl - Sistema de Gestión de Flotas de Transporte

Aplicación Web Full Stack Enterprise para la gestión integral de unidades de transporte, personal de choferes y ayudantes, salidas diarias a ruta, control de gastos financieros, cálculo de planillas con deducción de adelantos, reportes en PDF y sincronización offline con IndexedDB (Dexie.js) y Supabase Cloud.

---

## 🛠️ Stack Tecnológico

- **Frontend:** React 18 + Vite + TypeScript, React Router v6, Zustand (Estado Global), TailwindCSS, Dexie.js (IndexedDB local), jsPDF + jspdf-autotable.
- **Backend:** Node.js + Express (API REST), `@supabase/supabase-js`, Zod.
- **Base de Datos & Auth:** Supabase (PostgreSQL + Supabase Auth con RLS y Realtime).
- **Offline & Sync:** Almacenamiento Dexie con sincronización bidireccional last-write-wins (`updated_at`).

---

## 📁 Estructura del Proyecto

```
camion-control/
├── database/
│   └── supabase_schema.sql         # Script SQL completo para Supabase (Tablas, RLS, Triggers)
├── server/
│   ├── .env.example                # Variables de entorno backend
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── config/                 # Cliente de Supabase
│       ├── middleware/             # Verificación JWT de Supabase Auth
│       ├── controllers/            # Controladores REST (Camiones, Personal, Asignaciones, etc)
│       ├── routes/                 # Rutas de Express
│       └── index.ts                # Servidor Express principal
├── client/
│   ├── .env.example                # Variables de entorno frontend
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── src/
│       ├── db/                     # Esquema IndexedDB con Dexie.js
│       ├── services/               # Supabase Client, API Client, Sync Engine
│       ├── stores/                 # Zustand Stores (Auth, Camiones, Personal, Rutas, etc)
│       ├── components/             # Sidebar, Navbar, StatCards, Badges, Modales, Toasts
│       ├── pages/                  # Dashboard, Camiones, Personal, Asignaciones, Transacciones, Pagos, Reportes
│       ├── types/                  # Definiciones de TypeScript
│       └── App.tsx                 # Enrutador y Guardia de Rutas
└── README.md
```

---

## 🚀 Pasos para Ejecutar el Proyecto

### 1. Configuración de la Base de Datos en Supabase
1. Ingresa a tu panel de [Supabase](https://supabase.com).
2. Ve a la sección **SQL Editor**.
3. Ejecuta el archivo SQL ubicado en `database/supabase_schema.sql`. Este script creará:
   - Extensión `uuid-ossp`
   - Enums para roles, estados de vehículos, categorías de gastos y planillas.
   - Tablas: `camiones`, `personal`, `asignaciones_diarias`, `asignacion_ayudantes`, `transacciones`, `adelantos_sueldo`, `planillas_pago`.
   - Índices de rendimiento y triggers para `updated_at`.
   - Políticas RLS (Row Level Security) para acceso seguro.
   - Publicación en **Supabase Realtime**.

### 2. Configuración del Servidor Backend (`/server`)
1. Entra a la carpeta del servidor:
   ```bash
   cd server
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
4. Completa las variables en `.env`:
   ```env
   PORT=4000
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-o-anon-key
   ```
5. Inicia el servidor backend en modo desarrollo:
   ```bash
   npm run dev
   ```
   *El servidor correrá en `http://localhost:4000`*

### 3. Configuración del Cliente Frontend (`/client`)
1. Entra a la carpeta del cliente en una nueva terminal:
   ```bash
   cd client
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
4. Completa las variables en `.env`:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key
   VITE_API_URL=http://localhost:4000/api
   ```
5. Inicia el servidor de desarrollo de Vite:
   ```bash
   npm run dev
   ```
   *La aplicación estará disponible en `http://localhost:3000`*

---

## 📋 Módulos y Funcionalidades Principales

1. **🚛 Gestión de Camiones (`CamionesPage`)**: Alta, edición y baja de unidades (Placa, Código interno, Modelo, Año), asignación de chofer titular fijo y estado operacional (`disponible`, `en_ruta`, `mantenimiento`, `fuera_servicio`).
2. **👥 Gestión de Personal (`PersonalPage`)**: Registro de empleados clasificados en roles (Choferes y Ayudantes), tarifa de pago diario y estado activo/inactivo.
3. **🗺️ Salidas del Día (`AsignacionesPage` & `HomePage`)**: Asignación diaria de camion, chofer y ayudantes (registrados en plantilla o libres temporales por nombre). Vista en tiempo real vía **Supabase Realtime**.
4. **💸 Control Financiero y Gastos (`TransaccionesPage`)**: Registro de gastos por vehículo o flota general (Combustible, Mantenimiento, Peajes, Viáticos, Mecánica, Repuestos) con filtros avanzados y totalizadores.
5. **💰 Planilla de Pagos y Adelantos (`PagosPage`)**: Cálculo automático semanal:
   - Días trabajados según asignaciones del período.
   - Monto Bruto = Días × Tarifa diaria.
   - Deducción automática de Adelantos de Sueldo.
   - Monto Neto = Bruto − Adelantos.
   - Estado de liquidación (`pendiente` / `pagado`).
6. **📄 Reportes PDF (`ReportesPage`)**: Consolidado financiero por rango de fechas personalizable y exportación a PDF con `jsPDF` + `jspdf-autotable`.
7. **🔄 Offline First Sync (`syncService.ts` & Dexie.js)**: Almacenamiento IndexedDB para operar sin conexión a internet y sincronización bidireccional automática/manual al recuperar red con estrategia last-write-wins (`updated_at`).
