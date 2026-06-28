CREATE TABLE "ai_strategy_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "userLanguage" TEXT NOT NULL,
    "symbol" TEXT,
    "timeframe" TEXT,
    "indicators" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rules" JSONB NOT NULL,
    "generatedMql5" TEXT,
    "mq5FilePath" TEXT,
    "ex5FilePath" TEXT,
    "compileMessage" TEXT,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "searchText" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_strategy_templates_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ai_strategy_steps" (
    "id" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "stepKey" TEXT NOT NULL,
    "stepValue" JSONB NOT NULL,
    "question" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_strategy_steps_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ai_strategy_templates_symbol_idx" ON "ai_strategy_templates"("symbol");
CREATE INDEX "ai_strategy_templates_timeframe_idx" ON "ai_strategy_templates"("timeframe");
CREATE INDEX "ai_strategy_steps_strategyId_idx" ON "ai_strategy_steps"("strategyId");
ALTER TABLE "ai_strategy_steps" ADD CONSTRAINT "ai_strategy_steps_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "ai_strategy_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_strategy_templates" ADD CONSTRAINT "ai_strategy_templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
