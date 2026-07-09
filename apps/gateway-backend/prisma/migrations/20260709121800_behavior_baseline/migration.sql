-- CreateTable
CREATE TABLE "behavior_baselines" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "snapshot" JSONB NOT NULL,
    "sample_size" INTEGER NOT NULL,
    "window_days" INTEGER NOT NULL DEFAULT 7,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "behavior_baselines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "behavior_baselines_user_id_key" ON "behavior_baselines"("user_id");

-- AddForeignKey
ALTER TABLE "behavior_baselines" ADD CONSTRAINT "behavior_baselines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
