import { RaceBoxMessage } from './PacketParserPort';
import { GNSSConfiguration, RecordingConfiguration } from '../../domain/entities';

export interface MessageFactoryPort {
  // GNSS configuration messages
  createGNSSConfigRequest(): RaceBoxMessage;
  createGNSSConfigSet(config: GNSSConfiguration): RaceBoxMessage;
  
  // Recording configuration messages
  createRecordingConfigRequest(): RaceBoxMessage;
  createRecordingConfigSet(config: RecordingConfiguration): RaceBoxMessage;
  
  // Recording control messages
  createStartRecordingCommand(): RaceBoxMessage;
  createStopRecordingCommand(): RaceBoxMessage;
  createPauseRecordingCommand(): RaceBoxMessage;
  
  // Data download messages
  createDownloadHistoryCommand(): RaceBoxMessage;
  createDownloadHistoryRequest(startIndex: number, count: number): RaceBoxMessage;
  
  // Memory management messages
  createEraseMemoryCommand(): RaceBoxMessage;
  createUnlockMemoryCommand(securityCode: number): RaceBoxMessage;
  
  // Status request messages
  createDeviceInfoRequest(): RaceBoxMessage;
  createRecordingStatusRequest(): RaceBoxMessage;
  createGNSSStatusRequest(): RaceBoxMessage;
  createMemoryStatusRequest(): RaceBoxMessage;
  
  // Utility methods
  createAcknowledgmentRequest(messageId: number): RaceBoxMessage;
  createKeepAliveMessage(): RaceBoxMessage;
  createResetCommand(): RaceBoxMessage;
} 