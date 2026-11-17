# Library Management System: Baby Steps Guide

This guide teaches you how to complete the project yourself. It explains the
role of each NestJS file and gives small examples of the shape to use.

The examples are patterns, not finished solutions. Read them, explain each
part in your own words, and adapt them to the names and fields already used
in this repository.

## The Goal

Build a working library API with:

- Prisma and PostgreSQL
- Genre and book CRUD
- Filtering and pagination
- Input validation
- bcrypt password storage
- JWT login
- Librarian-only routes
- An authenticated user profile

You do not need to implement everything in one sitting. Complete each
checkpoint before moving to the next stage.

## Your Mental Model

Think of the API as a restaurant:

- **Controller**: takes the customer's request and decides which action to call.
- **Service**: performs the real work and talks to Prisma.
- **DTO**: describes and validates incoming request data.
- **Module**: tells NestJS which controllers and providers belong together.
- **Guard**: decides whether a request may continue.
- **Strategy**: explains how NestJS should read and verify a JWT.

The normal flow is:

```text
HTTP request
  -> guard, if the route is protected
  -> validation pipe
  -> controller
  -> service
  -> Prisma
  -> database
  -> service
  -> controller
  -> HTTP response
```

Keep database logic out of controllers.

---

# 1. Set Up the Environment

## 1.1 Learn the Current Files

Open these files and identify what each one is:

- [api/prisma/schema.prisma](api/prisma/schema.prisma): database schema
- [api/prisma/seed.ts](api/prisma/seed.ts): data that creates the initial database rows
- [api/src/app.module.ts](api/src/app.module.ts): main NestJS module
- [api/src/main.ts](api/src/main.ts): application startup and global pipes
- [api/src/prisma/prisma.service.ts](api/src/prisma/prisma.service.ts): Prisma database connection

Do not edit an unknown file yet. First read the existing code and say aloud
what you think each line does.

## 1.2 Configure PostgreSQL

1. Copy [api/.env.example](api/.env.example) to `api/.env`.
2. Replace the placeholder database URL.
3. Leave `JWT_SECRET` as an environment variable you will add later.
4. Never commit `api/.env`.

Example shape only:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/library"
JWT_SECRET="use-a-long-random-local-secret"
```

## 1.3 Install and Generate

From the repository root:

```powershell
npm install
cd api
npm install
cd ..
```

Generate the Prisma client and create the migration:

```powershell
npm run prisma:generate
npm run prisma:migrate -- --name init
```

### Checkpoint

Stop here and confirm:

- PostgreSQL is running.
- `DATABASE_URL` is valid.
- Prisma generated successfully.
- No migration error remains.

---

# 2. Understand the Database Model

Open [api/prisma/schema.prisma](api/prisma/schema.prisma).

## 2.1 Read a Model

A Prisma model describes a database table:

```prisma
model Example {
  id   Int    @id @default(autoincrement())
  name String
}
```

Reading that as plain English:

- `Example` is a table.
- `id` is an integer primary key.
- `id` is automatically generated.
- `name` is a required string.

## 2.2 Understand the Current Relationships

The project currently has:

- `User`
- `Genre`
- `Book`
- `Role`

Notice that:

- A genre can contain many books.
- A book belongs to one genre.
- `Book.genreId` stores the genre foreign key.
- `Book.genre` describes the Prisma relationship.
- `User.role` uses `PATRON` or `LIBRARIAN`.

When asked for a book, Prisma can use `include: { genre: true }` to include
the related genre. This is an adaptation pattern, not a command to blindly
copy:

```ts
this.prisma.book.findMany({
  include: {
    genre: true,
  },
});
```

## 2.3 Seed the Existing Data

Open [api/prisma/seed.ts](api/prisma/seed.ts).

The seed currently:

- Creates or updates four genres.
- Creates or updates sixteen books.
- Contains partial code for a librarian user.

Before running it, read the `User` model and make sure the seed names only
fields that exist in that model.

The seed should:

- Import `Role` from `@prisma/client`.
- Hash `Librarian123!` with bcrypt.
- Use `password`, unless your schema is deliberately changed to use another field.
- Create or update `librarian@library.com`.
- Assign `Role.LIBRARIAN`.

A small upsert pattern looks like this:

```ts
await prisma.example.upsert({
  where: { uniqueField: 'known-value' },
  update: { role: 'AN_EXAMPLE_ROLE' },
  create: {
    uniqueField: 'known-value',
    role: 'AN_EXAMPLE_ROLE',
  },
});
```

Adapt that pattern, and do not add fields the schema does not contain.

Run the seed:

```powershell
npm run prisma:seed
```

### Checkpoint

The seed should finish with no TypeScript or Prisma errors. Check whether the
database contains the four genres and sixteen books. A librarian account should
also exist.

---

# 3. Connect Prisma to NestJS

Open [api/src/prisma/prisma.service.ts](api/src/prisma/prisma.service.ts).

## 3.1 What This File Is

This file is a **service**.

It creates and manages one Prisma database connection. Nest can inject this
service into another service.

A small service pattern:

```ts
@Injectable()
export class ExampleService {
  constructor(private readonly prisma: PrismaService) {}
}
```

This tells Nest:

- `ExampleService` is a provider.
- Nest should create a `PrismaService`.
- The created Prisma service should be placed in the `prisma` variable.

## 3.2 Register the Provider

Open [api/src/app.module.ts](api/src/app.module.ts).

A module is similar to a map that tells Nest which classes belong in the
application. The provider list includes services and sometimes other injectable
classes.

A small module pattern:

```ts
@Module({
  providers: [ExampleService, PrismaService],
  exports: [ExampleService],
})
export class ExampleModule {}
```

You must decide whether `PrismaService` belongs in a dedicated Prisma module or
in `AppModule`. The key rule is: the module using the service must be able to
inject it.

## 3.3 Why PrismaService Extends PrismaClient

The current file extends PrismaClient. That gives the service access to fields
such as:

```ts
this.prisma.user
this.prisma.genre
this.prisma.book
```

Each name must match a model in `schema.prisma`.

### Checkpoint

The app should start far enough for Nest to resolve all providers. If Nest
reports a dependency error, first find the missing provider or module export.

---

# 4. Learn DTOs and Validation

Open [api/src/books/dto/create-book.dto.ts](api/src/books/dto/create-book.dto.ts).

## 4.1 What Is a DTO?

A DTO means **Data Transfer Object**.

It describes what a request body should look like. It is not a database model
and is not usually used as a direct database result.

Example teaching pattern:

```ts
export class ExampleDto {
  name: string;
  count: number;
}
```

This gives TypeScript knowledge of the incoming fields.

## 4.2 Add Runtime Validation

TypeScript types do not check incoming JSON at runtime. A DTO decorator does:

```ts
@IsString()
name: string;

@IsInt()
@Min(1)
count: number;
```

Read this as:

- `name` must be a string.
- `count` must be an integer.
- `count` must be at least `1`.

Create or complete a book DTO with fields that match the Book model:

- `title`
- `author`
- `isbn`
- `description`
- `coverImage`
- `totalCopies`
- `genreId`

For `coverImage`, decide whether it is optional by using `@IsOptional()`.

## 4.3 Create vs Update DTO

Creation usually requires every field.

Updating may allow one field or several fields to change. One learning pattern
is to create `UpdateBookDto` that extends `PartialType(CreateBookDto)`.

This teaches a useful NestJS pattern, but understand it before using it:
`PartialType` makes the base class fields optional.

## 4.4 Understand the Global Pipe

Open [api/src/main.ts](api/src/main.ts).

It enables a global `ValidationPipe`:

- `whitelist: true` removes fields not declared in the DTO.
- `forbidNonWhitelisted: true` rejects unknown fields.
- `transform: true` converts valid incoming values to the DTO shape.

### Checkpoint

Test by reasoning through these cases:

- Missing title: rejected.
- Title that is a number: rejected.
- `totalCopies: 0`: rejected.
- Unknown property: rejected.
- Valid title and author: accepted.

---

# 5. Build a Feature in the Nest Pattern

Build Genre first because it is simpler than Authentication.

Files to work on:

- [api/src/genres/genres.controller.ts](api/src/genres/genres.controller.ts)
- [api/src/genres/genres.service.ts](api/src/genres/genres.service.ts)
- [api/src/genres/genres.module.ts](api/src/genres/genres.module.ts)

## 5.1 What a Controller Looks Like

A controller owns the HTTP method and URL.

Small teaching pattern:

```ts
@Controller('examples')
export class ExamplesController {
  constructor(private readonly examplesService: ExamplesService) {}

  @Get()
  findAll() {
    return this.examplesService.findAll();
  }

  @Post()
  create(@Body() dto: CreateExampleDto) {
    return this.examplesService.create(dto);
  }
}
```

Reading the pattern:

- `@Controller('examples')` adds `/examples`.
- `@Get()` handles `GET /examples`.
- `@Post()` handles `POST /examples`.
- `@Body()` gives the controller the request body.
- The controller calls the service.

The controller should not contain Prisma queries.

## 5.2 What a Service Looks Like

A service owns the behavior and database operations.

Small teaching pattern:

```ts
@Injectable()
export class ExamplesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.example.findMany();
  }

  create(dto: CreateExampleDto) {
    return this.prisma.example.create({
      data: dto,
    });
  }
}
```

Reading the pattern:

- `@Injectable()` makes the service injectable.
- The constructor receives Prisma.
- `findAll` returns all example rows.
- `create` sends DTO data to Prisma.
- The service is not deciding the HTTP URL.

For your Genre service, adapt this pattern to `prisma.genre`.

## 5.3 Expected Genre Operations

Implement and understand these behaviors:

| HTTP behavior | Service method | Prisma idea |
| --- | --- | --- |
| Read all genres | `findAll` | `findMany()` |
| Read one genre | `findOne` | `findUnique()` |
| Create genre | `create` | `create()` |
| Update genre | `update` | `update()` |
| Delete genre | `remove` | `delete()` |

Before returning a missing row, check whether it exists. A useful Nest exception
is `NotFoundException`.

Example shape for finding a missing row:

```ts
const item = await this.prisma.example.findUnique({
  where: { id },
});

if (!item) {
  throw new NotFoundException('Example not found');
}

return item;
```

Adapt `id` and the model name to genres.

## 5.4 Wire the Genre Module

A feature module pattern:

```ts
@Module({
  imports: [PrismaModule],
  controllers: [ExamplesController],
  providers: [ExamplesService],
})
export class ExamplesModule {}
```

Then import `GenresModule` in [api/src/app.module.ts](api/src/app.module.ts).

### Genre Routes

| Method | Route | Intended access |
| --- | --- | --- |
| GET | `/genres` | Public |
| GET | `/genres/:id` | Public |
| POST | `/genres` | Librarian |
| PATCH | `/genres/:id` | Librarian |
| DELETE | `/genres/:id` | Librarian |

Do not protect routes until the authentication stage is working.

### Checkpoint

You should be able to explain:

- Why a controller method has no Prisma query.
- Why a service has no HTTP decorator.
- Why `GenresModule` must be imported.
- What happens when `findOne` receives an unknown ID.

---

# 6. Build the Books Feature

Work on:

- [api/src/books/dto/books.controller.ts](api/src/books/dto/books.controller.ts)
- [api/src/books/books.service.ts](api/src/books/books.service.ts)
- [api/src/books/dto/create-book.dto.ts](api/src/books/dto/create-book.dto.ts)

The existing files are incomplete. First add missing imports. You can tell a
file is missing an import when Nest decorators or Prisma types are not defined.

## 6.1 Complete the Controller

Controller methods you need:

| Method | Route | Input |
| --- | --- | --- |
| `findAll` | `GET /books` | Query values |
| `findOne` | `GET /books/:id` | URL ID |
| `create` | `POST /books` | Validated body |
| `update` | `PATCH /books/:id` | URL ID plus validated body |
| `remove` | `DELETE /books/:id` | URL ID |

Query parameter pattern:

```ts
@Get()
findAll(
  @Query('search') search?: string,
  @Query('page') page?: string,
) {
  return this.examplesService.findAll(search, page);
}
```

URL parameter pattern:

```ts
@Get(':id')
findOne(@Param('id') id: string) {
  return this.examplesService.findOne(Number(id));
}
```

## 6.2 Complete the Service

A Prisma query can combine:

- A `where` condition.
- A `skip` offset.
- A `take` limit.
- A `include` relation.

Understand this shape before editing:

```ts
this.prisma.example.findMany({
  where: {
    name: {
      contains: 'searched text',
      mode: 'insensitive',
    },
  },
  skip: 0,
  take: 10,
  include: {
    relation: true,
  },
});
```

For a title or author search, adapt to both fields using Prisma's `OR`:

```ts
where: {
  OR: [
    { title: { contains: search, mode: 'insensitive' } },
    { author: { contains: search, mode: 'insensitive' } },
  ],
}
```

Do not add this pattern if `search` is absent.

## 6.3 Add Pagination Carefully

If the user asks for page `2` and limit `10`, the database offset is:

```text
skip = (page - 1) * limit
take = limit
```

Convert incoming strings to numbers before calculating. Decide sensible defaults:

- default page: `1`
- default limit: `10`

Validate or normalize invalid values instead of passing negative values to
Prisma.

## 6.4 Filtering by Genre

The `genreId` query is a string in the HTTP request. Prisma fields need the
numeric form:

```ts
const numericGenreId = Number(genreId);
```

Before using it, decide whether it is a valid positive integer.

### Book Checkpoint

Test the behavior of `GET /books` without a database by tracing the code:

- No query values: all books, page 1, limit 10.
- `genreId=2`: where genre ID equals 2.
- `search=moon`: OR search title and author.
- `page=3&limit=5`: skip 10, take 5.

---

# 7. Build Authentication

Create or complete these files under [api/src/auth/](api/src/auth/):

- `auth.module.ts`
- `auth.controller.ts`
- `auth.service.ts`
- `jwt-auth.guard.ts`
- `jwt.strategy.ts`
- `roles.guard.ts`
- `roles.decorator.ts`
- Register and login DTO files

Authentication means proving who the caller is.

Authorization means deciding what that caller may do.

## 7.1 Registration DTO

Create a DTO that describes account registration.

Example teaching shape:

```ts
export class RegisterExampleDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

Adapt the email and password rules to the library API.

## 7.2 Registration Flow

When `POST /auth/register` is called:

1. ValidationPipe checks the DTO.
2. AuthService searches for an existing email.
3. If the email exists, return a conflict response.
4. bcrypt hashes the submitted password.
5. Prisma creates a user with `PATRON` as the role.
6. The response excludes the password.

A service can search before creating:

```ts
const existing = await this.prisma.user.findUnique({
  where: { email: dto.email },
});
```

Do not treat a user object containing the password as a safe response.

## 7.3 Hashing

Hashing converts a password into a stored bcrypt string.

Understand:

- `bcrypt.hash(password, 10)` creates a hash.
- Higher salt rounds are slower and stronger.
- Never store the original password.
- Never attempt to decrypt a password hash.
- Login compares the submitted password with the stored hash.

The login comparison shape is:

```ts
const passwordMatches = await bcrypt.compare(
  submittedPassword,
  storedPasswordHash,
);
```

## 7.4 Login Flow

When `POST /auth/login` is called:

1. Find the user by email.
2. If there is no user, reject credentials.
3. Compare the submitted password with `user.password`.
4. If it does not match, reject credentials.
5. Sign a JWT containing `sub` and `role`.
6. Return the token and safe user fields.

A JWT payload is typically shaped like:

```ts
const payload = {
  sub: user.id,
  role: user.role,
};
```

`sub` means subject or identity.

## 7.5 JWT Service Pattern

Small injection pattern:

```ts
@Injectable()
export class ExampleAuthService {
  constructor(
    private readonly jwtService: JwtService,
  ) {}

  createToken(payload: object) {
    return this.jwtService.sign(payload);
  }
}
```

Configure the secret through environment variables.

### Authentication Checkpoint

Trace two possible registrations:

- New patron email: bcrypt hash created, PATRON stored, safe response returned.
- Existing patron email: no duplicate account created.

Trace two possible logins:

- Correct password: JWT returned.
- Wrong password or unknown email: credentials rejected.

---

# 8. Understand JWT Guards and Strategies

## 8.1 What a Strategy Is

Open [api/src/auth/jwt.strategy.ts](api/src/auth/jwt.strategy.ts).

A Passport JWT strategy:

- Reads the bearer token.
- Verifies the token signature.
- Returns the data that should become `request.user`.

Small conceptual shape:

```ts
@Injectable()
export class ExampleJwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  validate(payload: { sub: number; role: string }) {
    return {
      userId: payload.sub,
      role: payload.role,
    };
  }
}
```

This is a pattern. Read the Nest and passport-jwt types before adapting them.

## 8.2 What a Guard Is

Open [api/src/auth/jwt-auth.guard.ts](api/src/auth/jwt-auth.guard.ts).

A guard decides whether Nest continues to the controller.

Your JWT guard should usually extend `AuthGuard('jwt')`.

Applying it:

```ts
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@Req() request: Request) {
  return request.user;
}
```

No valid bearer token means the guard rejects the request before the controller
method runs.

## 8.3 Roles Decorator

Open [api/src/auth/roles.decorator.ts](api/src/auth/roles.decorator.ts).

A decorator attaches metadata to a route:

```ts
export const Roles = (...roles: Role[]) =>
  SetMetadata('roles', roles);
```

At a route:

```ts
@Roles(Role.LIBRARIAN)
```

This says: "this route requires the librarian role."

## 8.4 Roles Guard

Open [api/src/auth/ roles.guard.ts](api/src/auth/%20roles.guard.ts).

The roles guard should:

1. Read the required roles from route metadata.
2. Read `request.user.role`.
3. Allow only a matching role.
4. Reject otherwise.

A guard is authorization, not password or token verification.

It should run after the JWT guard so `request.user` already exists.

Guard pattern:

```ts
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.LIBRARIAN)
@Post()
create() {}
```

Apply both guards to POST, PATCH, and DELETE catalog routes.

### Checkpoint

Explain the difference:

- JWT guard answers: "Do we know who this is?"
- Roles guard answers: "May this identity do this action?"

---

# 9. Add the Authenticated Profile

Create `GET /users/profile` or `GET /auth/profile`.

The endpoint should:

1. Require `JwtAuthGuard`.
2. Read `request.user.userId`, or the field name returned by your strategy.
3. Query the user through Prisma.
4. Return the user without `password`.
5. Return a not-found response if the user no longer exists.

Never return the password in profile JSON.

If Prisma might return a user with a password field, first create a safe object
and exclude it:

```ts
const { password, ...safeUser } = user;
return safeUser;
```

Do not expose this destructuring pattern as database security. It is only
response shaping. Authorization and authentication are handled separately.

---

# 10. Required Route Map

| Method | Route | Guard |
| --- | --- | --- |
| POST | `/auth/register` | None |
| POST | `/auth/login` | None |
| GET | `/auth/profile` | JWT |
| GET | `/genres` | None |
| GET | `/genres/:id` | None |
| POST | `/genres` | JWT + librarian role |
| PATCH | `/genres/:id` | JWT + librarian role |
| DELETE | `/genres/:id` | JWT + librarian role |
| GET | `/books` | None |
| GET | `/books/:id` | None |
| POST | `/books` | JWT + librarian role |
| PATCH | `/books/:id` | JWT + librarian role |
| DELETE | `/books/:id` | JWT + librarian role |

Choose `/users/profile` or `/auth/profile`, but keep the route documented and
use it consistently.

---

# 11. Testing Like a Developer

Run the smallest checks frequently.

From [api/](api/), start with:

```powershell
npm run build
```

Then:

```powershell
npm test
npm run test:e2e
```

If TypeScript reports an unknown import or property:

1. Check the exact filename and import path.
2. Check whether the export is marked `export`.
3. Check whether the method or field exists on your class.
4. Check whether you registered the provider/module.
5. Check the Prisma schema field names.

## Manual HTTP Test Order

1. Register a patron.
2. Login as the patron.
3. GET `/genres` and `/books` without a token.
4. Try to create a genre or book without a token.
5. Try to create a genre or book with the patron token.
6. Login as `librarian@library.com`.
7. Create a genre.
8. Create a book assigned to that genre.
9. Update the book.
10. Delete the book.
11. Call the profile route with the librarian token.

## HTTP Requests to Try

You can write these as Postman requests. Do not blindly copy a response:
observe status, headers, body, and database changes.

- `GET /books`
- `GET /books?page=2&limit=5`
- `GET /books?search=wind`
- `GET /books?genreId=1`
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/profile`
- `POST /books`
- `PATCH /books/:id`
- `DELETE /books/:id`

---

# 12. Debugging Prompts

Before asking for help, answer these questions:

## Is it a route problem?

- Does the controller have `@Controller(...)`?
- Does the method have `@Get`, `@Post`, `@Patch`, or `@Delete`?
- Did you include the exact route prefix?
- Is the HTTP method correct?

## Is it a validation problem?

- Did you add the global `ValidationPipe`?
- Does the DTO field have the correct decorator?
- Is the JSON property spelled exactly like the DTO field?
- Did you require a field that should be optional?

## Is it a Prisma problem?

- Does the model exist in `schema.prisma`?
- Does the field exist in the model?
- Did you run `prisma generate` after schema changes?
- Did you run migrations after schema changes?
- Is `DATABASE_URL` correct?

## Is it a Nest dependency problem?

- Did you add the provider to a module?
- Did you export it if another module needs it?
- Did you import the feature module in `AppModule`?
- Does the constructor parameter have the same type as a provider?

## Is it a JWT problem?

- Is `JWT_SECRET` loaded?
- Did you send `Authorization: Bearer <token>`?
- Does the strategy define the correct secret and token extractor?
- Did the JWT guard run before the controller?

## Is it a role problem?

- Is the JWT guard before the roles guard?
- Does the JWT payload contain `role`?
- Does `validate` return the role on `request.user`?
- Did you apply `@Roles(Role.LIBRARIAN)`?

---

# 13. Assignment Completion Checklist

Stop when every box is true, not merely when the app displays no compile
errors.

- [ ] PostgreSQL environment configured
- [ ] Prisma generated
- [ ] Initial migration created
- [ ] Four genres seed successfully
- [ ] Sixteen books seed successfully
- [ ] Librarian seed account matches the schema
- [ ] Prisma service registered and injectable
- [ ] Create and update book DTO validation complete
- [ ] Genre create, read, update, and delete complete
- [ ] Book create, read, update, and delete complete
- [ ] Book genre filtering complete
- [ ] Book title/author search complete
- [ ] Book page and limit behavior complete
- [ ] Registration creates only PATRON accounts
- [ ] Passwords are hashed with bcrypt
- [ ] Login verifies bcrypt passwords
- [ ] Login returns a JWT
- [ ] JWT strategy reads and verifies the bearer token
- [ ] JWT guard protects profile routes
- [ ] Roles guard protects librarian routes
- [ ] Profile excludes password data
- [ ] Public GET routes work without a token
- [ ] Mutating routes reject no-token and PATRON requests
- [ ] Optional login rate limiting implemented
- [ ] Unit or feature tests added
- [ ] e2e tests pass

## Optional Stretch Task

If you finish the core work, add login rate limiting.

Before implementing it, learn:

- What a Nest interceptor or middleware is.
- How request IP addresses are identified.
- Where a counter should be stored.
- How the app should behave after the limit is reached.
