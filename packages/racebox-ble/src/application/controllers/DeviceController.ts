import { Observable } from 'rxjs';
import { ConnectToDeviceUseCase } from '../use-cases/ConnectToDeviceUseCase';
import { ConfigureGNSSUseCase } from '../use-cases/ConfigureGNSSUseCase';
import { ConfigureRecordingUseCase } from '../use-cases/ConfigureRecordingUseCase';
import { StartRecordingUseCase } from '../use-cases/StartRecordingUseCase';
import { StopRecordingUseCase } from '../use-cases/StopRecordingUseCase';
import { PauseRecordingUseCase } from '../use-cases/PauseRecordingUseCase';
import { DownloadHistoryUseCase } from '../use-cases/DownloadHistoryUseCase';
import { GNSSConfiguration, RecordingConfiguration } from '../../domain/entities';
import { LiveDataMessage } from '../../domain/entities/LiveDataMessage';
import { RaceBoxError } from '../../domain/types/RaceBoxError';

export interface DeviceControllerConfig {
  connectionTimeout?: number;
  commandTimeout?: number;
  retryAttempts?: number;
  autoReconnect?: boolean;
}

export class DeviceController {
  private isConnected = false;
  private isRecording = false;
  private currentGNSSConfig?: GNSSConfiguration;
  private currentRecordingConfig?: RecordingConfiguration;

  constructor(
    private readonly connectUseCase: ConnectToDeviceUseCase,
    private readonly configureGNSSUseCase: ConfigureGNSSUseCase,
    private readonly configureRecordingUseCase: ConfigureRecordingUseCase,
    private readonly startRecordingUseCase: StartRecordingUseCase,
    private readonly stopRecordingUseCase: StopRecordingUseCase,
    private readonly pauseRecordingUseCase: PauseRecordingUseCase,
    private readonly downloadHistoryUseCase: DownloadHistoryUseCase,
    private readonly config: DeviceControllerConfig = {}
  ) {}

  // Device connection
  async connectToDevice(deviceId: string): Promise<boolean> {
    try {
      const response = await this.connectUseCase.execute({
        deviceId,
        timeoutMs: this.config.connectionTimeout || 10000,
        retryAttempts: this.config.retryAttempts || 3
      });

      this.isConnected = response.success;
      return response.success;
    } catch (error) {
      this.isConnected = false;
      throw error;
    }
  }

  // Configuration management
  async configureGNSS(config: GNSSConfiguration): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error('Device not connected');
    }

    try {
      const response = await this.configureGNSSUseCase.execute({
        config,
        timeoutMs: this.config.commandTimeout || 5000,
        waitForAcknowledgment: true
      });

      if (response.success) {
        this.currentGNSSConfig = config;
      }

      return response.success;
    } catch (error) {
      throw error;
    }
  }

  async configureRecording(config: RecordingConfiguration): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error('Device not connected');
    }

    try {
      const response = await this.configureRecordingUseCase.execute({
        config,
        timeoutMs: this.config.commandTimeout || 5000,
        waitForAcknowledgment: true
      });

      if (response.success) {
        this.currentRecordingConfig = config;
      }

      return response.success;
    } catch (error) {
      throw error;
    }
  }

  // Recording control
  async startRecording(): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error('Device not connected');
    }

    if (this.isRecording) {
      throw new Error('Recording already in progress');
    }

    try {
      const response = await this.startRecordingUseCase.execute({
        timeoutMs: this.config.commandTimeout || 5000,
        waitForAcknowledgment: true
      });

      if (response.success) {
        this.isRecording = true;
      }

      return response.success;
    } catch (error) {
      throw error;
    }
  }

  async stopRecording(): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error('Device not connected');
    }

    if (!this.isRecording) {
      throw new Error('No recording in progress');
    }

    try {
      const response = await this.stopRecordingUseCase.execute({
        timeoutMs: this.config.commandTimeout || 5000,
        waitForAcknowledgment: true
      });

      if (response.success) {
        this.isRecording = false;
      }

      return response.success;
    } catch (error) {
      throw error;
    }
  }

  async pauseRecording(): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error('Device not connected');
    }

    if (!this.isRecording) {
      throw new Error('No recording in progress');
    }

    try {
      const response = await this.pauseRecordingUseCase.execute({
        timeoutMs: this.config.commandTimeout || 5000,
        waitForAcknowledgment: true
      });

      return response.success;
    } catch (error) {
      throw error;
    }
  }

  // Data download
  async downloadHistory(
    startIndex: number = 0,
    count: number = 100,
    progressCallback?: (progress: number) => void
  ): Promise<LiveDataMessage[]> {
    if (!this.isConnected) {
      throw new Error('Device not connected');
    }

    try {
      const response = await this.downloadHistoryUseCase.execute({
        startIndex,
        count,
        timeoutMs: 30000,
        progressCallback
      });

      if (!response.success) {
        throw new Error('Download failed');
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  downloadHistoryStream(
    startIndex: number = 0,
    count: number = 100
  ): Observable<LiveDataMessage> {
    if (!this.isConnected) {
      throw new Error('Device not connected');
    }

    return this.downloadHistoryUseCase.downloadHistoryStream({
      startIndex,
      count,
      timeoutMs: 30000
    });
  }

  // State queries
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getRecordingStatus(): boolean {
    return this.isRecording;
  }

  getCurrentGNSSConfig(): GNSSConfiguration | undefined {
    return this.currentGNSSConfig;
  }

  getCurrentRecordingConfig(): RecordingConfiguration | undefined {
    return this.currentRecordingConfig;
  }

  // Configuration
  updateConfig(config: Partial<DeviceControllerConfig>): void {
    Object.assign(this.config, config);
  }

  getConfig(): DeviceControllerConfig {
    return { ...this.config };
  }
} 