import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './infrastructure/outbound/database/migrations',
  schema: './infrastructure/outbound/database/schemas/*',
  dialect: 'postgresql',
  migrations: {
    table: "migration-histories",
    schema: "public",
  },
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
