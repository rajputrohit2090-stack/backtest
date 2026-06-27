export type StrategyGraph = { nodes: unknown[]; edges: unknown[]; version: number };
export type StrategyRecord = { id: string; name: string; description?: string | null; graph: StrategyGraph; updatedAt: string };
export const STRATEGY_GRAPH_VERSION = 1;
