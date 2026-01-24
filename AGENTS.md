# AGENTS.md

Guidelines for AI agents working in this codebase.

## Project Overview

Real-time translation video conferencing app - "the child of Google Meet and Granola". Uses Daily.co for video infrastructure with planned real-time translation to each attendee's native language.

## Tech Stack

- **Runtime**: Bun (use `bun` instead of `npm`/`yarn`/`pnpm`)
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 with shadcn/ui (new-york style)
- **Database**: Drizzle ORM with Neon PostgreSQL (serverless)
- **State**: TanStack Query (server state) + Jotai (client state)
- **Video**: Daily.co React SDK
- **Forms**: react-hook-form + Zod v4
- **Linting/Formatting**: Biome (NOT ESLint/Prettier for formatting)

## Commands

```bash
# Development
bun dev              # Start dev server (http://localhost:3000)
bun build            # Production build
bun start            # Start production server
bun lint             # Run ESLint

# Database (Drizzle)
bun db:generate      # Generate migrations
bun db:migrate       # Run migrations
bun db:push          # Push schema to database
bun db:studio        # Open Drizzle Studio

# Formatting (Biome)
bunx biome check .              # Check all files
bunx biome check --write .      # Auto-fix issues
bunx biome format --write .     # Format only
```

## Testing

**No test infrastructure is currently set up.** When adding tests:
- Recommend Vitest for unit/integration tests
- Recommend Playwright for E2E tests
- Add scripts to package.json: `"test": "vitest"`, `"test:e2e": "playwright test"`

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (route.ts files)
│   ├── rooms/             # Room pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global styles (Tailwind v4)
├── components/
│   ├── ui/                # shadcn/ui components (DO NOT EDIT directly)
│   ├── providers/         # Context providers (query, daily)
│   └── room/              # Room-specific components
├── hooks/                 # Custom React hooks
└── lib/
    ├── utils.ts           # cn() utility
    └── db/
        ├── index.ts       # Database client
        └── schema.ts      # Drizzle schema
```

## Path Alias

Use `@/*` for imports from `src/`:
```typescript
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRoom } from "@/hooks/use-room";
```

## Code Style

### Import Organization (Biome-enforced)

Imports must be organized with blank lines between groups:

```typescript
// 1. React/Next.js
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// 2. External packages
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

// 3. Internal lib
import { cn } from "@/lib/utils";
import { db } from "@/lib/db";

// 4. Components
import { Button } from "@/components/ui/button";
import { VideoRoom } from "@/components/room/video-room";

// 5. Hooks
import { useRoom } from "@/hooks/use-room";
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `use-room.ts`, `video-grid.tsx` |
| Components | PascalCase | `VideoRoom`, `CreateRoomForm` |
| Hooks | camelCase with `use` prefix | `useRoom`, `useCreateRoom` |
| Functions | camelCase | `handleSubmit`, `toggleAudio` |
| Constants | UPPER_SNAKE_CASE | `DAILY_API_KEY`, `MOBILE_BREAKPOINT` |
| Types/Interfaces | PascalCase | `Room`, `VideoRoomProps` |
| Database tables | snake_case | `daily_room_name`, `created_at` |

### Component Pattern

```typescript
"use client";  // Required for client components

import { cn } from "@/lib/utils";

interface ComponentProps {
  className?: string;
  children: React.ReactNode;
}

export function Component({ className, children }: ComponentProps) {
  return (
    <div className={cn("base-classes", className)}>
      {children}
    </div>
  );
}
```

### API Route Pattern

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validation
    if (!body.requiredField) {
      return NextResponse.json(
        { error: "Field is required" },
        { status: 400 }
      );
    }

    // Logic here...
    const result = await db.insert(table).values(data).returning();

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error description:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### Custom Hook Pattern (with TanStack Query)

```typescript
"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

export function useCreateThing() {
  return useMutation({
    mutationFn: async (data: CreateData): Promise<Thing> => {
      const response = await fetch("/api/things", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create thing");
      }

      return response.json();
    },
  });
}
```

### Database Schema Pattern (Drizzle)

```typescript
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";

export const things = pgTable("things", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertThingSchema = createInsertSchema(things);
export const selectThingSchema = createSelectSchema(things);
export type Thing = z.infer<typeof selectThingSchema>;
export type NewThing = z.infer<typeof insertThingSchema>;
```

## Formatting Rules (Biome)

- **Indentation**: 2 spaces
- **Semicolons**: Required (default)
- **Quotes**: Double quotes for strings
- **Trailing commas**: ES5 style

Run `bunx biome check --write .` before committing.

## Important Notes

1. **shadcn/ui components**: Located in `src/components/ui/`. These are generated - prefer not editing directly. Add new ones via `bunx shadcn@latest add <component>`.

2. **"use client" directive**: Required at the top of any component using hooks, event handlers, or browser APIs.

3. **cn() utility**: Always use for conditional Tailwind classes:
   ```typescript
   className={cn("base-class", isActive && "active-class", className)}
   ```

4. **Environment variables**: Server-only vars go in `.env.local`. Client vars need `NEXT_PUBLIC_` prefix.

5. **Daily.co integration**: Video rooms use `@daily-co/daily-react` hooks. The `DailyProvider` must wrap video components.

6. **No tests yet**: Be extra careful with changes. Consider adding tests when implementing critical features.
