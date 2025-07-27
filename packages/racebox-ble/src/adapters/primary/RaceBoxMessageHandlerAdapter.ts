import { Subject } from 'rxjs';
import { RaceBoxMessageHandlerPort } from '../../ports/primary/RaceBoxMessageHandlerPort';
import { LiveDataMessage } from '../../domain/entities/LiveDataMessage';
import { GNSSStatus } from '../../domain/value-objects/GNSSStatus';
import { MemoryStatus } from '../../domain/value-objects/MemoryStatus';
import { RecordingStatus } from '../../domain/value-objects/RecordingStatus';
import { RaceBoxError } from '../../domain/types/RaceBoxError';
import { Acknowledgment } from '../../domain/types/Acknowledgment';

export class RaceBoxMessageHandlerAdapter implements RaceBoxMessageHandlerPort {
  constructor(
    private readonly liveDataSubject: Subject<LiveDataMessage>,
    private readonly recordingStatusSubject: Subject<RecordingStatus>,
    private readonly gnssStatusSubject: Subject<GNSSStatus>,
    private readonly memoryStatusSubject: Subject<MemoryStatus>,
    private readonly errorSubject: Subject<RaceBoxError>,
    private readonly acknowledgmentSubject: Subject<Acknowledgment>
  ) {}

  handleLiveData(message: LiveDataMessage): void {
    this.liveDataSubject.next(message);
  }

  handleRecordingStatus(status: RecordingStatus): void {
    this.recordingStatusSubject.next(status);
  }

  handleGNSSStatus(status: GNSSStatus): void {
    this.gnssStatusSubject.next(status);
  }

  handleMemoryStatus(status: MemoryStatus): void {
    this.memoryStatusSubject.next(status);
  }

  handleError(error: RaceBoxError): void {
    this.errorSubject.next(error);
  }

  handleAcknowledgment(ack: Acknowledgment): void {
    this.acknowledgmentSubject.next(ack);
  }
} 