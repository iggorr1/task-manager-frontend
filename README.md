# TaskFlow — Frontend

TaskFlow is a simple task management web application built with React.  
It allows users to register, log in, create tasks, update task statuses, search, sort, and manage their personal task list.

Live demo:

```text
https://wwwho.lol
```

---

## Demo Account

You can try the app without creating a new account:

```text
Login: demo
Password: demo123
```

---

## Features

- User registration and login
- JWT-based authentication
- Personal task list for each user
- Create, edit, delete tasks
- Custom delete confirmation modal
- Pin / unpin important tasks
- Pinned tasks are displayed first
- Change task status:
  - TODO
  - IN_PROGRESS
  - DONE
- Filter tasks by status
- Search tasks by title
- Sort tasks by creation date or title
- Persist selected filters and sorting after page refresh
- Task counters by status
- Task creation date display
- Frontend validation for task title and description length
- Clear success/error messages
- Demo account shortcut
- Compact mobile-friendly layout
- Production deployment with custom domain

---

## Tech Stack

### Frontend

- React
- Vite
- Axios
- CSS

### Backend API

- Java
- Spring Boot
- Spring Security
- JWT
- Spring Data JPA
- PostgreSQL

### Deployment

- Docker
- Docker Compose
- Nginx
- Ubuntu Server
- Cloudflare Tunnel
- Custom domain

---

## Screenshots

Screenshots will be added after final visual cleanup.

Planned screenshots:

- Login screen with demo account
- Desktop dashboard
- Mobile dashboard
- Task cards with statuses
- Pinned task state
- Delete confirmation modal
- Filters, search, and sorting

---

## Project Structure

```text
taskflow-frontend
├── public
├── src
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── Dockerfile
├── nginx.conf
├── package.json
└── README.md
```

---

## Backend Repository

This frontend works with a separate backend repository:

```text
https://github.com/iggorr1/task-flow-backend
```

Backend API production URL:

```text
https://api.wwwho.lol
```

---

## Local Development

Install dependencies:

```bash
npm install
```

Run local development server:

```bash
npm run dev -- --host 0.0.0.0
```

Local URL:

```text
http://localhost:5173
```

Network URL example:

```text
http://192.168.0.184:5173
```


The frontend uses `VITE_API_URL` when provided and falls back to the production API:

```js
const API_URL = import.meta.env.VITE_API_URL || "https://api.wwwho.lol";
```

For local backend testing, create `.env.local`:

```env
VITE_API_URL=http://localhost:8080
```

---

## Production Build

Build the project:

```bash
npm run build
```

Preview production build locally:

```bash
npm run preview
```

---

## Docker

The frontend is built with Vite and served by Nginx in production.

Build image:

```bash
docker build -t task-flow-frontend .
```

Run container:

```bash
docker run -p 8081:80 task-flow-frontend
```

---

## Deployment

The production version runs on a home Ubuntu server using Docker Compose.

Production frontend:

```text
https://wwwho.lol
```

Production API:

```text
https://api.wwwho.lol
```

Server deployment flow:

```text
GitHub
↓
git pull on server
↓
Docker Compose rebuild
↓
Cloudflare Tunnel
↓
wwwho.lol
```

Deployment command on server:

```bash
cd ~/apps/task-flow
./deploy.sh
```

---

## Current Status

Implemented:

- Working frontend
- Working backend integration
- Production deployment
- Demo account
- Task CRUD UI
- Task status workflow
- Task pinning
- Search, filtering, and sorting
- Persisted filters and sorting
- Custom delete confirmation modal
- Long text wrapping fixes
- Task input length validation on the frontend
- Compact mobile layout
- Docker-based deployment
- Custom domain
- Cloudflare Tunnel setup

Planned improvements:

- Telegram task reminders
- Better README screenshots
- More polished empty/loading states
- `/users/me` integration after backend support
- Task priority
- Due dates