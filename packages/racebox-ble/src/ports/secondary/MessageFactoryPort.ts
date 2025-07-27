import { RaceBoxMessage } from './PacketParserPort';
import { GNSSConfiguration, RecordingConfiguration } from '../../domain/entities';

export interface MessageFactoryPort {
  createGNSSConfigSet(config: GNSSConfiguration): RaceBoxMessage;
  createStartRecordingCommand(): RaceBoxMessage;
  createDownloadHistoryCommand(): RaceBoxMessage;
  createStopRecordingCommand(): RaceBoxMessage;
  createPauseRecordingCommand(): RaceBoxMessage;
  createRecordingConfigSet(config: RecordingConfiguration): RaceBoxMessage;
  createEraseMemoryCommand(): RaceBoxMessage;
  createUnlockMemoryCommand(securityCode: number): RaceBoxMessage;
  createDownloadHistoryRequest(startIndex: number, count: number): RaceBoxMessage;
  messageToPacket(message: RaceBoxMessage): Uint8Array;
} 