// Export all API modules
export { authAPI } from './authAPI';
export { vehiclesAPI } from './vehiclesAPI';
export { ordersAPI } from './ordersAPI';
export { quotesAPI } from './quotesAPI';
export { customersAPI } from './customersAPI';
export { promotionsAPI } from './promotionsAPI';
export { dealersAPI } from './dealersAPI';
export { usersAPI } from './usersAPI';
export { paymentsAPI } from './paymentsAPI';
export { contractsAPI } from './contractsAPI';
export { installmentsAPI } from './installmentsAPI';
export { default as auditLogsAPI } from './auditLogsAPI';
export { inventoryAPI } from './inventoryAPI';

// Export utilities
export { handleAPIError, API_BASE_URL, apiClient } from '../apiConfig';
