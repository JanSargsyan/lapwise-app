import type { StateChangePayload } from 'racebox-api/types';
import { RecordingState, RecordingStateChange } from '@/src/domain/model/racebox/RecordingState';
import { RecordingConfig } from '@/src/domain/model/racebox/RecordingConfig';
import { mapRecordingConfigPayloadToDomain } from './RecordingConfigMapper';

export function mapStateChangePayloadToDomain(payload: StateChangePayload): RecordingStateChange {
  return {
    state: payload.state as RecordingState,
    timestamp: new Date(),
    config: payload.config ? mapRecordingConfigPayloadToDomain(payload.config) : undefined
  };
} 