# Optional Postgres (production)

Local V1 uses SQLite (`file:./dev.db`) so you can run without Docker.

For production Postgres:

1. Start Postgres and create a database `juvantage`.
2. Set in `apps/api/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/juvantage"
```

3. Change `apps/api/prisma/schema.prisma` datasource provider to `postgresql`.
4. Run:

```bash
npm run db:generate -w @juvantage/api
npm run db:push -w @juvantage/api
npm run db:seed -w @juvantage/api
```

Example Compose file:

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: juvantage
      POSTGRES_PASSWORD: juvantage
      POSTGRES_DB: juvantage
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```
