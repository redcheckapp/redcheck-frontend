# RedCheck - AI-Powered Smart Planner

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)

> **RedCheck** is an interactive time and task management application designed to prioritize daily workloads using artificial intelligence. 

This repository contains the **Frontend** client. You can find the API and Backend architecture in [this link](https://github.com/redcheckapp/redcheck-backend.git). 

This full-stack project showcases advanced frontend architecture, artificial intelligence integration, and a strong focus on building scalable web applications.

<p align="center">
  <img src="https://github.com/user-attachments/assets/54ebbb87-0f47-407a-ad6f-9f448821fb9a" alt="RedCheck Dashboard Overview" width="800"/>
</p>

## Key Features

The frontend was designed with a strict focus on User Experience (UX), frictionless interactions, and a highly scalable component architecture.

- **SmartCheck AI:** Artificial intelligence integration to generate daily strategies. It analyzes task risk levels (High/Medium/Low), defines an execution order, and generates a priority reasoning for each item.

  <p align="center">
    <img src="https://github.com/user-attachments/assets/09817975-e8f0-4c95-beee-9da478879499" alt="SmartCheck AI Demo" width="800"/>
  </p>
  
- **Activity Heatmap:** Historical progress visualization via a contribution graph (inspired by GitHub), dynamically calculated based on daily task completion ratios.
- **Dynamic Agenda Views:** Advanced conditional rendering to visualize workloads seamlessly in Day, Week, or Month formats.
- **Recurring Tasks Management:** Dedicated interface to schedule automatic task generation based on custom frequencies (Daily, Weekly, Biweekly, Monthly).
- **Native Dark Mode:** Fully integrated Light/Dark themes supported by the Context API and persisted via `localStorage`. The color palette (`zinc` and `gray`) was meticulously adapted to reduce visual fatigue and ensure WCAG contrast compliance.
  
  <p align="center">
    <img src="https://github.com/user-attachments/assets/46cfb9c5-ab96-4d90-bea3-e14d94256640" alt="Dark Mode Transition" width="800"/>
  </p>
  
- **UI Animations:** Fluid page transitions and interactive modals utilizing `Framer Motion` and optimized CSS animations.

## Tech Stack

- **Core:** React 18, TypeScript, Vite.
- **Styling:** Tailwind CSS.
- **Animations:** Framer Motion, tsParticles (for interactive authentication backgrounds).
- **Iconography:** Lucide React.
- **Routing:** React Router DOM.
- **Deployment:** Docker, Docker Compose, NGINX.

## Local Installation & Deployment

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or pnpm

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/redcheckapp/redcheck-frontend.git
   cd redcheck-frontend
   ```
2. NGINX Configuration (```nginx.conf```):
   Ensure your NGINX configuration file is set up to route traffic correctly. The frontend is served on ```/```, while API endpoints are proxied to ```redcheck-backend:8080```.
```Nginx
server {
    listen 80;
    server_name localhost;

    # Global proxy headers
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # 1. Route API calls to the backend container
    location /auth/ { proxy_pass http://redcheck-backend:8080; }
    location /users/ { proxy_pass http://redcheck-backend:8080; }
    location /subjects { proxy_pass http://redcheck-backend:8080; }
    location /tasks { proxy_pass http://redcheck-backend:8080; }
    location /recurring_tasks { proxy_pass http://redcheck-backend:8080; }
    location /progress_records { proxy_pass http://redcheck-backend:8080; }
    location /notifications { proxy_pass http://redcheck-backend:8080; }
    location /ai_responses { proxy_pass http://redcheck-backend:8080; }
    location /ai { proxy_pass http://redcheck-backend:8080; }
    location /progress { proxy_pass http://redcheck-backend:8080; }

    # Swagger / OpenAPI Documentation
    location /v3/ { proxy_pass http://redcheck-backend:8080; }
    location /swagger-ui/ { proxy_pass http://redcheck-backend:8080; }

    # 2. Serve the React SPA
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri$uri/ /index.html; 
    }
}
```
3. Build and Run:
   Execute your Docker Compose file to build the frontend image and spin up the NGINX container.
```Bash
docker-compose up -d --build
```
4. Open ```http://localhost``` in your browser.

## Demo Environment

To facilitate technical reviews by recruiters and other developers, the login screen includes a Demo Button. This feature injects test credentials (```demo@redcheck.com```) and performs automatic authentication, allowing instant access to the application without manual registration.

## Architecture Highlights

The project follows a clean architectural pattern, strictly decoupling business logic from the presentation layer:

- ```/components```: Reusable and purely visual UI components (modals, transitions, animated visibility). Heavy utilization of ```createPortal``` to manage complex floating elements (like tooltips and dialogs) avoiding ```z-index``` conflicts.
- ```/api```: Abstraction layer for HTTP requests (Axios/Fetch), fully typed with TypeScript, separating endpoints by domain (Auth, Tasks, Progress, etc.).
- ```/context```: Lightweight global state management (e.g., ```ThemeContext```).
