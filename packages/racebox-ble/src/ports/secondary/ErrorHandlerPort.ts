import { RaceBoxError } from '../../domain/types';

export interface RecoveryStrategy {
  type: 'retry' | 'reconnect' | 'reset' | 'ignore';
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
}

export interface ErrorHandlerPort {
  // Error handling
  handleConnectionError(error: any): RaceBoxError;
  handleProtocolError(error: any): RaceBoxError;
  handleDeviceError(error: any): RaceBoxError;
  handleTimeoutError(error: any): RaceBoxError;
  
  // Error classification
  isRecoverable(error: RaceBoxError): boolean;
  getRecoveryStrategy(error: RaceBoxError): RecoveryStrategy;
  
  // Error transformation
  transformBLEError(bleError: any): RaceBoxError;
  transformProtocolError(protocolError: any): RaceBoxError;
  transformDeviceError(deviceError: any): RaceBoxError;
  
  // Error logging
  logError(error: RaceBoxError): void;
  logErrorWithContext(error: RaceBoxError, context: any): void;
  
  // Utility methods
  createError(type: RaceBoxError['type'], message: string, details?: any): RaceBoxError;
  isTimeoutError(error: any): boolean;
  isConnectionError(error: any): boolean;
} 