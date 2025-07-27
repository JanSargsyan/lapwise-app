import { LiveDataMessage } from './LiveDataMessage';

export interface HistoryDataMessage extends LiveDataMessage {
  sessionId: string;
  recordingIndex: number;
  sessionStartTime: Date;
  sessionEndTime?: Date;
  totalDataPoints: number;
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
} 