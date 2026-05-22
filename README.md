# TaskFlow - Frontend

React frontend for **TaskFlow**, a full-stack task manager with JWT login, Google OAuth2 login, task workflow statuses, pinned tasks, filtering, sorting, Telegram connection, and Telegram reminder scheduling.

The frontend is deployed publicly with Docker, Nginx, and Cloudflare Tunnel. It communicates with a Spring Boot backend API.

## Live Demo

```text
https://wwwho.lol
```

Backend API:

```text
https://api.wwwho.lol
```

## Demo Account

```text
Login: demo
Password: demo123
```

Google login is also available when the backend is configured with Google OAuth credentials.

## Tech Stack

- React
- Vite
- Axios
- CSS
- Nginx
- Docker
- Cloudflare Tunnel

Backend API stack:

- Java
- Spring Boot
- Spring Security
- JWT
- Google OAuth2
- Cloudflare Turnstile
- PostgreSQL
- Flyway
- Telegram Bot API

## Features

### Authentication UI

- Register new account
- Login with username/password
- Continue with Google
- Cloudflare Turnstile verification for password auth
- Store JWT token in `localStorage`
- Handle OAuth callback from backend
- Logout
- Demo account shortcut

### Task Dashboard

- Create tasks
- Edit task title and description
- Delete tasks with confirmation modal
- View current user's tasks
- Task status workflow: `TODO`, `IN_PROGRESS`, `DONE`
- Pin/unpin important tasks
- Pinned tasks displayed first
- Task counters by status
- Search by title
- Filter by status
- Sort by creation date or title
- Persist selected filter and sort in `localStorage`

### Task Actions

Task card actions are grouped into a popup menu:

- Pin / Unpin
- Move to TODO
- Move to Progress
- Move to Done
- Set reminder
- Edit
- Delete

### Telegram Integration

- Telegram settings modal
- Check Telegram connection status
- Generate Telegram bot link
- Open Telegram bot link
- Refresh connection status
- Disconnect Telegram

### Reminder UI

- Set reminder date
- Set reminder time
- Send reminder request to backend
- Show current reminder date/time
- Show `Reminder sent` state

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

## Backend Integration

The API base URL is configured through `VITE_API_URL`.

Fallback in the app:

```js
const API_URL = import.meta.env.VITE_API_URL || "https://api.wwwho.lol";
```

Production API:

```text
https://api.wwwho.lol
```

Local backend:

```text
http://localhost:8080
```

## Environment Variables

Local development:

```env
VITE_API_URL=http://localhost:8080
```

Production build:

```env
VITE_API_URL=https://api.wwwho.lol
VITE_TURNSTILE_SITE_KEY=replace-with-turnstile-site-key
```

## Google Login Flow

The frontend starts Google login by redirecting the browser to the backend:

```text
${VITE_API_URL}/oauth2/authorization/google
```

The backend handles Google OAuth2, creates a JWT, and redirects back to the frontend:

```text
/oauth/success?token=<jwt>&login=<login>
```

The frontend then stores the JWT and opens the authenticated task dashboard.

Google Cloud Console must contain the backend redirect URI:

```text
https://api.wwwho.lol/login/oauth2/code/google
```

If Google reports `redirect_uri_mismatch`, open the error details and compare the exact `redirect_uri` with the values configured in Google Console.

## Cloudflare Turnstile

The password login and registration form renders a Cloudflare Turnstile widget when `VITE_TURNSTILE_SITE_KEY` is configured.

Frontend receives a public Turnstile token and sends it to the backend as:

```json
{
  "turnstileToken": "<token>"
}
```

The backend validates the token with Cloudflare before processing login or registration. The secret key stays only on the backend.

Cloudflare Turnstile widget settings:

```text
Widget name: TaskFlow
Hostname:    wwwho.lol
Mode:        Managed
```

Production `.env` value used by the frontend build:

```env
VITE_TURNSTILE_SITE_KEY=your-cloudflare-turnstile-site-key
```

The site key is public. The secret key must not be added to the frontend repository or frontend Docker image.

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

## Build and Lint

Build:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

Lint:

```bash
npm run lint
```

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

## Deployment

Production deployment flow:

```text
GitHub -> Ubuntu Server -> Docker Compose rebuild -> Nginx container -> Cloudflare Tunnel
```

Server deployment command:

```bash
cd ~/apps/task-flow
./deploy.sh
```

If the widget does not appear after deployment, confirm that `VITE_TURNSTILE_SITE_KEY` is available during the frontend Docker build. Vite embeds `VITE_*` variables at build time.

Production frontend:

```text
https://wwwho.lol
```

Production API:

```text
https://api.wwwho.lol
```

## Screenshots To Add

Recommended screenshots for portfolio:

- Login page with Google button
- Main task dashboard
- Task action menu
- Telegram settings modal
- Reminder panel
- Telegram reminder message
- Mobile layout

## Current Status

Implemented:

- JWT login UI
- Google login button and callback handling
- Turnstile captcha widget for password auth
- Registration
- Task CRUD UI
- Status workflow
- Task pinning
- Task action menu
- Search/filter/sort
- Persisted filters and sorting
- Telegram settings UI
- Telegram reminder scheduling UI
- Admin dashboard view
- Docker + Nginx production setup
- Public deployment on custom domain

Possible improvements:

- Add frontend tests
- Add better form-level validation messages
- Add loading skeletons for dashboard sections
- Add screenshots to README
