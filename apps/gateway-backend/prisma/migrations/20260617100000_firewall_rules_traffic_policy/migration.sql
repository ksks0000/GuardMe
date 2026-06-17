-- Firewall rules + policy_decision / threat_verdict (replaces verdict column)

CREATE TABLE "firewall_rules" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(100),
    "rule_type" VARCHAR(16) NOT NULL,
    "pattern" VARCHAR(253) NOT NULL,
    "action" VARCHAR(16) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "firewall_rules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "firewall_rules_user_id_idx" ON "firewall_rules"("user_id");
CREATE INDEX "firewall_rules_user_id_enabled_idx" ON "firewall_rules"("user_id", "enabled");

ALTER TABLE "firewall_rules" ADD CONSTRAINT "firewall_rules_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "traffic_logs" ADD COLUMN "policy_decision" TEXT NOT NULL DEFAULT 'ALLOW';
ALTER TABLE "traffic_logs" ADD COLUMN "threat_verdict" TEXT;
ALTER TABLE "traffic_logs" ADD COLUMN "matched_rule_id" UUID;

UPDATE "traffic_logs" SET "threat_verdict" = "verdict" WHERE "threat_verdict" IS NULL;
ALTER TABLE "traffic_logs" ALTER COLUMN "threat_verdict" SET NOT NULL;

DROP INDEX IF EXISTS "traffic_logs_verdict_idx";
ALTER TABLE "traffic_logs" DROP COLUMN "verdict";

CREATE INDEX "traffic_logs_policy_decision_idx" ON "traffic_logs"("policy_decision");
CREATE INDEX "traffic_logs_threat_verdict_idx" ON "traffic_logs"("threat_verdict");
