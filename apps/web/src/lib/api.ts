import type { StrategyGraph } from '@backtest-ai/shared';
const API_URL=import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
export async function saveStrategy(input:{id?:string;name:string;graph:StrategyGraph}){const response=await fetch(`${API_URL}/strategies${input.id?`/${input.id}`:''}`,{method:input.id?'PUT':'POST',headers:{'content-type':'application/json'},body:JSON.stringify(input)});if(!response.ok)throw new Error('Unable to save strategy');return response.json();}
export async function loadStrategy(id:string){const response=await fetch(`${API_URL}/strategies/${id}`);if(!response.ok)throw new Error('Unable to load strategy');return response.json();}
