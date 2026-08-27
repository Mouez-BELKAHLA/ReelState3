ReelState

A social real-estate platform with short-form video listings — think TikTok/Instagram Reels, but for property listings. Agents post short vertical videos of properties, and users can like, comment, follow agents, and get notified about new posts.

Live demo: https://reel-state3.vercel.app

What it does
Agents post short vertical videos, photos, and location details for property listings
Users can like, comment, follow agents, and receive notifications for social interactions
Authentication via JWT bearer tokens and Google OAuth sign-in
Admin functionality for managing listings and users
Tech stack

Backend: ASP.NET Core Web API (.NET 9), Entity Framework Core, SQL Server Auth: ASP.NET Core Identity, JWT bearer tokens, Google OAuth Frontend: React, TypeScript Docs: Swagger / OpenAPI

Architecture
REST controllers for Auth, Properties, Comments, Comment Likes, Likes, Follows, Notifications, User Activity, and Admin
Database modeled with EF Core Code-First, evolved through 15+ incremental migrations as features were added
Frontend organized by feature (auth, dashboard, property, profile, admin, notifications, AI)
Running locally
bash
# Backend
cd ReelState.Api
dotnet restore
dotnet ef database update
dotnet run

# Frontend
cd reelstate-frontend
npm install
npm run dev

You'll need a SQL Server instance and to configure your connection string and JWT/Google OAuth secrets in appsettings.json / environment variables.

Known limitations

Media uploads (photos/videos) are currently stored locally on the backend rather than in cloud blob storage. This means uploaded media doesn't persist across server restarts on the free-tier hosting used for the demo. The database and application logic already support swapping in a cloud storage provider (e.g., Azure Blob Storage, AWS S3) — it's a storage backend change, not an architectural one.

Author

Mouez Belkahla — Portfolio · LinkedIn
