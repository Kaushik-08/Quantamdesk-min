-- AlterTable: organizations
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "slug" TEXT;

UPDATE "organizations" SET "slug" = 'acme' WHERE "slug" IS NULL;

ALTER TABLE "organizations" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "organizations_slug_key" ON "organizations"("slug");

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable: users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" TEXT;

UPDATE "users" SET "email" = id || '@demo.local' WHERE "email" IS NULL;

ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- AlterTable: tickets
ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "ticket_number" INTEGER;
ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "priority" "TicketPriority";

UPDATE "tickets"
SET
  "ticket_number" = sub.rn,
  "priority" = 'NORMAL'
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY org_id ORDER BY created_at) + 1000 AS rn
  FROM "tickets"
) AS sub
WHERE "tickets".id = sub.id AND "tickets"."ticket_number" IS NULL;

ALTER TABLE "tickets" ALTER COLUMN "ticket_number" SET NOT NULL;
ALTER TABLE "tickets" ALTER COLUMN "priority" SET NOT NULL;
ALTER TABLE "tickets" ALTER COLUMN "priority" SET DEFAULT 'NORMAL';

CREATE UNIQUE INDEX IF NOT EXISTS "tickets_org_id_ticket_number_key" ON "tickets"("org_id", "ticket_number");
CREATE INDEX IF NOT EXISTS "tickets_priority_idx" ON "tickets"("priority");
