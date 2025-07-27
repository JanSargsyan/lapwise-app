// Device-specific constants
export const DEFAULT_CONNECTION_TIMEOUT = 10000; // 10 seconds
export const DEFAULT_COMMAND_TIMEOUT = 5000; // 5 seconds
export const DEFAULT_RETRY_ATTEMPTS = 3;
export const DEFAULT_DATA_BUFFER_SIZE = 1024;

// BLE service and characteristic UUIDs
export const UART_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
export const UART_TX_CHARACTERISTIC_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
export const UART_RX_CHARACTERISTIC_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

// Data conversion constants
export const MM_TO_METERS = 0.001;
export const MM_PER_SEC_TO_KM_PER_HOUR = 0.0036;
export const CENTI_DEGREES_TO_DEGREES = 0.01;
export const MILLI_G_TO_G = 0.001; 