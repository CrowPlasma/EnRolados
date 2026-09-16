# EnRolados 🛡️

*Read this in English below (Desplácese hacia abajo para la versión en inglés).*

---

## 🇪🇸 Español

EnRolados es un sistema integral de **Gestión de Roles y Turnos** diseñado específicamente para entornos críticos como Centros de Operaciones de Seguridad (SOC). Permite la orquestación eficiente de analistas, control de fatiga y seguimiento de métricas operativas.

### ✨ Características Principales

* **Planificación Automática de Turnos:** Generación automática de cuadrantes mensuales respetando los días laborales, días de *Home Office* y asegurando cobertura 24/7.
* **Prevención de Fatiga:** Lógica incorporada para limitar el exceso de turnos nocturnos y fines de semana por analista, resaltando automáticamente en los reportes a los agentes en riesgo.
* **Gestión de Ausencias:** Seguimiento completo de vacaciones, incapacidades médicas y permisos especiales. El calendario se ajusta automáticamente para evitar asignar turnos a personal ausente.
* **Métricas y Exportación (CSV):** Panel de control (Dashboard) y vistas detalladas de métricas operativas. Exportación de datos a CSV para cruzar información con RRHH.
* **Auditoría Completa:** Registro inmutable de acciones críticas (inicios de sesión, cambios de turnos, modificaciones de usuarios, etc.).
* **Internacionalización (i18n):** Interfaz nativa disponible en Español e Inglés.
* **Gestión de Respaldos (Backups):** Capacidad para descargar y restaurar copias de seguridad de la base de datos completa.

<img width="1920" height="911" alt="image" src="https://github.com/user-attachments/assets/2ec202ce-930c-4cbd-9b49-5ffeaeffffee" />
<img width="1920" height="911" alt="image" src="https://github.com/user-attachments/assets/995dc1bc-ef3a-4476-b7c5-2de68c64bd69" />
<img width="1920" height="911" alt="image" src="https://github.com/user-attachments/assets/0e70d01b-0e41-4ebf-9ad6-a943f1f8f800" />
<img width="1920" height="911" alt="image" src="https://github.com/user-attachments/assets/a832d662-5f66-4623-ae10-ef0bac846093" />
<img width="1920" height="911" alt="image" src="https://github.com/user-attachments/assets/d071ac51-5df6-4832-befa-c9354056f61d" />



### 🛠️ Stack Tecnológico

* **Frontend & Backend:** Next.js (App Router, React)
* **Base de Datos:** SQLite (ligera, portable, no requiere servidor externo)
* **ORM:** Prisma
* **Estilos:** CSS Modules / Tailwind (Personalizado)
* **Despliegue:** Docker (Standalone Build)

### 🚀 Despliegue Rápido (Docker)

La forma recomendada de ejecutar EnRolados en producción o en un servidor local aislado es mediante Docker.

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/CrowPlasma/EnRolados.git
   cd EnRolados/enrolados-deploy
   ```

2. **Levanta el contenedor**
   ```bash
   docker compose up -d --build
   ```

3. **Accede a la aplicación**
   - URL: `http://localhost:3050` (o el puerto configurado en tu docker-compose.yml)
   - **Usuario por defecto:** `admin`
   - **Contraseña por defecto:** `admin`

> ⚠️ **IMPORTANTE:** Cambia las credenciales de la cuenta administradora inmediatamente después de tu primer inicio de sesión.

### 🧑‍💻 Desarrollo Local

Si deseas modificar el código o probar características de forma local sin Docker:

1. Instala las dependencias:
   ```bash
   npm install
   ```
2. Genera el cliente de Prisma:
   ```bash
   npx prisma generate
   ```
3. Ejecuta el servidor de desarrollo:
   ```bash
   npm run dev
   ```

### 🔒 Privacidad y "Air-Gapped"
EnRolados está diseñado para poder ejecutarse en entornos cerrados o redes aisladas (*Air-Gapped*). No requiere conexión a internet para funcionar, todos los recursos están empaquetados localmente y SQLite almacena los datos en tu propio disco.

<br><br>
<hr>
<br><br>

## 🇬🇧 English

EnRolados is a comprehensive **Role and Shift Management** system designed specifically for mission-critical environments such as Security Operations Centers (SOC). It enables efficient analyst orchestration, fatigue control, and operational metrics tracking.

### ✨ Key Features

* **Automated Shift Scheduling:** Auto-generate monthly schedules respecting work days, *Home Office* preferences, and ensuring 24/7 continuous coverage.
* **Fatigue Prevention:** Built-in logic to limit excessive night shifts and weekend assignments per analyst, automatically highlighting at-risk agents in reports.
* **Absence Management:** Full tracking of vacations, sick leaves, and special permissions. The calendar automatically adjusts to avoid assigning shifts to absent personnel.
* **Metrics & Export (CSV):** Dashboard and detailed views for operational metrics. Export data to CSV to cross-reference with HR.
* **Complete Audit Trail:** Immutable log of critical actions (logins, shift changes, user modifications, etc.).
* **Internationalization (i18n):** Native interface available in both English and Spanish.
* **Backup Management:** Ability to download and restore full database backups on the fly.

### 🛠️ Tech Stack

* **Frontend & Backend:** Next.js (App Router, React)
* **Database:** SQLite (lightweight, portable, no external server required)
* **ORM:** Prisma
* **Styling:** CSS Modules / Tailwind (Custom)
* **Deployment:** Docker (Standalone Build)

### 🚀 Quick Deployment (Docker)

The recommended way to run EnRolados in production or an isolated local server is via Docker.

1. **Clone the repository**
   ```bash
   git clone https://github.com/CrowPlasma/EnRolados.git
   cd EnRolados/enrolados-deploy
   ```

2. **Spin up the container**
   ```bash
   docker compose up -d --build
   ```

3. **Access the application**
   - URL: `http://localhost:3050` (or the port configured in your docker-compose.yml)
   - **Default Username:** `admin`
   - **Default Password:** `admin`

> ⚠️ **IMPORTANT:** Change the administrator account credentials immediately after your first login.

### 🧑‍💻 Local Development

If you want to modify the code or test features locally without Docker:

1. Install dependencies:
   ```bash
   npm install
   ```
2. Generate the Prisma client:
   ```bash
   npx prisma generate
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

### 🔒 Privacy and Air-Gapped Environments
EnRolados is designed to run in closed environments or Air-Gapped networks. It does not require an internet connection to function; all resources are packaged locally and SQLite stores the data securely on your own disk.
