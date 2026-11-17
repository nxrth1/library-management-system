# Library Management System

A NestJS, TypeScript, Prisma, PostgreSQL, and JWT project for completing a
full-stack library catalog API.

This repository intentionally contains an incomplete backend. The goal is to
make the changes yourself so that you learn TypeScript and NestJS through the
assignment.

## Assignment Goal

Complete the required backend core:

- Genre CRUD
- Book CRUD
- Filtering, title/author search, and pagination
- DTO validation
- JWT registration and login
- bcrypt password hashing
- Role-based access for librarian operations
- Authenticated user profile
- Optional login rate limiting

## How Far Along You Are

The project currently has the database foundation and some partial catalog
code. It does **not** yet compile into a complete working assignment.

| Area | Status |
| --- | --- |
| Prisma models and PostgreSQL schema | Present |
| Genre model and seed catalog | Present |
| Book model and seed catalog | Present |
| Prisma service | Present, needs to be registered as a provider |
| Partial create-book DTO | Present, incomplete |
| Partial book controller/service | Present, incomplete and missing imports |
| Genre controller/service/module | Files exist but are empty |
| Auth files | Files exist but are empty |
| App module | Not yet wired to feature modules |
| Register/login/profile endpoints | Missing |
| Tests | Starter tests only |

Do not jump directly to the finish button. Complete the sections below in order
and run a build or test after each section.

## What You Need Before Starting

1. Install Node.js and npm.
2. Install PostgreSQL.
3. Create a database for the project.
4. Open a terminal at the repository root.
5. Copy the environment example:

```powershell
Copy-Item api\.env.example api\.env
```

6. Replace the placeholder values in `api\.env` with your real PostgreSQL
   connection string.
7. Install dependencies:

```powershell
npm install
cd api
npm install
cd ..
```

## Stage 1: Understand the Database

Open [api/prisma/schema.prisma](api/prisma/schema.prisma).

You already have these models:

- `User`
- `Genre`
- `Book`
- `Role`

Before changing the schema, understand:

- `Genre` is the parent in a one-to-many relationship.
- `Book.genreId` stores the foreign key.
- `Book.genre` is the Prisma relation.
- `User.role` is either `PATRON` or `LIBRARIAN`.
- `PATRON` is the default role.

Generate Prisma and create the migration:

```powershell
npm run prisma:generate
npm run prisma:migrate -- --name init
```

If this succeeds, continue.

## Stage 2: Seed the Data

Open [api/prisma/seed.ts](api/prisma/seed.ts).

The catalog seed already creates four genres and sixteen books. It also contains
partial librarian-seeding code that needs to match the `User` model exactly.

Make this seed use only fields that exist in `User`. It must:

- Import `Role` from `@prisma/client`.
- Use `password` for the hashed password.
- Not create a `name` field unless you add `name` to the Prisma model.
- Hash `Librarian123!`.
- Use `upsert` for `librarian@library.com`.
- Set the librarian role to `LIBRARIAN`.
- Disconnect Prisma in the final block.

Then run:

```powershell
npm run prisma:seed
```

## Stage 3: Create the Prisma Provider

Open [api/src/prisma/prisma.service.ts](api/src/prisma/prisma.service.ts).

Confirm that it extends `PrismaClient`, connects during application startup,
and disconnects during shutdown.

Then open [api/src/app.module.ts](api/src/app.module.ts).

Register `PrismaService` in `providers` and `exports`, or create a reusable
Prisma module. Every service that uses Prisma needs access to this provider.

Do not put database queries directly inside controllers.

## Stage 4: Complete Validation

Open [api/src/books/dto/create-book.dto.ts](api/src/books/dto/create-book.dto.ts).

The DTO is missing fields and validation. It should validate the fields required
for book creation. Add class-validator decorators to:

- `title`
- `author`
- `isbn`
- `description`
- `coverImage`
- `totalCopies`
- `genreId`

Use validation to enforce:

- strings for text fields
- optional `coverImage`
- positive integer copy counts
- positive integer `genreId`

Create a separate update DTO rather than treating every update field as
required. For example: `UpdateBookDto` can make create DTO fields optional.

Validation is already enabled in [api/src/main.ts](api/src/main.ts). Keep
`whitelist` and `forbidNonWhitelisted` enabled so unknown fields are rejected.

## Stage 5: Complete the Genres Feature

Work in this order:

1. [api/src/genres/genres.controller.ts](api/src/genres/genres.controller.ts)
2. [api/src/genres/genres.service.ts](api/src/genres/genres.service.ts)
3. [api/src/genres/genres.module.ts](api/src/genres/genres.module.ts)
4. [api/src/app.module.ts](api/src/app.module.ts)

Implement these service operations:

- `findAll`
- `findOne`
- `create`
- `update`
- `remove`

Expose these routes:

| Method | Route | Access |
| --- | --- | --- |
| GET | `/genres` | Public |
| GET | `/genres/:id` | Public |
| POST | `/genres` | LIBRARIAN |
| PATCH | `/genres/:id` | LIBRARIAN |
| DELETE | `/genres/:id` | LIBRARIAN |

Use Nest exceptions such as `NotFoundException` when a genre does not exist.

## Stage 6: Complete the Books Feature

Open:

- [api/src/books/dto/books.controller.ts](api/src/books/dto/books.controller.ts)
- [api/src/books/books.service.ts](api/src/books/books.service.ts)
- [api/src/books/dto/create-book.dto.ts](api/src/books/dto/create-book.dto.ts)

At the top of each `.ts` file, add the imports used by that file. Nest decorators
and TypeScript types do not work unless they are imported.

Add or complete these methods:

- `findAll`
- `findOne`
- `create`
- `update`
- `remove`

The `GET /books` route must support:

- `genreId`
- `search`
- `page`
- `limit`

Use Prisma `where` and `skip/take` for the query. A title/author search can use
the `OR` operator with `contains` and `insensitive`.

Use DTO validation for create and update requests.

Protect mutation routes:

| Method | Route | Access |
| --- | --- | --- |
| GET | `/books` | Public |
| GET | `/books/:id` | Public |
| POST | `/books` | LIBRARIAN |
| PATCH | `/books/:id` | LIBRARIAN |
| DELETE | `/books/:id` | LIBRARIAN |

## Stage 7: Add Authentication

Create or complete the files under [api/src/auth/](api/src/auth/).

Create these pieces:

- `auth.module.ts`
- `auth.controller.ts`
- `auth.service.ts`
- `roles.guard.ts`
- `jwt-auth.guard.ts`
- `jwt.strategy.ts`
- `roles.decorator.ts`
- authentication DTOs

The endpoints should be:

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/auth/register` | Create a PATRON account |
| POST | `/auth/login` | Verify credentials and return a JWT |

Registration must:

1. Check whether the email is already used.
2. Hash the password with bcrypt and a suitable salt round.
3. Store the original field names that exist in `User`.
4. Return an account-safe response, not the password.

Login must:

1. Find the user by email.
2. Compare the submitted password with the bcrypt hash.
3. Sign a JWT containing at least `sub` and `role`.
4. Return the token and basic user information.

Configure `JWT_SECRET` in `api/.env`. Do not hardcode a production secret.

## Stage 8: Add the JWT and Roles Guards

The JWT strategy should read `JWT_SECRET` and extract the bearer token.

The JWT guard should protect authenticated endpoints.

The roles guard should read the roles placed on the route by `@Roles(...)` and
compare them with `user.role` from the JWT strategy.

Apply:

- `JwtAuthGuard` to protected routes.
- `RolesGuard` after `JwtAuthGuard` to librarian-only routes.
- `Roles(Role.LIBRARIAN)` to catalog mutations.

Nest guard order matters. The JWT guard must run before the roles guard.

## Stage 9: Add the User Profile

Add `GET /users/profile` or `GET /auth/profile`, as supported by your route
design.

The endpoint must:

- Require a valid JWT.
- Read the authenticated user ID from `request.user`.
- Fetch the user with Prisma.
- Never return the password.

This is not an optional shortcut: it verifies that the JWT strategy and
authenticated request flow work end to end.

## Stage 10: Add Tests and Verify

Start by building:

```powershell
cd api
npm run build
npm test
npm run test:e2e
```

Then test routes with Postman or another HTTP client.

For the main success flow:

1. Register a patron.
2. Log in and save the returned token.
3. GET books and genres without a token.
4. Attempt to create a book with no token and confirm rejection.
5. Attempt to create a book as a patron and confirm rejection.
6. Log in as `librarian@library.com`.
7. Create, update, and delete a book as librarian.
8. Query `/books` with page, limit, genre, and search parameters.
9. Call the authenticated profile endpoint.

## Assignment Checklist

- [ ] PostgreSQL database and environment configured
- [ ] Prisma generated
- [ ] Migration created
- [ ] Four genres and sixteen books seeded
- [ ] Librarian account seeded
- [ ] Prisma provider registered
- [ ] Create and update DTO validation added
- [ ] Full genre CRUD implemented
- [ ] Full book CRUD implemented
- [ ] Book genre/search/pagination query implemented
- [ ] Registration endpoint implemented
- [ ] Login endpoint implemented
- [ ] bcrypt used for passwords
- [ ] JWT strategy and guard implemented
- [ ] Roles guard implemented
- [ ] Librarian mutations protected
- [ ] Authenticated profile endpoint implemented
- [ ] Optional login rate limiting implemented
- [ ] Unit and e2e tests pass

## Current File-by-File Notes

- [api/prisma/schema.prisma](api/prisma/schema.prisma): current database models
- [api/prisma/seed.ts](api/prisma/seed.ts): catalog seed and incomplete librarian seed
- [api/src/prisma/prisma.service.ts](api/src/prisma/prisma.service.ts): Prisma lifecycle
- [api/src/app.module.ts](api/src/app.module.ts): application wiring
- [api/src/main.ts](api/src/main.ts): global validation pipe
- [api/src/books/dto/create-book.dto.ts](api/src/books/dto/create-book.dto.ts): partial book input validation
- [api/src/books/dto/books.controller.ts](api/src/books/dto/books.controller.ts): partial book controller
- [api/src/books/books.service.ts](api/src/books/books.service.ts): partial book database operations
- [api/src/genres/](api/src/genres/): feature files exist but need implementation
- [api/src/auth/](api/src/auth/): auth file locations

## Schema Decisions

Each `Book` stores a `genreId` foreign key and relates to a normalized `Genre`
row. A genre can have many books, while each book has one genre. This keeps
genre names consistent and lets the database enforce valid foreign keys.

The `User` model stores `email` and `password`, and assigns a `Role` enum with
`PATRON` as the default and `LIBRARIAN` available for catalog staff. The `Genre`
model uses a unique `slug` for stable URL-safe lookup.
