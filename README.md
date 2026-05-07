# Task Flow — Frontend

Task Flow is a simple task management web application built with React.  
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
- Change task status:
    - TODO
    - IN_PROGRESS
    - DONE
- Filter tasks by status
- Search tasks by title
- Sort tasks by creation date or title
- Task counters by status
- Inline success/error messages
- Demo account shortcut
- Mobile-friendly layout
- Auto-load tasks after page refresh
- Task creation date display

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

Screenshots will be added after the final UI polish.

Planned screenshots:

- Login screen with demo account
- Desktop dashboard
- Mobile dashboard
- Task cards with statuses
- Filters and search

---

## Project Structure

```text
task-manager-frontend
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
https://github.com/iggorr1/demo
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

The frontend currently uses the production backend API:

```js
const API_URL = "https://api.wwwho.lol";
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

The project currently includes:

- Working frontend
- Working backend integration
- Production deployment
- Demo account
- Mobile-friendly layout
- Docker-based deployment
- Custom domain
- Cloudflare Tunnel setup

Planned improvements:

- Better backend error messages
- `/users/me` endpoint
- Task priority
- Due dates
- Better README screenshots
- More polished UI states