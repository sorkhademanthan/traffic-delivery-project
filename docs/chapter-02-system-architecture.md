# SwiftRoute — Chapter 2: System Architecture Design

Purpose: Provide a high-level blueprint of major components and data flows.

## Components

- Admin Dashboard (Next.js)
- Backend API (NodeJs + ExpressJs)
- Database (PostgreSQL + PostGIS)
- Driver Mobile App (React Native)
- External Services (Mapbox APIs)

## Architecture Diagram (Mermaid)

Copy into mermaid.live or render in GitHub to visualize.

```mermaid
flowchart LR
    A[Admin Dashboard\n(Next.js)] -->|Upload CSV / Request Optimization\n(HTTP REST)| B[Backend API\n(NestJS)]
    B -->|Store/Read User, Order, Route Data\n(SQL)| C[(PostgreSQL + PostGIS)]
    B -->|Geocoding / Optimization API Calls\n(HTTPS)| E[Mapbox APIs]

    %% Route dispatch
    B -->|Dispatch Optimized Route\n(REST/WebSockets)| D[Driver Mobile App\n(React Native)]
    D -->|Fetch Assigned Route\n(REST)| B

    %% Real-time tracking
    D -->|Send GPS Location\n(Socket.IO/WebSockets)| B
    B -->|Broadcast GPS Location\n(Socket.IO/WebSockets)| A

    %% Optional: admin read status & data
    A -.->|View Orders/Routes & Status\n(HTTP/WebSockets)| B
```

## Key Data Flows

1) Order Ingestion & Optimization
- Admin uploads CSV from Dashboard → Backend parses.
- Backend calls Mapbox Geocoding for each address → stores orders with coordinates in PostGIS.
- On optimize request, Backend loads pending orders → calls Mapbox Optimization → stores route and ordered route_stops in DB.

2) Route Dispatch
- Backend exposes endpoint or pushes via WebSocket → Driver app fetches assigned route and stop sequence.

3) Real-Time Tracking Loop
- Driver app sends periodic GPS updates via WebSockets → Backend relays/broadcasts to Admin Dashboard and (optionally) persists latest position.
- Admin map animates driver marker and updates stop statuses in near-real time.

## Verification Checklist

- Admin → Backend: “Upload CSV / Request Optimization” arrow is present.
- Backend → Mapbox: “Geocoding / Optimization API Calls” arrow is present.
- Backend ↔ Database: “Store/Read User, Order, Route Data” arrow is present.
- Driver → Backend: “Fetch Route / Send GPS Location (WebSockets)” arrows are present.
- Backend → Admin: “Broadcast GPS Location (WebSockets)” arrow is present.

## Tooling Note (Excalidraw/diagrams.net)

- Recreate the diagram with five labeled boxes and the arrows above.
- Keep labels on arrows to clarify protocol and purpose (HTTP REST, WebSockets, SQL, HTTPS).
