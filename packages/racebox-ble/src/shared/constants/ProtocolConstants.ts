// UBX protocol constants
export const UBX_SYNC_CHAR_1 = 0xB5;
export const UBX_SYNC_CHAR_2 = 0x62;
export const UBX_HEADER_LENGTH = 6;
export const UBX_CHECKSUM_LENGTH = 2;

// RaceBox message class and ID constants
export const RACEBOX_CLASS = 0xFF;
export const RACEBOX_LIVE_DATA_ID = 0x01;
export const RACEBOX_GNSS_CONFIG_ID = 0x27;
export const RACEBOX_RECORDING_CONFIG_ID = 0x22;
export const RACEBOX_START_RECORDING_ID = 0x25;
export const RACEBOX_STOP_RECORDING_ID = 0x23;
export const RACEBOX_PAUSE_RECORDING_ID = 0x24;
export const RACEBOX_DOWNLOAD_HISTORY_ID = 0x21;
export const RACEBOX_ERASE_MEMORY_ID = 0x24;
export const RACEBOX_UNLOCK_MEMORY_ID = 0x30;
export const RACEBOX_ACK_ID = 0x05;
export const RACEBOX_NACK_ID = 0x00; 