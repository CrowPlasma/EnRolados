# EnRolados 🛡️

EnRolados is a comprehensive **Role and Shift Management** system designed specifically for mission-critical environments such as Security Operations Centers (SOC). It enables efficient analyst orchestration, fatigue control, and operational metrics tracking.

[![Leer en Español](https://img.shields.io/badge/Idioma-Espa%C3%B1ol-green.svg)](README.md)

## ✨ Key Features

* **Automated Shift Scheduling:** Auto-generate monthly schedules respecting work days, *Home Office* preferences, and ensuring 24/7 continuous coverage.
* **Fatigue Prevention:** Built-in logic to limit excessive night shifts and weekend assignments per analyst, automatically highlighting at-risk agents in reports.
* **Absence Management:** Full tracking of vacations, sick leaves, and special permissions. The calendar automatically adjusts to avoid assigning shifts to absent personnel.
* **Metrics & Export (CSV):** Dashboard and detailed views for operational metrics. Export data to CSV to cross-reference with HR.
* **Complete Audit Trail:** Immutable log of critical actions (logins, shift changes, user modifications, etc.).
* **Internationalization (i18n):** Native interface available in both English and Spanish.
* **Backup Management:** Ability to download and restore full database backups on the fly.

## 🛠️ Tech Stack

* **Frontend & Backend:** Next.js (App Router, React)
* **Database:** SQLite (lightweight, portable, no external server required)
* **ORM:** Prisma
* **Styling:** CSS Modules / Tailwind (Custom)
* **Deployment:** Docker (Standalone Build)

## 🚀 Quick Deployment (Docker)

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

## 🧑‍💻 Local Development

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

## 🔒 Privacy and Air-Gapped Environments
EnRolados is designed to run in closed environments or Air-Gapped networks. It does not require an internet connection to function; all resources are packaged locally and SQLite stores the data securely on your own disk.
