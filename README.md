# EnRolados 🛡️

EnRolados es un sistema integral de **Gestión de Roles y Turnos** diseñado específicamente para entornos críticos como Centros de Operaciones de Seguridad (SOC). Permite la orquestación eficiente de analistas, control de fatiga y seguimiento de métricas operativas.

[![English README](https://img.shields.io/badge/Language-English-blue.svg)](README-en.md)

## ✨ Características Principales

* **Planificación Automática de Turnos:** Generación automática de cuadrantes mensuales respetando los días laborales, días de *Home Office* y asegurando cobertura 24/7.
* **Prevención de Fatiga:** Lógica incorporada para limitar el exceso de turnos nocturnos y fines de semana por analista, resaltando automáticamente en los reportes a los agentes en riesgo.
* **Gestión de Ausencias:** Seguimiento completo de vacaciones, incapacidades médicas y permisos especiales. El calendario se ajusta automáticamente para evitar asignar turnos a personal ausente.
* **Métricas y Exportación (CSV):** Panel de control (Dashboard) y vistas detalladas de métricas operativas. Exportación de datos a CSV para cruzar información con RRHH.
* **Auditoría Completa:** Registro inmutable de acciones críticas (inicios de sesión, cambios de turnos, modificaciones de usuarios, etc.).
* **Internacionalización (i18n):** Interfaz nativa disponible en Español e Inglés.
* **Gestión de Respaldos (Backups):** Capacidad para descargar y restaurar copias de seguridad de la base de datos completa.

## 🛠️ Stack Tecnológico

* **Frontend & Backend:** Next.js (App Router, React)
* **Base de Datos:** SQLite (ligera, portable, no requiere servidor externo)
* **ORM:** Prisma
* **Estilos:** CSS Modules / Tailwind (Personalizado)
* **Despliegue:** Docker (Standalone Build)

## 🚀 Despliegue Rápido (Docker)

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

## 🧑‍💻 Desarrollo Local

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

## 🔒 Privacidad y "Air-Gapped"
EnRolados está diseñado para poder ejecutarse en entornos cerrados o redes aisladas (*Air-Gapped*). No requiere conexión a internet para funcionar, todos los recursos están empaquetados localmente y SQLite almacena los datos en tu propio disco.
