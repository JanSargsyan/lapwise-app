export interface RaceBoxError {
  type: 'connection' | 'protocol' | 'device' | 'configuration' | 'timeout';
  message: string;
  code?: string;
  timestamp: Date;
  recoverable: boolean;
  details?: any;
}

export interface ConnectionError extends RaceBoxError {
  type: 'connection';
  details: {
    deviceId?: string;
    connectionState?: string;
    retryCount?: number;
  };
}

export interface ProtocolError extends RaceBoxError {
  type: 'protocol';
  details: {
    packetData?: Uint8Array;
    expectedChecksum?: [number, number];
    actualChecksum?: [number, number];
    messageType?: string;
  };
}

export interface DeviceError extends RaceBoxError {
  type: 'device';
  details: {
    command?: string;
    response?: string;
    deviceCapabilities?: string[];
  };
}

export interface ConfigurationError extends RaceBoxError {
  type: 'configuration';
  details: {
    parameter?: string;
    value?: any;
    validRange?: [any, any];
  };
}

export interface TimeoutError extends RaceBoxError {
  type: 'timeout';
  details: {
    operation?: string;
    timeoutMs?: number;
    retryCount?: number;
  };
}

export type RaceBoxErrorType = 
  | ConnectionError 
  | ProtocolError 
  | DeviceError 
  | ConfigurationError 
  | TimeoutError; 