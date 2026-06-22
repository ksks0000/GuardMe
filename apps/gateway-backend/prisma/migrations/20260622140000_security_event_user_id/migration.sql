-- Security events: add owning user column.
-- Existing rows are discarded — events are scoped by user_id only from here on.

TRUNCATE TABLE "security_events";

ALTER TABLE "security_events" ADD COLUMN "user_id" UUID;

CREATE INDEX "security_events_user_id_created_at_idx"
  ON "security_events"("user_id", "created_at");

ALTER TABLE "security_events" ADD CONSTRAINT "security_events_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
