import { MessageFactoryPort } from '../../ports/secondary/MessageFactoryPort';
import { BLEDevicePort } from '../../ports/secondary/BLEDevicePort';
import { ErrorHandlerPort } from '../../ports/secondary/ErrorHandlerPort';
import { GNSSConfiguration } from '../../domain/entities/GNSSConfiguration';
import { RaceBoxError } from '../../domain/types/RaceBoxError';

export interface ConfigureGNSSRequest {
  config: GNSSConfiguration;
  timeoutMs?: number;
  waitForAcknowledgment?: boolean;
}

export interface ConfigureGNSSResponse {
  success: boolean;
  acknowledged: boolean;
  error?: RaceBoxError;
}

export class ConfigureGNSSUseCase {
  constructor(
    private readonly messageFactory: MessageFactoryPort,
    private readonly bleDevice: BLEDevicePort,
    private readonly errorHandler: ErrorHandlerPort
  ) {}

  async execute(request: ConfigureGNSSRequest): Promise<ConfigureGNSSResponse> {
    const { config, timeoutMs = 5000, waitForAcknowledgment = true } = request;

    try {
      // Validate configuration
      this.validateGNSSConfiguration(config);

      // Create and send configuration message
      const message = this.messageFactory.createGNSSConfigSet(config);
      const packet = this.messageFactory.messageToPacket(message);
      await this.bleDevice.sendData(packet);

      // Wait for acknowledgment if requested
      let acknowledged = false;
      if (waitForAcknowledgment) {
        acknowledged = await this.waitForAcknowledgment(timeoutMs);
      }

      return {
        success: true,
        acknowledged
      };
    } catch (error) {
      const raceBoxError = this.errorHandler.handleDeviceError({
        ...error,
        command: 'ConfigureGNSS',
        details: { config }
      });

      return {
        success: false,
        acknowledged: false,
        error: raceBoxError
      };
    }
  }

  private validateGNSSConfiguration(config: GNSSConfiguration): void {
    if (!config.platformModel) {
      throw new Error('Platform model is required');
    }

    if (config.minHorizontalAccuracy < 0) {
      throw new Error('Minimum horizontal accuracy must be non-negative');
    }

    if (config.minHorizontalAccuracy > 100) {
      throw new Error('Minimum horizontal accuracy must be less than 100 meters');
    }
  }

  private async waitForAcknowledgment(timeoutMs: number): Promise<boolean> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, timeoutMs);

      // In a real implementation, this would subscribe to acknowledgment messages
      // For now, we'll assume acknowledgment is received
      setTimeout(() => {
        clearTimeout(timeout);
        resolve(true);
      }, 1000);
    });
  }
} 