# ByteCode

A full-stack, LeetCode-style competitive programming platform — solve DSA problems in an in-browser editor, run code against test cases, get AI help, and climb real-time leaderboards.

Built to be more than a CRUD app: the submission flow is a **fault-tolerant, asynchronous pipeline** (job queue + workers + circuit breaker + real-time push) rather than a blocking request.


## Features

- **Code editor & judging** — Monaco editor with C++, Java, and JavaScript; **Run** against visible tests (instant) and **Submit** against hidden tests (async). Code is executed via the [Judge0](https://judge0.com/) API.
- **Real-time verdicts** — submissions are queued and judged by a background worker; the result is pushed back to the browser over WebSockets (no polling).
- **Leaderboards** — a global ranking, your personal rank/percentile card, and a per-problem "fastest runtime" board — all backed by Redis sorted sets.
- **Discussion forum** — threaded comments with replies and upvotes on every problem.
- **AI doubt-solver** — a problem-scoped chat assistant (streamed responses) powered by an LLM.
- **Video editorials** — per-problem solution videos hosted on Cloudinary.
- **Auth & roles** — JWT (httpOnly cookie) auth with a Redis token blocklist for logout, and a full **admin panel** (manage problems, users, and videos).
- **Profile & stats** — solved counts, difficulty breakdown, and submission history.

---

## Architecture

The web tier never blocks on the (slow, external) judge. A submission is enqueued and a worker processes it; the verdict travels back over Socket.io.

```
                    ┌──────────────────────────────┐
   Vercel           │        Frontend (React)       │
                    │  Monaco · Redux · Socket.io    │
                    └───────────────┬────────────────┘
                                    │ HTTPS (httpOnly cookie)
                ┌───────────────────▼───────────────────┐
  Railway /     │            API tier (Express)          │
  Render        │  rate limit · auth+blocklist · cache   │
                │  controllers → services → repositories │
                └───┬──────────────┬───────────────┬─────┘
            enqueue │         cache │         read/write
                    ▼              ▼               ▼
            ┌──────────────┐ ┌──────────┐  ┌──────────────┐
            │ BullMQ queue │ │  Redis   │  │   MongoDB    │
            │   (Redis)    │ │ cache /  │  │   (Atlas)    │
            └──────┬───────┘ │  ZSET LB │  └──────────────┘
                   │         └──────────┘
                   ▼
            ┌──────────────┐   circuit breaker + retry/backoff
  Railway / │  Worker(s)   │──────────────────────────────►  Judge0
  Render    │ BullMQ       │                                 (external)
            │ consumer     │── save verdict → publish ──► Socket.io ──► browser
            └──────────────┘
```


## System design concepts (and where they live)

This project was a vehicle to implement real backend patterns. Each is small and defensible:

| Concept | Where in the code |
|---|---|
| **Async job queue** (producer/consumer) | BullMQ — `submission.controller` enqueues, `workers/submissionWorker` consumes |
| **Back-pressure** | Worker `concurrency: 5` caps simultaneous Judge0 calls |
| **Rate limiting** | Redis sliding window — `rateLimiter.middleware` on auth + submit |
| **Idempotency** | `Idempotency-Key` header → Redis (`idempotency.middleware`) prevents duplicate submissions |
| **Circuit breaker** | `opossum` around Judge0 in `lib/judge0Adapter` — fails fast when the judge is down |
| **Cache-aside** | Redis cache for problem reads (`lib/cache`), invalidated on write |
| **Saga / compensating transaction** | `services/submissionService` rolls back to an error state on partial failure |
| **Pub/Sub + real-time** | BullMQ `QueueEvents` → Socket.io room push (`socket.js`) |
| **Stateless auth + token blocklist** | JWT cookie + Redis blocklist on logout (`auth.middleware`) |
| **Right data structure** | Redis Sorted Sets (ZSET) for O(log N) leaderboards (`lib/leaderboard`) |

---

## Tech stack

**Frontend:** React 19 · Vite · Redux Toolkit · React Router · Tailwind CSS v4 + DaisyUI · Monaco Editor · Socket.io-client · Zod · Framer Motion

**Backend:** Node.js · Express 5 · MongoDB + Mongoose · Redis · BullMQ · Socket.io · Opossum (circuit breaker) · JWT · bcrypt

**External services:** Judge0 (code execution) · Cloudinary (video) · OpenRouter (AI chat)


