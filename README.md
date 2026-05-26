# Hotel Booking System

> Personal portfolio project — a small full-stack hotel booking system with
> authentication, room and guest CRUD, bookings and an availability calendar.

## Status

🚧 **Work in progress** — built as a personal portfolio exercise to consolidate
full-stack development skills on a modern Node.js + React stack.

## Tech Stack

**Backend** — Node.js, Express, TypeScript, JWT auth, bcrypt
**Frontend** — React, TypeScript, Vite
**Persistence** — SQLite (file-based, zero config)

## Roadmap

- [ ] User registration + login with JWT
- [ ] Rooms CRUD (number, type, capacity, daily rate)
- [ ] Guests CRUD
- [ ] Bookings CRUD with availability check on date ranges
- [ ] Admin dashboard with occupancy view
- [ ] Tests (Vitest + Supertest)
- [ ] CI workflow (GitHub Actions)

## Architecture

```
[ React + TypeScript ]  ⇄  REST/JSON + JWT  ⇄  [ Express + TS ]  ⇄  [ SQLite ]
```

## Scope and disclaimer

Personal exercise written from scratch on fictional data. Contains no proprietary
material from any employer or third party.

## Author

Andrea Rovea — [LinkedIn](https://www.linkedin.com/in/andrea-rovea)

## License

MIT — see `LICENSE` file.

