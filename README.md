![tests](https://github.com/Mouez-BELKAHLA/ReelState3/actions/workflows/tests.yml/badge.svg) ![frontend](https://github.com/Mouez-BELKAHLA/ReelState3/actions/workflows/frontend.yml/badge.svg)

![tests](https://github.com/Mouez-BELKAHLA/ReelState3/actions/workflows/tests.yml/badge.svg) ![frontend](https://github.com/Mouez-BELKAHLA/ReelState3/actions/workflows/frontend.yml/badge.svg)

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
Database modeled with EF Core Code-First, evolved through 16 incremental migrations as features were added
Frontend organized by feature (auth, dashboard, property, profile, admin, notifications, AI)
Running locally
bash
# Backend
cd ReelState.Server
dotnet restore
dotnet ef database update
dotnet run

# Frontend
cd reelstate.client
npm install
npm run dev

You'll need a SQL Server instance and to configure your connection string and JWT/Google OAuth secrets in appsettings.json / environment variables.

Known limitations

Photos and videos are stored on Cloudinary.

Author

Mouez Belkahla — Portfolio · LinkedIn

## Testing and CI

- **Backend:** 29 xUnit tests, including integration tests with `WebApplicationFactory` (in-memory database) for authentication, role-based access, API versioning and rate limiting.
- **Frontend:** 17 tests with Vitest and React Testing Library.
- GitHub Actions runs both test suites on every push and pull request.

Run the tests locally:

```bash
dotnet test
cd reelstate.client && npm test
```

## Testing and CI

- **Backend:** 33 xUnit tests, including Moq unit tests and `WebApplicationFactory` integration tests (authentication, role-based access, API versioning, rate limiting).
- **Frontend:** 17 tests with Vitest and React Testing Library.
- GitHub Actions runs both suites on every push and pull request.

```bash
dotnet test
cd reelstate.client && npm test
```