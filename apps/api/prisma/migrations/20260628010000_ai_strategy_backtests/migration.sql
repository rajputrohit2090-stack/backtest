CREATE TABLE "ai_strategy_backtests" (
    "id" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "config" JSONB NOT NULL,
    "iniFilePath" TEXT,
    "reportPath" TEXT,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_strategy_backtests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ai_strategy_backtests_strategyId_idx" ON "ai_strategy_backtests"("strategyId");
ALTER TABLE "ai_strategy_backtests" ADD CONSTRAINT "ai_strategy_backtests_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "ai_strategy_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
