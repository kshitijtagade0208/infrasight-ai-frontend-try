/**
 * API configuration for InfraSight AI
 * Uses NEXT_PUBLIC_API_URL environment variable with fallback to deployed FastAPI backend.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') ||
  'https://infrasight-backend-zjjz.onrender.com';
