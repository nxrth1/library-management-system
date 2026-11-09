# Library Management System

The catalog data layer uses Prisma with PostgreSQL. Copy `api/.env.example` to
`api/.env` (or set `DATABASE_URL` in the shell) with your database connection
string, then run:

```sh
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
```

The seed is repeatable: it upserts four genres and sixteen books using their
unique names and ISBNs.

## Schema Decisions

Each `Book` stores a `genreId` foreign key and relates to a normalized `Genre`
row instead of embedding genre data. This avoids repeating genre names across
books, allows genres to be maintained consistently, and lets the database
enforce that every book points to an existing genre. A genre can have many
books, while each book has one genre.

Prisma makes this relationship explicit in the schema: the scalar `genreId`
stores the foreign key and the `genre` relation enables typed relational
queries. Compared with a document database, related genre data is modeled and
queried as a separate entity rather than duplicated inside each book document.

## User Roles

The `User` model assigns users a `Role` enum, with `PATRON` as the default and
`LIBRARIAN` available for catalog staff.
