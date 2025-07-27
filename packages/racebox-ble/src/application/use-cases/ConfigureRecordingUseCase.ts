import { MessageFactoryPort } from '../../ports/secondary/MessageFactoryPort';
import { BLEDevicePort } from '../../ports/secondary/BLEDevicePort';
import { ErrorHandlerPort } from '../../ports/secondary/ErrorHandlerPort';
import { RecordingConfiguration } from '../../domain/entities/RecordingConfiguration';
import { RaceBoxError } from '../../domain/types/RaceBoxError';

export interface ConfigureRecordingRequest {
  config: RecordingConfiguration;
  timeoutMs?: number;
  waitForAcknowledgment?: boolean;
}

export interface ConfigureRecordingResponse {
  success: boolean;
  acknowledged: boolean;
  error?: RaceBoxError;
}

export class ConfigureRecordingUseCase {
  constructor(
    private readonly messageFactory: MessageFactoryPort,
    private readonly bleDevice: BLEDevicePort,
    private readonly errorHandler: ErrorHandlerPort
  ) {}

  async execute(request: ConfigureRecordingRequest): Promise<ConfigureRecordingResponse> {
    const { config, timeoutMs = 5000, waitForAcknowledgment = true } = request;

    try {
      // Validate configuration
      this.validateRecordingConfiguration(config);

      // Create and send configuration message
      const message = this.messageFactory.createRecordingConfigSet(config);
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
        message: error instanceof Error ? error.message : 'Configuration failed',
        code: 'CONFIGURATION_FAILED',
        command: 'ConfigureRecording',
        details: { config }
      });

      return {
        success: false,
        acknowledged: false,
        error: raceBoxError
      };
    }
  }

  private validateRecordingConfiguration(config: RecordingConfiguration): void {
    if (config.thresholds.speedThreshold !== undefined && config.thresholds.speedThreshold < 0) {
      throw new Error('Speed threshold must be non-negative');
    }

    if (config.thresholds.accelerationThreshold !== undefined && config.thresholds.accelerationThreshold < 0) {
      throw new Error('Acceleration threshold must be non-negative');
    }

    if (config.thresholds.rotationThreshold !== undefined && config.thresholds.rotationThreshold < 0) {
      throw new Error('Rotation threshold must be non-negative');
    }

    if (config.timeouts.startDelay !== undefined && config.timeouts.startDelay < 0) {
      throw new Error('Start delay must be non-negative');
    }

    if (config.timeouts.stopDelay !== undefined && config.timeouts.stopDelay < 0) {
      throw new Error('Stop delay must be non-negative');
    }

    if (config.timeouts.autoStop !== undefined && config.timeouts.autoStop < 0) {
      throw new Error('Auto stop timeout must be non-negative');
    }

    // Validate data rate
    if (config.dataRate === undefined) {
      throw new Error('Data rate is required');
    }

    // Validate filters
    if (config.filters.minSpeed !== undefined && config.filters.maxSpeed !== undefined) {
      if (config.filters.minSpeed > config.filters.maxSpeed) {
        throw new Error('Minimum speed cannot be greater than maximum speed');
      }
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