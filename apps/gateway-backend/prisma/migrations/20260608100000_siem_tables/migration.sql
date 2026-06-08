-- CreateTable
CREATE TABLE "traffic_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "client_ip" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "destination_host" TEXT NOT NULL,
    "destination_port" INTEGER,
    "destination_ip" TEXT,
    "method" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "risk_score" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "traffic_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_events" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "traffic_logs_timestamp_idx" ON "traffic_logs"("timestamp");

-- CreateIndex
CREATE INDEX "traffic_logs_user_id_timestamp_idx" ON "traffic_logs"("user_id", "timestamp");

-- CreateIndex
CREATE INDEX "traffic_logs_verdict_idx" ON "traffic_logs"("verdict");

-- CreateIndex
CREATE INDEX "traffic_logs_risk_score_idx" ON "traffic_logs"("risk_score");

-- CreateIndex
CREATE INDEX "traffic_logs_client_ip_idx" ON "traffic_logs"("client_ip");

-- CreateIndex
CREATE INDEX "traffic_logs_destination_host_idx" ON "traffic_logs"("destination_host");

-- CreateIndex
CREATE INDEX "security_events_created_at_idx" ON "security_events"("created_at");

-- CreateIndex
CREATE INDEX "security_events_type_idx" ON "security_events"("type");

-- CreateIndex
CREATE INDEX "security_events_severity_idx" ON "security_events"("severity");

-- AddForeignKey
ALTER TABLE "traffic_logs" ADD CONSTRAINT "traffic_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
