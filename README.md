# FlexHands

FlexHands is a web app for local handyman jobs and daily micro-tasks. Clients can post small tasks, and task doers can browse nearby work, view profiles, send offers, chat, and manage simple escrow-style payments.

## Main Features
- Document upload flow for identity and work/student eligibility
- Browse tasks by category, search text, and distance
- View a user's profile before sending an offer
- Separate message conversations for each task and person
- Send offers, chat, block/report users, rate users, and delete conversations
- Simple payment status flow: deposit, held, completed, released
- In-app notifications for offers, payments, reports, and task updates

## Tech Used

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **UI Icons:** lucide-react
- **Backend:** Next.js API routes
- **Database Plan:** PostgreSQL with Prisma
- **Validation/Auth Helpers:** Zod, bcryptjs, JSON Web Token helpers
- **Current Demo Storage:** Browser localStorage for accounts, sessions, profile photos, tasks, messages, and payments.

## How To Run

To run GitHub code space just run this command
npm run dev

Or open the project in VS Code, then run:

```bash
npm install
npm run dev
```

Then open:

```text
http://localhost:3000
```

If you are using GitHub Codespaces, run `npm run dev` and open the forwarded port.

## Useful Commands

```bash
npm run dev
npm run lint
npm run build
```

## Project Structure

```text
src/app/page.tsx              Main app screen and user interface
src/lib/client-auth.ts        Local demo authentication and account storage
src/lib/mock-data.ts          Starter task and notification data
src/components/TaskCard.tsx   Task listing card component
src/app/api                  Backend API route starters
prisma/schema.prisma          Database schema plan
```


