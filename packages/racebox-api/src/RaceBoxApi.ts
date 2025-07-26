import { Device } from 'react-native-ble-plx';
import {
  RACEBOX_UART_SERVICE_UUID,
  RACEBOX_UART_RX_UUID,
  RACEBOX_UART_TX_UUID,
  encodePacket,
  decodePacket,
  encodeRecordingConfig,
  decodeRecordingConfig,
  decodeAckNack,
  encodeUnlockMemory,
  decodeDataDownloadReply,
  decodeRecordingStatus,
  decodeLiveData,
  decodeStateChange,
  decodeEraseProgress,
  decodeGnssConfig,
  RACEBOX_NMEA_TX_UUID,
} from './protocol/messages';
import { toBase64, fromBase64 } from './utils';
import type {
  RaceBoxLiveData,
  RecordingConfigPayload,
  AckNackPayload,
  UnlockMemoryPayload,
  DataDownloadReplyPayload,
  RecordingStatusPayload,
  StateChangePayload,
  EraseProgressPayload,
  GnssConfigPayload,
} from './protocol/types';

interface PendingRequest {
  id: string;
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  matchFn: (pkt: { messageClass: number; messageId: number; payload: Uint8Array }) => any;
  timeout: NodeJS.Timeout;
}

interface MessageHandler {
  messageClass: number;
  messageId: number;
  handler: (payload: Uint8Array) => void;
}

/**
 * API for interacting with a RaceBox BLE device.
 *
 * This class implements a centralized UART message router to handle
 * concurrent requests properly without interference.
 */
export class RaceBoxApi {
  private device: Device;
  private pendingRequests = new Map<string, PendingRequest>();
  private messageHandlers = new Map<string, MessageHandler[]>();
  private txSubscription: any = null;
  private isInitialized = false;

  constructor(device: Device) {
    this.device = device;
  }

  /**
   * Initialize the UART message router
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('🔵 initialize: Already initialized');
      return;
    }

    // Ensure all services and characteristics are discovered
    console.log('🔵 initialize: Discovering all services and characteristics');
    await this.device.discoverAllServicesAndCharacteristics();
    console.log('✅ initialize: Discovery complete');

    console.log('🔵 initialize: Setting up TX subscription');
    console.log('🔵 initialize: Service UUID:', RACEBOX_UART_SERVICE_UUID);
    console.log('🔵 initialize: TX UUID:', RACEBOX_UART_TX_UUID);

    // Set up the single TX subscription
    this.txSubscription = this.device.monitorCharacteristicForService(
      RACEBOX_UART_SERVICE_UUID,
      RACEBOX_UART_TX_UUID,
      (error, characteristic) => {
        if (error) {
          console.log('🔴 initialize: Error in TX subscription:', error);
          return;
        }
        if (!characteristic?.value) {
          console.log('🔴 initialize: No characteristic value');
          return;
        }
        
        const data = fromBase64(characteristic.value!);
        const pkt = decodePacket(data);
        if (!pkt) {
          console.log('🔴 initialize: Failed to decode packet');
          return;
        }

        // Only log for non-live data packets to reduce spam
        const key = `${pkt.messageClass.toString(16).padStart(2, '0')}_${pkt.messageId.toString(16).padStart(2, '0')}`;
        if (key !== 'ff_01') {
          console.log('🟡 initialize: Received characteristic value, length:', characteristic.value.length);
          console.log('🟡 initialize: Decoded data length:', data.length);
          console.log('🟡 initialize: Successfully decoded packet, calling handleIncomingMessage');
        }
        
        this.handleIncomingMessage(pkt);
      }
    );

    console.log('✅ initialize: TX subscription set up successfully');
    this.isInitialized = true;
  }

  /**
   * Handle incoming UART messages and route them appropriately
   */
  private handleIncomingMessage(pkt: { messageClass: number; messageId: number; payload: Uint8Array }): void {
    const key = `${pkt.messageClass.toString(16).padStart(2, '0')}_${pkt.messageId.toString(16).padStart(2, '0')}`;
    
    // Reduce logging for live data packets to avoid spam
    if (key !== 'ff_01') {
      console.log('🟡 handleIncomingMessage: Received packet:', {
        messageClass: `0x${pkt.messageClass.toString(16).padStart(2, '0')}`,
        messageId: `0x${pkt.messageId.toString(16).padStart(2, '0')}`,
        payloadLength: pkt.payload.length,
        payloadBytes: Array.from(pkt.payload).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '),
        key: key
      });
    }
    
    // Check if any pending request matches this message
    if (key !== 'ff_01') {
      console.log('🟡 handleIncomingMessage: Checking', this.pendingRequests.size, 'pending requests');
    }
    for (const [requestId, request] of this.pendingRequests.entries()) {
      try {
        console.log('🟡 handleIncomingMessage: Testing request ID:', requestId);
        const result = request.matchFn(pkt);
        if (result !== null && result !== undefined) {
          console.log('✅ handleIncomingMessage: MATCH FOUND for request ID:', requestId);
          // Found a matching request, resolve it
          clearTimeout(request.timeout);
          this.pendingRequests.delete(requestId);
          request.resolve(result);
          return;
        } else {
          console.log('🟡 handleIncomingMessage: No match for request ID:', requestId);
        }
      } catch (error) {
        console.log('🔴 handleIncomingMessage: Error in matchFn for request ID:', requestId, error);
        // Ignore errors in matchFn, continue to next request
      }
    }

    // Check if any message handlers match this message
    const handlers = this.messageHandlers.get(key);
    if (handlers) {
      console.log('🟡 handleIncomingMessage: Found', handlers.length, 'message handlers for key:', key);
      for (const handler of handlers) {
        try {
          handler.handler(pkt.payload);
        } catch (error) {
          console.error('Error in message handler:', error);
        }
      }
    } else {
      // Only log for non-live data messages to reduce spam
      if (key !== 'ff_01') {
        console.log('🟡 handleIncomingMessage: No message handlers for key:', key);
      }
    }
  }

  /**
   * Send a UBX packet and wait for a matching response
   */
  private async sendUbxRequest<T>(
    packet: Uint8Array,
    matchFn: (pkt: { messageClass: number; messageId: number; payload: Uint8Array }) => T | null,
    timeoutMs = 2000
  ): Promise<T> {
    console.log('🔵 sendUbxRequest: Starting request');
    await this.initialize();

    return new Promise<T>((resolve, reject) => {
      const requestId = Math.random().toString(36).substring(2);
      console.log('🔵 sendUbxRequest: Created request with ID:', requestId);
      console.log('🔵 sendUbxRequest: Packet length:', packet.length);
      console.log('🔵 sendUbxRequest: Packet bytes:', Array.from(packet).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
      
      const timeout = setTimeout(() => {
        console.log('🔴 sendUbxRequest: TIMEOUT for request ID:', requestId);
        this.pendingRequests.delete(requestId);
        reject(new Error('Timeout waiting for response'));
      }, timeoutMs);

      const pendingRequest: PendingRequest = {
        id: requestId,
        resolve,
        reject,
        matchFn,
        timeout,
      };

      this.pendingRequests.set(requestId, pendingRequest);
      console.log('🔵 sendUbxRequest: Added to pending requests. Total pending:', this.pendingRequests.size);

      // Send the packet
      const base64Packet = toBase64(packet);
      console.log('🔵 sendUbxRequest: Sending base64 packet:', base64Packet);
      console.log('🔵 sendUbxRequest: Service UUID:', RACEBOX_UART_SERVICE_UUID);
      this.device.characteristicsForService(RACEBOX_UART_SERVICE_UUID).then(chars => {
        console.log('🔵 sendUbxRequest: device', chars);
      });
      this.device.writeCharacteristicWithResponseForService(
        RACEBOX_UART_SERVICE_UUID,
        RACEBOX_UART_RX_UUID,
        base64Packet
      ).then(() => {
        console.log('✅ sendUbxRequest: Packet sent successfully');
      }).catch((err) => {
        console.log('🔴 sendUbxRequest: Failed to send packet:', err);
        this.pendingRequests.delete(requestId);
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  /**
   * Register a message handler for specific message types
   */
  private registerMessageHandler(
    messageClass: number,
    messageId: number,
    handler: (payload: Uint8Array) => void
  ): () => void {
    const key = `${messageClass.toString(16).padStart(2, '0')}_${messageId.toString(16).padStart(2, '0')}`;
    
    if (!this.messageHandlers.has(key)) {
      this.messageHandlers.set(key, []);
    }
    
    const handlers = this.messageHandlers.get(key)!;
    handlers.push({ messageClass, messageId, handler });

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(key);
      if (handlers) {
        const index = handlers.findIndex(h => h.handler === handler);
        if (index !== -1) {
          handlers.splice(index, 1);
        }
        if (handlers.length === 0) {
          this.messageHandlers.delete(key);
        }
      }
    };
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    // Clear all pending requests
    for (const request of this.pendingRequests.values()) {
      clearTimeout(request.timeout);
      request.reject(new Error('API disposed'));
    }
    this.pendingRequests.clear();

    // Remove TX subscription
    if (this.txSubscription) {
      this.txSubscription.remove();
      this.txSubscription = null;
    }

    this.isInitialized = false;
  }

  /**
   * Read current recording configuration.
   * Sends UBX packet (0xFF 0x25, payload 0) and waits for response.
   */
  async readRecordingConfig(): Promise<RecordingConfigPayload | null> {
    console.log('🔵 readRecordingConfig: Starting');
    const packet = encodePacket(0xff, 0x25, new Uint8Array([]));
    console.log('🔵 readRecordingConfig: Created packet for 0xFF 0x25');
    
    try {
      const result = await this.sendUbxRequest(packet, (pkt) => {
        console.log('🟡 readRecordingConfig: Testing packet:', {
          messageClass: `0x${pkt.messageClass.toString(16).padStart(2, '0')}`,
          messageId: `0x${pkt.messageId.toString(16).padStart(2, '0')}`,
          payloadLength: pkt.payload.length
        });
        
        if (pkt.messageClass === 0xff && pkt.messageId === 0x25) {
          console.log('✅ readRecordingConfig: Found matching response');
          const decoded = decodeRecordingConfig(pkt.payload);
          console.log('✅ readRecordingConfig: Decoded config:', decoded);
          return decoded;
        }
        console.log('🟡 readRecordingConfig: No match for this packet');
        return null;
      });
      
      console.log('✅ readRecordingConfig: Successfully got result:', result);
      return result;
    } catch (error) {
      console.log('🔴 readRecordingConfig: Error:', error);
      throw error;
    }
  }

  /**
   * Set recording configuration.
   * Sends UBX packet (0xFF 0x25, 12-byte payload) and waits for ACK/NACK.
   * @param config Recording configuration payload
   */
  async setRecordingConfig(
    config: RecordingConfigPayload
  ): Promise<AckNackPayload | null> {
    const payload = encodeRecordingConfig(config);
    const packet = encodePacket(0xff, 0x25, payload);
    return this.sendUbxRequest(packet, (pkt) => {
      // ACK = 0xFF 0x02, NACK = 0xFF 0x03
      if (
        pkt.messageClass === 0xff &&
        (pkt.messageId === 0x02 || pkt.messageId === 0x03)
      ) {
        return decodeAckNack(pkt.payload);
      }
      return null;
    });
  }

  /**
   * Subscribe to live data updates.
   * @param onData Callback for live data
   * @returns Unsubscribe function
   */
  subscribeLiveData(onData: (data: RaceBoxLiveData) => void): () => void {
    return this.registerMessageHandler(0xff, 0x01, (payload) => {
      const data = decodeLiveData(payload);
      if (data) {
        onData(data);
      }
    });
  }

  /**
   * Read GNSS configuration.
   * Sends UBX packet (0xFF 0x26, payload 0) and waits for response.
   */
  async readGnssConfig(): Promise<GnssConfigPayload | null> {
    const packet = encodePacket(0xff, 0x26, new Uint8Array([]));
    return this.sendUbxRequest(packet, (pkt) => {
      if (pkt.messageClass === 0xff && pkt.messageId === 0x26) {
        return decodeGnssConfig(pkt.payload);
      }
      return null;
    });
  }

  /**
   * Set GNSS configuration.
   * Sends UBX packet (0xFF 0x26, config payload) and waits for ACK/NACK.
   * @param config GNSS configuration as Uint8Array
   */
  async setGnssConfig(config: Uint8Array): Promise<AckNackPayload | null> {
    const packet = encodePacket(0xff, 0x26, config);
    return this.sendUbxRequest(packet, (pkt) => {
      // ACK = 0xFF 0x02, NACK = 0xFF 0x03
      if (
        pkt.messageClass === 0xff &&
        (pkt.messageId === 0x02 || pkt.messageId === 0x03)
      ) {
        return decodeAckNack(pkt.payload);
      }
      return null;
    });
  }

  /**
   * Get recording status.
   * Sends UBX packet (0xFF 0x27, payload 0) and waits for response.
   */
  async getRecordingStatus(): Promise<RecordingStatusPayload | null> {
    const packet = encodePacket(0xff, 0x27, new Uint8Array([]));
    return this.sendUbxRequest(packet, (pkt) => {
      if (pkt.messageClass === 0xff && pkt.messageId === 0x27) {
        return decodeRecordingStatus(pkt.payload);
      }
      return null;
    });
  }

  /**
   * Start recording.
   * Sends UBX packet (0xFF 0x28, payload 0) and waits for ACK/NACK.
   */
  async startRecording(): Promise<AckNackPayload | null> {
    const packet = encodePacket(0xff, 0x28, new Uint8Array([]));
    return this.sendUbxRequest(packet, (pkt) => {
      // ACK = 0xFF 0x02, NACK = 0xFF 0x03
      if (
        pkt.messageClass === 0xff &&
        (pkt.messageId === 0x02 || pkt.messageId === 0x03)
      ) {
        return decodeAckNack(pkt.payload);
      }
      return null;
    });
  }

  /**
   * Stop recording.
   * Sends UBX packet (0xFF 0x29, payload 0) and waits for ACK/NACK.
   */
  async stopRecording(): Promise<AckNackPayload | null> {
    const packet = encodePacket(0xff, 0x29, new Uint8Array([]));
    return this.sendUbxRequest(packet, (pkt) => {
      // ACK = 0xFF 0x02, NACK = 0xFF 0x03
      if (
        pkt.messageClass === 0xff &&
        (pkt.messageId === 0x02 || pkt.messageId === 0x03)
      ) {
        return decodeAckNack(pkt.payload);
      }
      return null;
    });
  }

  /**
   * Pause recording.
   * Sends UBX packet (0xFF 0x2A, payload 0) and waits for ACK/NACK.
   */
  async pauseRecording(): Promise<AckNackPayload | null> {
    const packet = encodePacket(0xff, 0x2a, new Uint8Array([]));
    return this.sendUbxRequest(packet, (pkt) => {
      // ACK = 0xFF 0x02, NACK = 0xFF 0x03
      if (
        pkt.messageClass === 0xff &&
        (pkt.messageId === 0x02 || pkt.messageId === 0x03)
      ) {
        return decodeAckNack(pkt.payload);
      }
      return null;
    });
  }

  /**
   * Unlock memory with security code.
   * Sends UBX packet (0xFF 0x2B, security code payload) and waits for ACK/NACK.
   * @param payload Unlock memory payload
   */
  async unlockMemory(
    payload: UnlockMemoryPayload
  ): Promise<AckNackPayload | null> {
    const encodedPayload = encodeUnlockMemory(payload);
    const packet = encodePacket(0xff, 0x2b, encodedPayload);
    return this.sendUbxRequest(packet, (pkt) => {
      // ACK = 0xFF 0x02, NACK = 0xFF 0x03
      if (
        pkt.messageClass === 0xff &&
        (pkt.messageId === 0x02 || pkt.messageId === 0x03)
      ) {
        return decodeAckNack(pkt.payload);
      }
      return null;
    });
  }

  /**
   * Erase memory.
   * Sends UBX packet (0xFF 0x2C, payload 0) and waits for ACK/NACK.
   */
  async eraseMemory(): Promise<AckNackPayload | null> {
    const packet = encodePacket(0xff, 0x2c, new Uint8Array([]));
    return this.sendUbxRequest(packet, (pkt) => {
      // ACK = 0xFF 0x02, NACK = 0xFF 0x03
      if (
        pkt.messageClass === 0xff &&
        (pkt.messageId === 0x02 || pkt.messageId === 0x03)
      ) {
        return decodeAckNack(pkt.payload);
      }
      return null;
    });
  }

  /**
   * Cancel memory erase.
   * Sends UBX packet (0xFF 0x2D, payload 0) and waits for ACK/NACK.
   */
  async cancelEraseMemory(): Promise<AckNackPayload | null> {
    const packet = encodePacket(0xff, 0x2d, new Uint8Array([]));
    return this.sendUbxRequest(packet, (pkt) => {
      // ACK = 0xFF 0x02, NACK = 0xFF 0x03
      if (
        pkt.messageClass === 0xff &&
        (pkt.messageId === 0x02 || pkt.messageId === 0x03)
      ) {
        return decodeAckNack(pkt.payload);
      }
      return null;
    });
  }

  /**
   * Start data download.
   * Sends UBX packet (0xFF 0x2E, payload 0) and waits for response.
   */
  async startDataDownload(): Promise<DataDownloadReplyPayload | null> {
    const packet = encodePacket(0xff, 0x2e, new Uint8Array([]));
    return this.sendUbxRequest(packet, (pkt) => {
      if (pkt.messageClass === 0xff && pkt.messageId === 0x2e) {
        return decodeDataDownloadReply(pkt.payload);
      }
      return null;
    });
  }

  /**
   * Cancel data download.
   * Sends UBX packet (0xFF 0x2F, payload 0) and waits for ACK/NACK.
   */
  async cancelDataDownload(): Promise<AckNackPayload | null> {
    const packet = encodePacket(0xff, 0x2f, new Uint8Array([]));
    return this.sendUbxRequest(packet, (pkt) => {
      // ACK = 0xFF 0x02, NACK = 0xFF 0x03
      if (
        pkt.messageClass === 0xff &&
        (pkt.messageId === 0x02 || pkt.messageId === 0x03)
      ) {
        return decodeAckNack(pkt.payload);
      }
      return null;
    });
  }

  /**
   * Subscribe to history data updates.
   * @param onData Callback for history data
   * @returns Unsubscribe function
   */
  subscribeHistoryData(onData: (data: RaceBoxLiveData) => void): () => void {
    return this.registerMessageHandler(0xff, 0x21, (payload) => {
      const data = decodeLiveData(payload);
      if (data) {
        onData(data);
      }
    });
  }

  /**
   * Subscribe to state changes.
   * @param onChange Callback for state changes
   * @returns Unsubscribe function
   */
  subscribeStateChanges(
    onChange: (data: StateChangePayload) => void
  ): () => void {
    return this.registerMessageHandler(0xff, 0x30, (payload) => {
      const data = decodeStateChange(payload);
      if (data) {
        onChange(data);
      }
    });
  }

  /**
   * Subscribe to erase progress updates.
   * @param onProgress Callback for erase progress
   * @returns Unsubscribe function
   */
  subscribeEraseProgress(
    onProgress: (progress: EraseProgressPayload) => void
  ): () => void {
    return this.registerMessageHandler(0xff, 0x31, (payload) => {
      const data = decodeEraseProgress(payload);
      if (data) {
        onProgress(data);
      }
    });
  }

  /**
   * Subscribe to ACK/NACK messages.
   * @param onAck Callback for ACK/NACK messages
   * @returns Unsubscribe function
   */
  subscribeAckNack(onAck: (ack: AckNackPayload) => void): () => void {
    const unsubscribeAck = this.registerMessageHandler(0xff, 0x02, (payload) => {
      const data = decodeAckNack(payload);
      if (data) {
        onAck(data);
      }
    });

    const unsubscribeNack = this.registerMessageHandler(0xff, 0x03, (payload) => {
      const data = decodeAckNack(payload);
      if (data) {
        onAck(data);
      }
    });

    // Return combined unsubscribe function
    return () => {
      unsubscribeAck();
      unsubscribeNack();
    };
  }

  /**
   * Subscribe to NMEA output.
   * @param onNmea Callback for NMEA messages
   * @returns Unsubscribe function
   */
  subscribeNmeaOutput(onNmea: (nmea: string) => void): () => void {
    const subscription = this.device.monitorCharacteristicForService(
      RACEBOX_UART_SERVICE_UUID,
      RACEBOX_NMEA_TX_UUID,
      (error, characteristic) => {
        if (error || !characteristic?.value) return;
        const nmeaBytes = fromBase64(characteristic.value!);
        const nmea = new TextDecoder().decode(nmeaBytes);
        onNmea(nmea);
      }
    );
    return () => subscription.remove();
  }

  /**
   * Read device information.
   * Returns basic device info from BLE characteristics.
   */
  async readDeviceInfo(): Promise<{
    model?: string;
    serial?: string;
    firmware?: string;
    hardware?: string;
    manufacturer?: string;
  } | null> {
    try {
      const services = await this.device.services();
      const deviceInfoService = services.find(
        (s) => s.uuid.toLowerCase() === '180a'
      );
      if (!deviceInfoService) return null;

      const characteristics = await deviceInfoService.characteristics();
             const decode = (c: any) => {
         if (!c?.value) return undefined;
         const bytes = fromBase64(c.value);
         return new TextDecoder().decode(bytes);
       };

       const modelChar = characteristics.find(
         (c) => c.uuid.toLowerCase() === '2a24'
       );
       const serialChar = characteristics.find(
         (c) => c.uuid.toLowerCase() === '2a25'
       );
       const firmwareChar = characteristics.find(
         (c) => c.uuid.toLowerCase() === '2a26'
       );
       const hardwareChar = characteristics.find(
         (c) => c.uuid.toLowerCase() === '2a27'
       );
       const manufacturerChar = characteristics.find(
         (c) => c.uuid.toLowerCase() === '2a29'
       );

       return {
         model: decode(modelChar),
         serial: decode(serialChar),
         firmware: decode(firmwareChar),
         hardware: decode(hardwareChar),
         manufacturer: decode(manufacturerChar),
       };
    } catch {
      return null;
    }
  }
}
