import { LiveDataMessage } from '../../domain/entities/LiveDataMessage';
import { GNSSStatus } from '../../domain/value-objects/GNSSStatus';
import { MemoryStatus } from '../../domain/value-objects/MemoryStatus';
import { RecordingStatus } from '../../domain/value-objects/RecordingStatus';
import { RaceBoxError } from '../../domain/types/RaceBoxError';
import { Acknowledgment } from '../../domain/types/Acknowledgment';

export interface RaceBoxMessageHandlerPort {
  handleLiveData(message: LiveDataMessage): void;
  handleRecordingStatus(status: RecordingStatus): void;
  handleGNSSStatus(status: GNSSStatus): void;
  handleMemoryStatus(status: MemoryStatus): void;
  handleError(error: RaceBoxError): void;
  handleAcknowledgment(ack: Acknowledgment): void;
} 