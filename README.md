# IT3030 PAF 2026 Group 148

Smart Campus Operations Hub restructured into the assignment-compliant layout.

## Structure

- `backend/`: Spring Boot REST API and the currently working static UI.
- `frontend/`: React/Vite workspace scaffolded for the assignment structure.
- `docs/`: Requirements, API, testing, contribution, and AI usage documentation placeholders.
- `.github/workflows/`: Backend and frontend CI pipelines.
- `report/`: Report workspace and root-level PDF placeholder.

## Run

### Backend

```powershell
cd backend
./mvnw.cmd spring-boot:run
```

The backend serves:

- `http://localhost:8080/`
- `http://localhost:8080/home`
- booking API endpoints under `http://localhost:8080/api/bookings`

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

The frontend shell runs on Vite and loads the current backend UI from `http://localhost:8080/`.
