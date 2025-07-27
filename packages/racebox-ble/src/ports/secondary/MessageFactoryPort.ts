import { RaceBoxMessage } from './PacketParserPort';
import { GNSSConfiguration, RecordingConfiguration } from '../../domain/entities';

export interface MessageFactoryPort {
  createGNSSConfigRequest(): RaceBoxMessage;
  createGNSSConfigSet(config: GNSSConfiguration): RaceBoxMessage;
  createRecordingConfigRequest(): RaceBoxMessage;
  createRecordingConfigSet(config: RecordingConfiguration): RaceBoxMessage;
  createStartRecordingCommand(): RaceBoxMessage;
  createStopRecordingCommand(): RaceBoxMessage;
  createPauseRecordingCommand(): RaceBoxMessage;
  createDownloadHistoryCommand(): RaceBoxMessage;
  createDownloadHistoryRequest(startIndex: number, count: number): RaceBoxMessage;
  createEraseMemoryCommand(): RaceBoxMessage;
  createUnlockMemoryCommand(securityCode: number): RaceBoxMessage;
  messageToPacket(message: RaceBoxMessage): Uint8Array;
} 