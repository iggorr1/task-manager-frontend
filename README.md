# TaskFlow — Frontend

React frontend for **TaskFlow**, a full-stack task management application with JWT authentication, task workflow statuses, pinned tasks, filtering, sorting, Telegram connection, and Telegram reminder scheduling.

The app is built as a portfolio-ready frontend that works with a Spring Boot backend and is deployed publicly through Docker, Nginx, and Cloudflare Tunnel.

---

## Live Demo

```text
https://wwwho.lol
```

Backend API:

```text
https://api.wwwho.lol
```

---

## Demo Account

```text
Login: demo
Password: demo123
```

---

## Tech Stack

- React
- Vite
- Axios
- CSS
- Nginx
- Docker
- Cloudflare Tunnel

Backend stack used by the API:

- Java
- Spring Boot
- Spring Security
- JWT
- PostgreSQL
- Telegram Bot API

---

## Features

### Auth UI

- Register new account
- Login with JWT
- Continue with Google
- Store token in `localStorage`
- Logout
- Demo account shortcut

### Task Dashboard

- Create tasks
- Edit task title and description
- Delete tasks with confirmation modal
- View current user's tasks
- Task status workflow:
  - `TODO`
  - `IN_PROGRESS`
  - `DONE`
- Pin/unpin important tasks
- Pinned tasks are displayed first
- Task counters by status
- Search by title
- Filter by status
- Sort by creation date or title
- Persist selected filter and sort in `localStorage`

### Task Actions Menu

Task card actions are grouped into a popup menu:

- Pin / Unpin
- Move to TODO
- Move to Progress
- Move to Done
- Set reminder
- Edit
- Delete

### Telegram Integration

- Telegram Settings panel
- Check Telegram connection status
- Generate Telegram bot link
- Open Telegram bot link
- Refresh connection status
- Disconnect Telegram

### Reminder UI

- Set reminder date
- Set reminder time in 24-hour format
- Send reminder request to backend
- Show current reminder date/time
- Show `Reminder sent` state
- Hide reminder panel without deleting the reminder

---

## Project Structure

```text
task-manager-frontend
|-- public
|   |-- favicon.png
|   `-- icons.svg
|-- src
|   |-- api              # Axios API client
|   |-- components       # Reusable UI components
|   |-- constants        # Shared constants
|   |-- pages            # Auth, tasks and admin screens
|   |-- utils            # Formatting helpers
|   |-- App.jsx          # App state and screen composition
|   |-- App.css          # Application styles
|   |-- index.css
|   `-- main.jsx
|-- Dockerfile
|-- nginx.conf
|-- package.json
`-- README.md
```

---

## Backend Integration

The API base URL is configured through `VITE_API_URL`.

Current fallback in the app:

```js
const API_URL = import.meta.env.VITE_API_URL || "https://api.wwwho.lol";
```

Production API:

```text
https://api.wwwho.lol
```

Local backend example:

```text
http://localhost:8080
```

---

## Environment Variables

Create `.env.local` for local development:

```env
VITE_API_URL=http://localhost:8080
```

For production builds, use:

```env
VITE_API_URL=https://api.wwwho.lol
```

Google login starts on the backend at:

```text
${VITE_API_URL}/oauth2/authorization/google
```

After successful Google OAuth2 login, the backend redirects back to:

```text
/oauth/success?token=<jwt>&login=<login>
```

---

## Local Development

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Vite local URL:

```text
http://localhost:5173
```

Run on local network:

```bash
npm run dev -- --host 0.0.0.0
```

---

## Build

```bash
npm run build
```

Preview production build locally:

```bash
npm run preview
```

Lint:

```bash
npm run lint
```

---

## Docker

The production image builds the Vite app and serves static files with Nginx.

Build image:

```bash
docker build -t task-flow-frontend .
```

Run container:

```bash
docker run -p 8081:80 task-flow-frontend
```

Open:

```text
http://localhost:8081
```

---

## Deployment

Production deployment flow:

```text
GitHub
|
git pull on Ubuntu server
|
Docker Compose rebuild
|
Nginx container serves frontend
|
Cloudflare Tunnel exposes wwwho.lol
```

Production frontend:

```text
https://wwwho.lol
```

Production API:

```text
https://api.wwwho.lol
```

Deployment command on server:

```bash
cd ~/apps/task-flow
./deploy.sh
```

---

## Screenshots To Add

Recommended screenshots for the final portfolio README:

- Login page with demo account
- Main task dashboard
- Task action menu
- Telegram Settings modal
- Reminder panel
- Telegram reminder message
- Mobile layout

---

## Current Status

Implemented:

- Auth UI
- JWT login flow
- Task CRUD UI
- Status workflow
- Task pinning
- Task action menu
- Search/filter/sort
- Persisted filters and sorting
- Telegram settings UI
- Telegram reminder scheduling UI
- Docker + Nginx production setup
- Public deployment on custom domain

Planned / possible improvements:

- Add screenshots to README
- Add better loading states and form-level error messages
