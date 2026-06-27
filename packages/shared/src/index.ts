import type { HealthResponse } from '@backtest-ai/types';

export const productName = 'BackTest AI';
export const apiVersion = '0.1.0';

export function createHealthResponse(
  service: string,
  dependencies?: HealthResponse['dependencies'],
): HealthResponse {
  return {
    status: 'ok',
    service,
    version: apiVersion,
    timestamp: new Date().toISOString(),
    dependencies,
  };
}
