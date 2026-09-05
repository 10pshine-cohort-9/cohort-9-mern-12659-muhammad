# cohort-9-mern-12659-muhammad
Cohort 9 — MERN (NodeJS+ReactJS) assignment for Muhammad Hassan Raza
# Inkwell — MERN Note-Taking Application

A full-stack note-taking application built with MongoDB, Express.js, React, and Node.js. Users create, edit, search, import, and export rich-text notes, with JWT-based authentication and a two-stage trash system.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Folder Structure](#folder-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Installation and Setup](#installation-and-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Folder-Level Scripts](#folder-level-scripts)
- [Contributing](#contributing)
- [License](#license)
- [Author / Contact](#author--contact)

## Overview

Inkwell is a note-taking application that separates into an Express.js REST API (`backend/`) and a React SPA (`frontend/`). Users register with an email and password, then manage notes that contain a title, rich-text content, and a category. Notes support soft deletion (trash) with restore and permanent delete, JSON bulk import, and HTML export. The API uses short-lived JWT access tokens with rotating refresh tokens stored in HttpOnly cookies.

## Tech Stack

| Layer | Technology | Version |
| --- | --- | --- |
| Frontend | React | ^19.0.0 |
| Frontend | React Router DOM | ^7.2.0 |
| Frontend | Lexical (rich-text editor) | ^0.23.1 |
| Frontend | Axios | ^1.7.9 |
| Frontend (build) | Vite | ^8.2.2 |
| Frontend (linting) | oxlint | ^1.79.0 |
| Backend | Express | ^5.2.1 |
| Backend | Mongoose (MongoDB ODM) | ^8.24.2 |
| Backend | jsonwebtoken | ^9.0.3 |
| Backend | bcrypt | ^6.0.0 |
| Backend | pino / pino-http (logging) | ^10.3.1 / ^11.0.0 |
| Backend (dev) | Nodemon | ^3.1.14 |
| Backend (testing) | Mocha / Chai / Sinon | ^11.8.0 / ^4.5.0 / ^22.1.0 |
| Database | MongoDB | [TODO: verify running instance version] |
| Tooling | SonarQube (static analysis) | [TODO: verify from codebase] |

## Features

- Email/password signup and login with bcrypt password hashing (10 salt rounds).
- JWT authentication: 15-minute access tokens sent as `Authorization: Bearer` headers; 7-day refresh tokens stored in HttpOnly cookies (`secure`, `sameSite: none`).
- Refresh token rotation with a `jti` identifier stored on the user document; the token is persisted hashed.
- Automatic access-token refresh on the client via an Axios response interceptor, with a single in-flight refresh request.
- Create, read, update notes with title, content, and category fields.
- Rich-text note editing using the Lexical editor.
- Two-stage deletion: soft delete to trash (records `trashedAt`), restore from trash, and permanent delete.
- Client-side search across note title and content, plus category filtering.
- Bulk note import from a JSON file (`POST /api/notes/import`).
- Single-note export to a standalone HTML file.
- Protected client routes via a `ProtectedRoute` wrapper and `AuthContext`.
- Per-user data isolation: every note query is scoped by `userId`.
- Request logging with pino-http and centralized error-handling middleware.

## System Architecture

The React SPA runs on Vite (port 5000) and communicates with the Express API (port 3000) over HTTP using Axios, with credentials enabled for refresh cookies. The Express API exposes REST endpoints under `/api/auth` and `/api/notes`, validates JWTs in `authMiddleware`, and persists data to MongoDB through Mongoose models.

```
+-------------------+         HTTP (Axios, JSON)          +------------------+        Mongoose        +-----------+
|  React SPA        | ----------------------------------> |  Express API     | ---------------------> |  MongoDB  |
|  (Vite, :5000)    |  Bearer access token + cookies     |  (Node, :3000)   |                        |           |
|                   | <---------------------------------- |                  | <--------------------- |           |
|  Lexical editor   |         JSON responses             |  JWT auth        |                        |  User     |
|  AuthContext      |                                    |  pino logging    |                        |  Note     |
+-------------------+                                    +------------------+                        +-----------+
```

Token flow: the client holds the access token in memory inside `AuthContext`. On a 401 response, the Axios interceptor calls `POST /api/auth/refresh`, which reads the HttpOnly refresh cookie, rotates it, and returns a new access token. Failed refresh logs the user out and redirects to `/login`.

## Folder Structure

```
cohort-9-mern-12659-muhammad/
├── backend/                  # Express.js REST API
│   ├── src/
│   │   ├── controllers/      # authController, noteController
│   │   ├── middleware/       # authMiddleware (JWT), errorHandler
│   │   ├── models/           # Mongoose models: User, Note
│   │   ├── routes/           # authRoutes, noteRoutes
│   │   ├── utils/            # asyncHandler, logger (pino)
│   │   └── server.js         # App bootstrap, DB connection, env validation
│   ├── tests/                # Mocha tests for controllers and middleware
│   ├── .env.example          # Environment variable template
│   └── package.json
├── frontend/                 # React SPA (Vite)
│   ├── src/
│   │   ├── api/              # Axios client with refresh interceptor, auth/notes API
│   │   ├── components/       # Button, NoteCard, RichTextEditor, Navbar, etc.
│   │   ├── context/          # AuthContext (token state)
│   │   ├── hooks/            # useNotes
│   │   ├── pages/            # Landing, Login, Signup, Dashboard, NoteEditor, Trash, Profile
│   │   └── routes/           # ProtectedRoute
│   ├── dist/                 # Production build output
│   └── package.json
├── .coderabbit.yaml          # Code review configuration
└── README.md
```

## Prerequisites

| Software | Version |
| --- | --- |
| Node.js | v22.22.1+ |
| npm | 10.9.4 |
| MongoDB | MongoDB Atlas connection string |

## Environment Variables

The backend reads variables from `backend/.env` (see `backend/.env.example`). The server exits at startup if any required variable is missing or blank (`validateConfig` in `backend/src/server.js`).

| Variable Name | Description | Required | Example Value |
| --- | --- | --- | --- |
| `PORT` | Port the Express server listens on. Defaults to 3000 if unset. | No | `3000` |
| `MONGODB_URI` | MongoDB connection string. | Yes | `mongodb://localhost:27017/inkwell` |
| `JWT_SECRET` | Signing secret for 15-minute access tokens. | Yes | `[random string]` |
| `JWT_REFRESH_SECRET` | Signing secret for 7-day refresh tokens. | Yes | `[random string]` |

The frontend has no environment variables. The API base URL is hardcoded to `http://localhost:3000` in `frontend/src/api/axios.js`.

## Installation and Setup

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd cohort-9-mern-12659-muhammad
   ```

2. Install backend dependencies:

   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies (from the repository root, in a second terminal):

   ```bash
   cd frontend
   npm install
   ```

4. Configure backend environment variables:

   ```bash
   cd backend
   cp .env.example .env
   ```

   Then set `MONGODB_URI`, `JWT_SECRET`, and `JWT_REFRESH_SECRET` in `.env`.

5. Ensure MongoDB is running (local `mongod` or a reachable Atlas cluster).

## Running the Application

### Development

Backend (port 3000, auto-restart with Nodemon):

```bash
cd backend
npm run dev
```

Frontend (port 5000, Vite dev server):

```bash
cd frontend
npm run dev
```

The API's CORS configuration only accepts requests from `http://localhost:5000` with credentials, so the frontend must run on port 5000.

### Production

Build the frontend:

```bash
cd frontend
npm run build      # outputs static files to frontend/dist
npm run preview    # serves the build locally for verification
```

Run the backend server:

```bash
cd backend
npm start
```

Serving `frontend/dist` requires a static file server or reverse proxy; none is configured in this repository.

| Process | Default Port |
| --- | --- |
| Express API | 3000 |
| Vite dev server / preview | 5000 |

## API Documentation

All responses follow the shape `{ success, data, message }`. Authenticated endpoints require an `Authorization: Bearer <accessToken>` header. The refresh endpoint authenticates via the `refreshToken` HttpOnly cookie.

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | Register a user (name, email, password). Returns an access token and sets the refresh cookie. | No |
| POST | `/api/auth/login` | Authenticate a user. Returns an access token and sets the refresh cookie. | No |
| POST | `/api/auth/refresh` | Rotate the refresh cookie and return a new access token. | Cookie |
| POST | `/api/auth/logout` | Clear the refresh cookie. | Yes |
| GET | `/api/notes` | List the user's notes. Query params: `isTrash` (`true`/`false`), `category`. Sorted by `updatedAt` descending. | Yes |
| POST | `/api/notes` | Create a note (`title`, `content`, `category`; `content` is required). | Yes |
| POST | `/api/notes/import` | Bulk-import notes. Body: a JSON array or `{ "notes": [...] }`. | Yes |
| GET | `/api/notes/:id` | Get a single note. | Yes |
| PUT | `/api/notes/:id` | Update a note's title, content, or category. | Yes |
| DELETE | `/api/notes/:id` | Move a note to trash (soft delete). | Yes |
| PATCH | `/api/notes/:id/restore` | Restore a note from trash. | Yes |
| DELETE | `/api/notes/:id/permanent` | Permanently delete a note. | Yes |

No Swagger or Postman collection is present in the repository.

## Testing

Backend tests (Mocha with Chai assertions and Sinon stubs):

```bash
cd backend
npm test
```

Test files cover `authController`, `noteController`, and `authMiddleware` in `backend/tests/`. The frontend has no test suite; it uses oxlint for static analysis (`npm run lint`).


## Folder-Level Scripts

### Backend (`backend/package.json`)

| Script | Description |
| --- | --- |
| `npm start` | Run the API server with `node src/server.js`. |
| `npm run dev` | Run the API server with Nodemon (auto-restart on file changes). |
| `npm test` | Run the Mocha test suite in `backend/tests/`. |

### Frontend (`frontend/package.json`)

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server on port 5000. |
| `npm run build` | Build the production bundle into `frontend/dist`. |
| `npm run lint` | Run oxlint static analysis on the frontend source. |
| `npm run preview` | Serve the production build locally for verification. |


## Author / Contact

Muhammad Hassan Raza

- GitHub: https://github.com/hassandev03
- LinkedIn: https://www.linkedin.com/in/hassandev03/
