import { ErrorHandlerPort, RecoveryStrategy } from '../../../ports/secondary/ErrorHandlerPort';
import { RaceBoxError, ConnectionError, ProtocolError, DeviceError, ConfigurationError, TimeoutError } from '../../../domain/types/RaceBoxError';

export class RaceBoxErrorHandlerAdapter implements ErrorHandlerPort {
  // Error handling
  handleConnectionError(error: any): RaceBoxError {
    const connectionError: ConnectionError = {
      type: 'connection',
      message: error?.message || 'Connection error occurred',
      code: error?.code || 'CONNECTION_ERROR',
      timestamp: new Date(),
      recoverable: this.isConnectionErrorRecoverable(error),
      details: {
        deviceId: error?.deviceId,
        connectionState: error?.connectionState,
        retryCount: error?.retryCount || 0
      }
    };

    this.logError(connectionError);
    return connectionError;
  }

  handleProtocolError(error: any): RaceBoxError {
    const protocolError: ProtocolError = {
      type: 'protocol',
      message: error?.message || 'Protocol error occurred',
      code: error?.code || 'PROTOCOL_ERROR',
      timestamp: new Date(),
      recoverable: this.isProtocolErrorRecoverable(error),
      details: {
        packetData: error?.packetData,
        expectedChecksum: error?.expectedChecksum,
        actualChecksum: error?.actualChecksum,
        messageType: error?.messageType
      }
    };

    this.logError(protocolError);
    return protocolError;
  }

  handleDeviceError(error: any): RaceBoxError {
    const deviceError: DeviceError = {
      type: 'device',
      message: error?.message || 'Device error occurred',
      code: error?.code || 'DEVICE_ERROR',
      timestamp: new Date(),
      recoverable: this.isDeviceErrorRecoverable(error),
      details: {
        command: error?.command,
        response: error?.response,
        deviceCapabilities: error?.deviceCapabilities
      }
    };

    this.logError(deviceError);
    return deviceError;
  }

  handleTimeoutError(error: any): RaceBoxError {
    const timeoutError: TimeoutError = {
      type: 'timeout',
      message: error?.message || 'Timeout error occurred',
      code: error?.code || 'TIMEOUT_ERROR',
      timestamp: new Date(),
      recoverable: this.isTimeoutErrorRecoverable(error),
      details: {
        operation: error?.operation,
        timeoutMs: error?.timeoutMs,
        retryCount: error?.retryCount || 0
      }
    };

    this.logError(timeoutError);
    return timeoutError;
  }

  // Error classification
  isRecoverable(error: RaceBoxError): boolean {
    return error.recoverable;
  }

  getRecoveryStrategy(error: RaceBoxError): RecoveryStrategy {
    switch (error.type) {
      case 'connection':
        return this.getConnectionRecoveryStrategy(error as ConnectionError);
      case 'protocol':
        return this.getProtocolRecoveryStrategy(error as ProtocolError);
      case 'device':
        return this.getDeviceRecoveryStrategy(error as DeviceError);
      case 'timeout':
        return this.getTimeoutRecoveryStrategy(error as TimeoutError);
      case 'configuration':
        return this.getConfigurationRecoveryStrategy(error as ConfigurationError);
      default:
        return {
          type: 'ignore',
          maxAttempts: 0,
          delayMs: 0,
          backoffMultiplier: 1
        };
    }
  }

  // Error transformation
  transformBLEError(bleError: any): RaceBoxError {
    if (this.isConnectionError(bleError)) {
      return this.handleConnectionError(bleError);
    } else if (this.isTimeoutError(bleError)) {
      return this.handleTimeoutError(bleError);
    } else {
      return this.handleDeviceError(bleError);
    }
  }

  transformProtocolError(protocolError: any): RaceBoxError {
    return this.handleProtocolError(protocolError);
  }

  transformDeviceError(deviceError: any): RaceBoxError {
    return this.handleDeviceError(deviceError);
  }

  // Error logging
  logError(error: RaceBoxError): void {
    console.error(`[RaceBox Error] ${error.type.toUpperCase()}: ${error.message}`, {
      code: error.code,
      timestamp: error.timestamp,
      recoverable: error.recoverable,
      details: error.details
    });
  }

  logErrorWithContext(error: RaceBoxError, context: any): void {
    console.error(`[RaceBox Error] ${error.type.toUpperCase()}: ${error.message}`, {
      code: error.code,
      timestamp: error.timestamp,
      recoverable: error.recoverable,
      details: error.details,
      context
    });
  }

  // Utility methods
  createError(type: RaceBoxError['type'], message: string, details?: any): RaceBoxError {
    const baseError: RaceBoxError = {
      type,
      message,
      timestamp: new Date(),
      recoverable: true,
      details
    };

    switch (type) {
      case 'connection':
        return { ...baseError, type: 'connection' } as ConnectionError;
      case 'protocol':
        return { ...baseError, type: 'protocol' } as ProtocolError;
      case 'device':
        return { ...baseError, type: 'device' } as DeviceError;
      case 'configuration':
        return { ...baseError, type: 'configuration' } as ConfigurationError;
      case 'timeout':
        return { ...baseError, type: 'timeout' } as TimeoutError;
      default:
        return baseError;
    }
  }

  isTimeoutError(error: any): boolean {
    return error?.type === 'timeout' || 
           error?.code?.includes('TIMEOUT') || 
           error?.message?.toLowerCase().includes('timeout');
  }

  isConnectionError(error: any): boolean {
    return error?.type === 'connection' || 
           error?.code?.includes('CONNECTION') || 
           error?.message?.toLowerCase().includes('connection');
  }

  // Private helper methods
  private isConnectionErrorRecoverable(error: any): boolean {
    const nonRecoverableCodes = ['DEVICE_NOT_FOUND', 'BLUETOOTH_DISABLED', 'PERMISSION_DENIED'];
    return !nonRecoverableCodes.includes(error?.code);
  }

  private isProtocolErrorRecoverable(error: any): boolean {
    const nonRecoverableCodes = ['INVALID_PACKET_FORMAT', 'UNSUPPORTED_MESSAGE_TYPE'];
    return !nonRecoverableCodes.includes(error?.code);
  }

  private isDeviceErrorRecoverable(error: any): boolean {
    const nonRecoverableCodes = ['DEVICE_NOT_SUPPORTED', 'FIRMWARE_INCOMPATIBLE'];
    return !nonRecoverableCodes.includes(error?.code);
  }

  private isTimeoutErrorRecoverable(error: any): boolean {
    const retryCount = error?.retryCount || 0;
    return retryCount < 3; // Allow up to 3 retries
  }

  private getConnectionRecoveryStrategy(error: ConnectionError): RecoveryStrategy {
    const retryCount = error.details?.retryCount || 0;
    
    if (retryCount >= 3) {
      return {
        type: 'reconnect',
        maxAttempts: 1,
        delayMs: 5000,
        backoffMultiplier: 2
      };
    }

    return {
      type: 'retry',
      maxAttempts: 3 - retryCount,
      delayMs: 1000 * Math.pow(2, retryCount), // Exponential backoff
      backoffMultiplier: 2
    };
  }

  private getProtocolRecoveryStrategy(error: ProtocolError): RecoveryStrategy {
    return {
      type: 'retry',
      maxAttempts: 2,
      delayMs: 1000,
      backoffMultiplier: 1.5
    };
  }

  private getDeviceRecoveryStrategy(error: DeviceError): RecoveryStrategy {
    return {
      type: 'reset',
      maxAttempts: 1,
      delayMs: 2000,
      backoffMultiplier: 1
    };
  }

  private getTimeoutRecoveryStrategy(error: TimeoutError): RecoveryStrategy {
    const retryCount = error.details?.retryCount || 0;
    
    if (retryCount >= 3) {
      return {
        type: 'ignore',
        maxAttempts: 0,
        delayMs: 0,
        backoffMultiplier: 1
      };
    }

    return {
      type: 'retry',
      maxAttempts: 3 - retryCount,
      delayMs: 2000 * Math.pow(2, retryCount), // Exponential backoff
      backoffMultiplier: 2
    };
  }

  private getConfigurationRecoveryStrategy(error: ConfigurationError): RecoveryStrategy {
    return {
      type: 'ignore',
      maxAttempts: 0,
      delayMs: 0,
      backoffMultiplier: 1
    };
  }
} 