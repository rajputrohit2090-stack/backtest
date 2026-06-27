export interface HealthResponse {
  status: 'ok';
  service: string;
  version: string;
  timestamp: string;
  dependencies?: Record<string, 'ok' | 'degraded'>;
}
