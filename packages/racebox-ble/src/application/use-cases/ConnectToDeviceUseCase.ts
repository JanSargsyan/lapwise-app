import { BLEDevicePort } from '../../ports/secondary/BLEDevicePort';
import { ErrorHandlerPort } from '../../ports/secondary/ErrorHandlerPort';
import { RaceBoxError } from '../../domain/types/RaceBoxError';

export interface ConnectToDeviceRequest {
  deviceId: string;
  timeoutMs?: number;
  retryAttempts?: number;
}

export interface ConnectToDeviceResponse {
  success: boolean;
  deviceId: string;
  deviceName: string;
  signalStrength: number;
  error?: RaceBoxError;
}

export class ConnectToDeviceUseCase {
  constructor(
    private readonly bleDevice: BLEDevicePort,
    private readonly errorHandler: ErrorHandlerPort
  ) {}

  async execute(request: ConnectToDeviceRequest): Promise<ConnectToDeviceResponse> {
    const { deviceId, timeoutMs = 10000, retryAttempts = 3 } = request;
    let lastError: RaceBoxError | undefined;

    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        // Attempt to connect
        await this.bleDevice.connect(deviceId);
        
        // Get device info after successful connection
        const deviceInfo = await this.bleDevice.getDeviceInfo();
        
        return {
          success: true,
          deviceId: deviceInfo.id,
          deviceName: deviceInfo.name,
          signalStrength: deviceInfo.rssi
        };
      } catch (error) {
        lastError = this.errorHandler.handleConnectionError({
          message: error instanceof Error ? error.message : 'Connection failed',
          code: (error as any)?.code || 'CONNECTION_FAILED',
          deviceId,
          retryCount: attempt
        });

        // If this is the last attempt, return error response
        if (attempt === retryAttempts) {
          return {
            success: false,
            deviceId,
            deviceName: '',
            signalStrength: 0,
            error: lastError
          };
        }

        // Wait before retrying (exponential backoff)
        const delay = timeoutMs * Math.pow(2, attempt);
        await this.delay(delay);
      }
    }

    // This should never be reached, but TypeScript requires it
    return {
      success: false,
      deviceId,
      deviceName: '',
      signalStrength: 0,
      error: lastError
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 