 # SwiftRoute — Chapter 3: Tech Stack Justification (Revised)
 
 Purpose: Document concise, defensible reasons for each technology choice with Express.js replacing NestJS.
 
 ## 1) Monorepo (Turborepo)
 Justification: We chose a Turborepo monorepo to streamline development and simplify code sharing, like shared TypeScript types, between our backend, web, and mobile apps.
 
 ## 2) Backend (Node.js + Express.js)
 Justification: We chose Express.js for the backend due to its minimalist, unopinionated nature, which offers maximum flexibility and is foundational for understanding Node.js web servers.
 
 ## 3) Database (PostgreSQL + PostGIS)
 Justification: We chose PostgreSQL with the PostGIS extension because it provides powerful, indexed geospatial query capabilities essential for our location-based features.
 
 ## 4) Admin Dashboard (Next.js)
 Justification: We chose Next.js for the admin dashboard because it offers a production-ready framework with file-based routing and optimized rendering for a superior developer experience.
 
 ## 5) Driver Mobile App (React Native)
 Justification: We chose React Native for the driver app because it allows us to build and maintain a single codebase that deploys natively to both iOS and Android, saving significant time and resources.
 
 ## 6) Real-Time (WebSockets via Socket.IO)
 Justification: We chose WebSockets for real-time features because they provide persistent, bidirectional communication needed for instantly broadcasting driver location updates to the dashboard.
 
 ## 7) Deployment (Docker)
 Justification: We chose to use Docker for deployment because it encapsulates our application into portable containers, guaranteeing consistency between our development and production environments.
 
