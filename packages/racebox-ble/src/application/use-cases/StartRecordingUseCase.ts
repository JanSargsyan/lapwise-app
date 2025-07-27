import { MessageFactoryPort } from '../../ports/secondary/MessageFactoryPort';
import { BLEDevicePort } from '../../ports/secondary/BLEDevicePort';
import { ErrorHandlerPort } from '../../ports/secondary/ErrorHandlerPort';
import { RaceBoxError } from '../../domain/types/RaceBoxError';

export interface StartRecordingRequest {
  timeoutMs?: number;
  waitForAcknowledgment?: boolean;
}

export interface StartRecordingResponse {
  success: boolean;
  acknowledged: boolean;
  startTime?: Date;
  error?: RaceBoxError;
}

export class StartRecordingUseCase {
  constructor(
    private readonly messageFactory: MessageFactoryPort,
    private readonly bleDevice: BLEDevicePort,
    private readonly errorHandler: ErrorHandlerPort
  ) {}

  async execute(request: StartRecordingRequest): Promise<StartRecordingResponse> {
    const { timeoutMs = 5000, waitForAcknowledgment = true } = request;

    try {
      // Check if device is connected
      if (!this.bleDevice.isConnected()) {
        throw new Error('Device is not connected');
      }

      // Create and send start recording command
      const message = this.messageFactory.createStartRecordingCommand();
      const packet = this.messageFactory.messageToPacket(message);
      await this.bleDevice.sendData(packet);

      // Wait for acknowledgment if requested
      let acknowledged = false;
      if (waitForAcknowledgment) {
        acknowledged = await this.waitForAcknowledgment(timeoutMs);
      }

      const startTime = new Date();

      return {
        success: true,
        acknowledged,
        startTime
      };
    } catch (error) {
      const raceBoxError = this.errorHandler.handleDeviceError({
        ...error,
        command: 'StartRecording'
      });

      return {
        success: false,
        acknowledged: false,
        error: raceBoxError
      };
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