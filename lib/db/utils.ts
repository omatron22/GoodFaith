// lib/db/utils.ts
import { isValidUUID } from "@/lib/utils";

/**
 * Validate that database IDs are in the correct format
 */
export function validateUUID(id: string, entityName: string = 'entity'): void {
  if (!isValidUUID(id)) {
    throw new Error(`Invalid ${entityName} ID format: ${id}`);
  }
}

/**
 * Validate required fields are present in an object
 */
export function validateRequiredFields<T>(
  obj: Partial<T>, 
  requiredFields: (keyof T)[], 
  entityName: string = 'entity'
): void {
  for (const field of requiredFields) {
    if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
      throw new Error(`Missing required ${String(field)} for ${entityName}`);
    }
  }
}

/**
 * Format database error for consistent logging
 */
export function formatDbError(error: Error & { code?: string }, operation: string): string {
  const errorMessage = error?.message || 'Unknown database error';
  const errorCode = error?.code || 'NO_CODE';
  return `Database ${operation} error [${errorCode}]: ${errorMessage}`;
}

/**
 * Handle common database error scenarios
 */
export function handleDbError(error: Error & { code?: string }, operation: string): never {
  const formattedError = formatDbError(error, operation);
  console.error(formattedError);
  
  // Rethrow with a cleaner message for the client
  throw new Error(`Database operation failed: ${operation}`);
}

/**
 * Create a timestamp for database operations
 */
export function getIsoTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Convert Supabase data response to a consistent format
 */
export function normalizeDbResponse<T>(data: T | null, error: Error & { code?: string }): T {
  if (error) {
    handleDbError(error, 'read');
  }
  
  if (!data) {
    throw new Error('No data returned from database');
  }
  
  return data;
}