# Locallytrip v2 — Next-Generation Travel Experiences & Community Platform

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4.1-black?logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.3.1-61dafb?logo=react)](https://react.dev/)
[![TypeScript 7](https://img.shields.io/badge/TypeScript-7.0.2-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.19.3-2d3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169e1?logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed?logo=docker)](https://www.docker.com/)

Locallytrip v2 is a modern, high-performance travel marketplace and community ecosystem designed to connect adventurous global travellers with authentic local hosts. Built entirely on Next.js 16 App Router, React 19, and PostgreSQL, this second-generation release brings intelligence, automation, and real-time localization to every touchpoint of the platform.

---

## 🌟 Key Highlights & What's New in v2

### 1. AI-Assisted Host Experience Builder
Creating compelling travel tour packages and itineraries is effortless for local hosts. Integrated with Google Gemini models:
- **Intelligent Itinerary Drafting**: Automatically structures daily itineraries, activity inclusions/exclusions, preparation notes, and safety guidelines based on minimal prompts.
- **Engaging Copywriting**: Crafts high-converting, culturally sensitive, and SEO-optimized tour descriptions.
- **Structured JSON Formats**: Ensures all generated experiences match marketplace catalog requirements seamlessly.

### 2. Real-Time Bilateral AI Translation
Locallytrip v2 bridges the communication barrier between international wanderers and local communities:
- **Ultra-Fast Sub-2s Latency**: Powered by optimized `gemini-3.5-flash-lite` pipelines with minimal latency.
- **Smart Language Detection**: Automatically recognizes whether content is written in Indonesian, English, or slang, seamlessly translating to the counterpart language.
- **Strict Markdown & HTML Preservation**: Preserves headers, bold/italic text, links, blockquotes, and lists without scrambling article layouts.
- **Universal Application**: Available across travel stories, community forum threads, meetup discussions, reviews, and user comments.

### 3. Gamification Economy: XP (Experience Points) & LTP (Locallytrip Points)
Locallytrip v2 features an engaging dual-token gamification economy to reward vibrant community participation:
- **XP (Experience Points)**: Non-financial reputation points earned through platform activity (booking trips, sharing reviews, creating helpful forum discussions, and attending local meetups). XP unlocks traveler loyalty tiers, badge tiers, and community leadership status.
- **LTP (Locallytrip Points)**: Digital loyalty reward units earned through meaningful community contributions and referral achievements. LTP can be redeemed for booking discounts, exclusive tour perks, and marketplace vouchers.

### 4. Future Vision: Web3 & Cryptocurrency Exchange Listing
LTP is architected with tokenomic principles to transition into an on-chain utility token (**LTP Coin**):
- **Decentralized Travel Economy**: Bridging Web2 travel bookings with Web3 decentralized incentives.
- **Exchange Listing Roadmap**: Targeting future public exchange listing on major cryptocurrency centralized and decentralized exchanges (CEX/DEX), enabling cross-border value transfer, host micro-settlements, and community staking rewards.

### 5. Multi-Layer Role-Based Access Control (RBAC)
Robust administrative security architecture featuring 7 distinct platform roles:
- **Public Roles**: `traveller`, `host`.
- **Internal Staff Roles**: `super admin`, `admin`, `moderator`, `finances`, `marketing`.
- **Multi-Defense Perimeter**: Route filtering at Next.js Middleware, JWT session enrichment, dynamic sidebar menu trimming, and Server Actions permission guards (`requireRole`, `requirePermission`).

---

## 🏗️ Technical Architecture & Tech Stack

Locallytrip v2 is engineered as a cloud-native, modular monolith optimized for high concurrency, low latency, and ease of deployment:

```
                            ┌─────────────────────────────────────────┐
                            │               Nginx Proxy               │
                            │        (SSL / HTTP2 / Rate Limit)       │
                            └────────────────────┬────────────────────┘
                                                 │
                            ┌────────────────────▼────────────────────┐
                            │       Locallytrip App (Next.js 16)      │
                            │  React 19 Server & Client Components    │
                            │  Server Actions · NextAuth · Tailwind 4 │
                            └──────────┬───────────────────┬──────────┘
                                       │                   │
                        ┌──────────────▼──────┐     ┌──────▼──────────────┐
                        │    PostgreSQL 15    │     │  Google Gemini API  │
                        │     (Prisma ORM)    │     │ (Flash / Bilateral) │
                        └─────────────────────┘     └─────────────────────┘
```

### Core Technologies
- **Framework**: [Next.js 16.4.1](https://nextjs.org/) (App Router, Server Actions, Middleware, Dynamic Route Handlers)
- **UI Library**: [React 19.3.1](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with `@tailwindcss/postcss`
- **Animations**: [Framer Motion 14.6](https://www.framer.com/motion/)
- **Database & ORM**: [PostgreSQL 15](https://www.postgresql.org/) with [Prisma ORM 6.19.3](https://www.prisma.io/)
- **Authentication**: [NextAuth.js v4](https://next-auth.js.org/) (Credentials, Google OAuth 2.0, JWT Session Strategy)
- **Rich Text & Content**: [Tiptap](https://tiptap.dev/) Headless Editor, `react-markdown`, `remark-gfm`, and `dompurify`
- **AI Engine**: Google Gemini API (`gemini-3.5-flash-lite`, `gemini-3.8-flash`)
- **Containerization & Infra**: Docker & Docker Compose with multi-stage Alpine build

---

## 📁 Repository Directory Structure

```text
locallytrip-v2/
├── prisma/
│   ├── schema.prisma              # Relational database models and indexes
│   ├── migrations/                # Database schema migrations
│   └── init-seed.sql              # Initial master data and system roles
├── public/                        # Static assets, branding, and uploaded media
├── src/
│   ├── actions/                   # Next.js Server Actions
│   │   ├── admin/                 # CMS backend logic (Users, KYC, Payouts, Master, Vouchers)
│   │   ├── experiences/           # AI experience builder and catalog mutations
│   │   ├── bookings.ts            # Reservation checkout and transaction pipeline
│   │   └── translate.ts           # Bilateral on-demand translation action
│   ├── app/
│   │   ├── (admin)/admin/         # Restricted Admin CMS Dashboard routes
│   │   ├── (public)/              # Localized public marketplace routes (/[lang]/...)
│   │   └── api/                   # REST endpoints, OAuth callbacks, and AI translation route
│   ├── components/                # Modular React Client & Server Components
│   │   ├── admin/                 # CMS dashboard views, dynamic sidebars, and widgets
│   │   ├── community/             # UGC translate buttons, story readers, and forums
│   │   ├── experiences/           # Tour cards, booking drawers, and AI builder UI
│   │   └── layout/                # Navigation bars, currency selectors, footer
│   ├── lib/                       # Utility helpers, database clients, and security
│   │   ├── admin-auth.ts          # Centralized RBAC permission verification
│   │   ├── auth.ts                # NextAuth configuration and token callbacks
│   │   ├── bilateralTranslator.ts # Core bilingual translation engine
│   │   ├── currency.ts            # Multi-currency converter (IDR / USD)
│   │   └── prisma.ts              # Global Prisma client singleton
│   ├── middleware.ts              # Route guarding, language routing, and role interceptor
│   └── types/                     # TypeScript declarations and NextAuth augmentations
├── docker-compose.yml             # Container orchestration (App, Database, Nginx)
├── Dockerfile                     # Optimized production multi-stage build
└── package.json                   # Dependencies and npm scripts
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or `v22.x`
- **npm**: `v10.x` or higher
- **PostgreSQL**: `v15` or higher (or Docker)
- **Google Gemini API Key**: Activated via Google Cloud Console

### Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/nopecode96/locallytrip-v2.git
   cd locallytrip-v2
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` or `.env.local` file by referring to `.env.example`:
   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/locallytrip_db?schema=public"
   NEXTAUTH_SECRET="your-super-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   GEMINI_API_KEY="your-gemini-api-key"
   ```

4. **Initialize Database Schema:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🐳 Docker Production Deployment

Locallytrip v2 includes automated containerization configurations:

```bash
# Build and run containers in detached mode
docker compose up -d --build

# Inspect running services
docker compose ps

# View application logs
docker compose logs -f app
```

---

## 🛡️ Security & Best Practices
- **Strict Role-Based Routing**: Admin paths (`/admin/*`) are defended at the edge by Next.js Middleware and verified at the database layer on every Server Action invocation.
- **SQL Injection Prevention**: Completely parameterized database queries via Prisma ORM.
- **Content Sanitization**: Markdown and user-generated HTML rendered via DOMPurify to eliminate XSS attack surfaces.
- **Environment Isolation**: Production secrets and database credentials remain outside git commits.

---

## 📄 License
Private and Proprietary. All rights reserved by **Locallytrip**.
