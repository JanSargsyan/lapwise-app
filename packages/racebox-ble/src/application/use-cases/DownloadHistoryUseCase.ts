import { Observable, Subject } from 'rxjs';
import { MessageFactoryPort } from '../../ports/secondary/MessageFactoryPort';
import { BLEDevicePort } from '../../ports/secondary/BLEDevicePort';
import { PacketParserPort } from '../../ports/secondary/PacketParserPort';
import { ErrorHandlerPort } from '../../ports/secondary/ErrorHandlerPort';
import { LiveDataMessage } from '../../domain/entities/LiveDataMessage';
import { RaceBoxError } from '../../domain/types/RaceBoxError';

export interface DownloadHistoryRequest {
  startIndex?: number;
  count?: number;
  timeoutMs?: number;
  progressCallback?: (progress: number) => void;
}

export interface DownloadHistoryResponse {
  success: boolean;
  data: LiveDataMessage[];
  totalCount: number;
  downloadedCount: number;
  error?: RaceBoxError;
}

export class DownloadHistoryUseCase {
  constructor(
    private readonly messageFactory: MessageFactoryPort,
    private readonly bleDevice: BLEDevicePort,
    private readonly packetParser: PacketParserPort,
    private readonly errorHandler: ErrorHandlerPort
  ) {}

  async execute(request: DownloadHistoryRequest): Promise<DownloadHistoryResponse> {
    const { 
      startIndex = 0, 
      count = 100, 
      timeoutMs = 30000,
      progressCallback 
    } = request;

    try {
      // Check if device is connected
      if (!this.bleDevice.isConnected()) {
        throw new Error('Device is not connected');
      }

      // Create download request message
      const message = this.messageFactory.createDownloadHistoryRequest(startIndex, count);
      const packet = this.messageFactory.messageToPacket(message);
      await this.bleDevice.sendData(packet);

      // Collect data from device
      const data = await this.collectHistoryData(count, timeoutMs, progressCallback);

      return {
        success: true,
        data,
        totalCount: data.length,
        downloadedCount: data.length
      };
    } catch (error) {
      const raceBoxError = this.errorHandler.handleDeviceError({
        message: error instanceof Error ? error.message : 'Download failed',
        code: 'DOWNLOAD_FAILED',
        command: 'DownloadHistory',
        details: { startIndex, count }
      });

      return {
        success: false,
        data: [],
        totalCount: 0,
        downloadedCount: 0,
        error: raceBoxError
      };
    }
  }

  private async collectHistoryData(
    expectedCount: number, 
    timeoutMs: number,
    progressCallback?: (progress: number) => void
  ): Promise<LiveDataMessage[]> {
    return new Promise((resolve, reject) => {
      const data: LiveDataMessage[] = [];
      const timeout = setTimeout(() => {
        reject(new Error('Download timeout'));
      }, timeoutMs);

      // Subscribe to BLE data stream
      const subscription = this.bleDevice.subscribeToCharacteristic('rx').subscribe({
        next: (packet) => {
          try {
            // Check if this is a history data packet
            if (this.packetParser.isLiveDataMessage(packet)) {
              const liveData = this.packetParser.extractLiveData(packet);
              data.push(liveData);

              // Update progress
              const progress = (data.length / expectedCount) * 100;
              if (progressCallback) {
                progressCallback(Math.min(progress, 100));
              }

              // Check if we have all the data
              if (data.length >= expectedCount) {
                clearTimeout(timeout);
                subscription.unsubscribe();
                resolve(data);
              }
            }
          } catch (error) {
            clearTimeout(timeout);
            subscription.unsubscribe();
            reject(error);
          }
        },
        error: (error) => {
          clearTimeout(timeout);
          reject(error);
        }
      });
    });
  }

  // Alternative method for streaming download
  downloadHistoryStream(request: DownloadHistoryRequest): Observable<LiveDataMessage> {
    const subject = new Subject<LiveDataMessage>();

    this.execute(request).then(response => {
      if (response.success) {
        response.data.forEach(data => subject.next(data));
        subject.complete();
      } else {
        subject.error(response.error);
      }
    }).catch(error => {
      subject.error(error);
    });

    return subject.asObservable();
  }
} 