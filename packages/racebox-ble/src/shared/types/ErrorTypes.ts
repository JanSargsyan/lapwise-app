// Error types used across the application
export interface BaseError {
  message: string;
  code?: string;
  timestamp: Date;
  context?: any;
}

export interface ValidationError extends BaseError {
  field: string;
  value: any;
  rule: string;
}

export interface NetworkError extends BaseError {
  url?: string;
  statusCode?: number;
  response?: any;
}

export interface TimeoutError extends BaseError {
  timeoutMs: number;
  operation: string;
} 