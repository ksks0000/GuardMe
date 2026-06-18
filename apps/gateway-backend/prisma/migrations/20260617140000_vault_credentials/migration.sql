-- Vault: per-user KDF salt + encrypted credentials table

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kdf_salt" TEXT;

UPDATE "users"
SET "kdf_salt" = encode(gen_random_bytes(32), 'base64')
WHERE "kdf_salt" IS NULL;

ALTER TABLE "users" ALTER COLUMN "kdf_salt" SET NOT NULL;

CREATE TABLE IF NOT EXISTS "vault_credentials" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "service_name" VARCHAR(120) NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "encrypted_password" TEXT NOT NULL,
    "iv" VARCHAR(32) NOT NULL,
    "auth_tag" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vault_credentials_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "vault_credentials_user_id_idx" ON "vault_credentials"("user_id");
CREATE INDEX IF NOT EXISTS "vault_credentials_user_id_service_name_idx" ON "vault_credentials"("user_id", "service_name");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vault_credentials_user_id_fkey'
  ) THEN
    ALTER TABLE "vault_credentials" ADD CONSTRAINT "vault_credentials_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
