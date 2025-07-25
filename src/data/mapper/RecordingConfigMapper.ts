import { RecordingConfig } from '@/src/domain/model/racebox/RecordingConfig';
// Remove the import for RecordingConfigPayload if not available, but define the type inline for mapping.

export function mapRecordingConfigPayloadToDomain(payload: any): RecordingConfig {
  return {
    enable: payload.enable,
    dataRate: payload.dataRate,
    flags: payload.flags,
    stationarySpeedThreshold: payload.stationarySpeedThreshold,
    stationaryDetectionInterval: payload.stationaryDetectionInterval,
    noFixDetectionInterval: payload.noFixDetectionInterval,
    autoShutdownInterval: payload.autoShutdownInterval,
  };
}

export function mapRecordingConfigDomainToPayload(config: RecordingConfig): any {
  return {
    enable: config.enable,
    dataRate: config.dataRate,
    flags: config.flags,
    stationarySpeedThreshold: config.stationarySpeedThreshold,
    stationaryDetectionInterval: config.stationaryDetectionInterval,
    noFixDetectionInterval: config.noFixDetectionInterval,
    autoShutdownInterval: config.autoShutdownInterval,
  };
} 