# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- The developer themself (personal/demo project). There is no confirmed external user base.
- The immediate audience for the work is the developer's teacher, who will be given a live demo.

## Product Purpose

OnRugby is a rugby news forum and interactive tactics board: read generated rugby news, discuss in a supporters forum, and build/save/share 2D tactical formations. Success means a live demo runs end-to-end without failure.

## Positioning

The interactive tactics board itself is the core mechanism — a draggable 2D playbook environment supporting both Sevens and Union formations, with custom rosters and board sharing. This is the one thing a generic rugby forum could not truthfully copy.

## Operating Context

- A live demo to the teacher is the near-term event the product is being prepared for.
- It must run for free during that demo: the server-side LLM news API is intended to move to NVIDIA NIM (free tier) rather than staying on Gemini, so the demo has no paid dependency. (Current code still uses `@google/genai`; the switch is planned, not done.)
- Local development: `npm run dev` runs Vite (port 3000) plus the Express API; storage is a JSON file (`db.json`), no external database.

## Capabilities and Constraints

- Four tabs: News & Match Center, Tactics Board, Supporters Forum, Squad Draft (custom team creator).
- Tactics board: 15-union, 7-sevens, and custom formations; players positioned by percentage coordinates; boards saved server-side and shareable; preloaded team names from upcoming matches.
- Forum: posts with categories (news/tactics/transfers/general), types (general/analysis), upvotes, comments — all require auth.
- News: fetched from `/api/forum/news`, generated server-side through an LLM API (currently Gemini; target NVIDIA NIM — undecided migration details).
- Auth: register/login/session-verify with SHA-256 password hashing + salt, bearer tokens in localStorage, dynamic rate limiting on auth routes.
- Stack: React 19 + Vite + Tailwind v4 front end, Express API in the same process, TypeScript throughout.
- Open decision: exact NVIDIA NIM integration (model, key handling) — not yet chosen.

## Brand Commitments

- Existing product name in the code and UI: **OnRugby** ("Foro y Tablero Táctico de Rugby").
- Footer/UI security claims (password hashing, rate limiting, session encryption) must stay truthful to what the server actually does.
- No visual identity constraint has been declared binding by the user; the incumbent dark slate/amber look is evidence, not a commitment.

## Evidence on Hand

- The running codebase itself: `src/` (App, Navbar, NewsSector, ForumSector, TacticsBoard, CustomTeamCreator, AuthModal), `server/` (auth, forum, tactics routes, rate limiter, JSON db).
- `README.md` is the original AI Studio scaffold boilerplate and carries no product truth; its Gemini-key instruction is superseded by the NVIDIA NIM intent above.
- No testimonials, customers, benchmarks, or press exist. Future work must not invent any.

## Product Principles

1. The tactics board is the product — protect and sharpen it before adding anything else.
2. The demo must run free: no feature may introduce a paid API dependency.
3. Both rugby formats (Sevens and Union) stay first-class; never optimize for one by dropping the other.
4. Security claims in the UI are contracts with the code — claim only what the server does.
5. It is a demo for a teacher: honest scope beats fake scale (no invented users, metrics, or proof).

## Accessibility & Inclusion

No product-specific accessibility requirement has been established.
