/**
 * Cấu hình tập trung API cho TrustCar Frontend.
 * Vite chỉ expose các biến có prefix VITE_.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
