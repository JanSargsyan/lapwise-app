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

/**
 * API for interacting with a RaceBox BLE device.
 *
 * This class does not handle connection logic. Pass a connected Device instance.
 * All methods are Promise-based and handle encoding/decoding internally.
 */
export class RaceBoxApi {
  private device: Device;

  constructor(device: Device) {
    this.device = device;
  }

  /**
   * Internal helper to send a UBX packet and wait for a matching response.
   * @param packet UBX packet to send
   * @param matchFn Function to match the response packet
   * @param timeoutMs Timeout in ms
   */
  private async sendUbxRequest<T>(
    packet: Uint8Array,
    matchFn: (pkt: {
      messageClass: number;
      messageId: number;
      payload: Uint8Array;
    }) => T | null,
    timeoutMs = 2000
  ): Promise<T> {
    return new Promise<T>(async (resolve, reject) => {
      let done = false;
      const base64Packet = toBase64(packet);
      let timeout: any;
      const subscription = this.device.monitorCharacteristicForService(
        RACEBOX_UART_SERVICE_UUID,
        RACEBOX_UART_TX_UUID,
        (error, characteristic) => {
          if (done) return;
          if (error || !characteristic?.value) return;
          const data = fromBase64(characteristic.value!);
          const pkt = decodePacket(data);
          if (!pkt) return;
          const result = matchFn(pkt);
          if (result) {
            done = true;
            clearTimeout(timeout);
            subscription.remove();
            resolve(result);
          }
        }
      );
      timeout = setTimeout(() => {
        if (!done) {
          done = true;
          subscription.remove();
          reject(new Error('Timeout waiting for response'));
        }
      }, timeoutMs);
      try {
        await this.device.writeCharacteristicWithResponseForService(
          RACEBOX_UART_SERVICE_UUID,
          RACEBOX_UART_RX_UUID,
          base64Packet
        );
      } catch (err) {
        done = true;
        clearTimeout(timeout);
        subscription.remove();
        reject(err);
      }
    });
  }

  /**
   * Read current recording configuration.
   * Sends UBX packet (0xFF 0x25, payload 0) and waits for response.
   */
  async readRecordingConfig(): Promise<RecordingConfigPayload | null> {
    const packet = encodePacket(0xff, 0x25, new Uint8Array([]));
    return this.sendUbxRequest(packet, (pkt) => {
      if (pkt.messageClass === 0xff && pkt.messageId === 0x25) {
        return decodeRecordingConfig(pkt.payload);
      }
      return null;
    });
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

  // --- Live Data ---
  /**
   * Subscribe to live data messages (GNSS, IMU, system data).
   * Calls onData for each valid RaceBoxLiveData message.
   * @param onData Callback for each decoded live data message
   * @returns Unsubscribe function
   */
  subscribeLiveData(onData: (data: RaceBoxLiveData) => void): () => void {
    const subscription = this.device.monitorCharacteristicForService(
      RACEBOX_UART_SERVICE_UUID,
      RACEBOX_UART_TX_UUID,
      (error, characteristic) => {
        if (error || !characteristic?.value) return;
        const data = fromBase64(characteristic.value!);
        const pkt = decodePacket(data);
        if (!pkt) return;
        if (pkt.messageClass === 0xff && pkt.messageId === 0x01) {
          const live = decodeLiveData(pkt.payload);
          if (live) onData(live);
        }
      }
    );
    return () => subscription.remove();
  }

  // --- GNSS Receiver Configuration ---
  /**
   * Read GNSS receiver configuration.
   * Sends UBX packet (0xFF 0x27, payload 0) and waits for response.
   */
  async readGnssConfig(): Promise<GnssConfigPayload | null> {
    const packet = encodePacket(0xff, 0x27, new Uint8Array([]));
    return this.sendUbxRequest(packet, (pkt) => {
      if (pkt.messageClass === 0xff && pkt.messageId === 0x27) {
        return decodeGnssConfig(pkt.payload);
      }
      return null;
    });
  }

  /**
   * Set GNSS receiver configuration.
   * Sends UBX packet (0xFF 0x27, 3-byte payload) and waits for ACK/NACK.
   * @param config GNSS config payload (Uint8Array or typed)
   */
  async setGnssConfig(config: Uint8Array): Promise<AckNackPayload | null> {
    const packet = encodePacket(0xff, 0x27, config);
    return this.sendUbxRequest(packet, (pkt) => {
      if (
        pkt.messageClass === 0xff &&
        (pkt.messageId === 0x02 || pkt.messageId === 0x03)
      ) {
        return decodeAckNack(pkt.payload);
      }
      return null;
    });
  }

  // --- Standalone Recording Status ---
  /**
   * Request standalone recording status.
   * Sends UBX packet (0xFF 0x22, payload 0) and waits for RecordingStatusPayload.
   */
  async getRecordingStatus(): Promise<RecordingStatusPayload | null> {
    const packet = encodePacket(0xff, 0x22, new Uint8Array([]));
    return this.sendUbxRequest(packet, (pkt) => {
      if (pkt.messageClass === 0xff && pkt.messageId === 0x22) {
        return decodeRecordingStatus(pkt.payload);
      }
      return null;
    });
  }

  // --- Start/Stop/Pause Recording ---
  /**
   * Start standalone recording.
   */
  async startRecording(): Promise<AckNackPayload | null> {
    const config = await this.readRecordingConfig();
    if (!config) throw new Error('Failed to read current recording config');
    const newConfig = { ...config, enable: true };
    return this.setRecordingConfig(newConfig);
  }

  /**
   * Stop standalone recording.
   */
  async stopRecording(): Promise<AckNackPayload | null> {
    const config = await this.readRecordingConfig();
    if (!config) throw new Error('Failed to read current recording config');
    const newConfig = { ...config, enable: false };
    return this.setRecordingConfig(newConfig);
  }

  /**
   * Pause standalone recording.
   * Note: Protocol does not define a distinct 'pause' value for 'enable'.
   * This implementation sets 'enable' to false, which matches 'stop'.
   * If the device supports a different pause mechanism, update here.
   */
  async pauseRecording(): Promise<AckNackPayload | null> {
    const config = await this.readRecordingConfig();
    if (!config) throw new Error('Failed to read current recording config');
    const newConfig = { ...config, enable: false };
    return this.setRecordingConfig(newConfig);
  }

  // --- Unlock Memory ---
  /**
   * Unlock device memory with security code.
   * Sends UBX packet (0xFF 0x30, 4-byte payload) and waits for ACK/NACK.
   * @param payload UnlockMemoryPayload
   */
  async unlockMemory(
    payload: UnlockMemoryPayload
  ): Promise<AckNackPayload | null> {
    const encoded = encodeUnlockMemory(payload);
    const packet = encodePacket(0xff, 0x30, encoded);
    return this.sendUbxRequest(packet, (pkt) => {
      if (
        pkt.messageClass === 0xff &&
        (pkt.messageId === 0x02 || pkt.messageId === 0x03)
      ) {
        return decodeAckNack(pkt.payload);
      }
      return null;
    });
  }

  // --- Erase Memory ---
  /**
   * Erase device memory.
   * Sends UBX packet (0xFF 0x24, payload 0) and waits for ACK/NACK.
   */
  async eraseMemory(): Promise<AckNackPayload | null> {
    const packet = encodePacket(0xff, 0x24, new Uint8Array([]));
    return this.sendUbxRequest(packet, (pkt) => {
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
   * Sends UBX packet (0xFF 0x24, payload 1 byte = cancel) and waits for ACK/NACK.
   */
  async cancelEraseMemory(): Promise<AckNackPayload | null> {
    const payload = new Uint8Array([1]);
    const packet = encodePacket(0xff, 0x24, payload);
    return this.sendUbxRequest(packet, (pkt) => {
      if (
        pkt.messageClass === 0xff &&
        (pkt.messageId === 0x02 || pkt.messageId === 0x03)
      ) {
        return decodeAckNack(pkt.payload);
      }
      return null;
    });
  }

  // --- Data Download ---
  /**
   * Start download of recorded data.
   * Sends UBX packet (0xFF 0x23, payload 0) and waits for DataDownloadReplyPayload.
   */
  async startDataDownload(): Promise<DataDownloadReplyPayload | null> {
    const packet = encodePacket(0xff, 0x23, new Uint8Array([]));
    return this.sendUbxRequest(packet, (pkt) => {
      if (pkt.messageClass === 0xff && pkt.messageId === 0x23) {
        return decodeDataDownloadReply(pkt.payload);
      }
      return null;
    });
  }

  /**
   * Cancel data download.
   * Sends UBX packet (0xFF 0x23, payload 1 byte = cancel) and waits for ACK/NACK.
   */
  async cancelDataDownload(): Promise<AckNackPayload | null> {
    const payload = new Uint8Array([1]);
    const packet = encodePacket(0xff, 0x23, payload);
    return this.sendUbxRequest(packet, (pkt) => {
      if (
        pkt.messageClass === 0xff &&
        (pkt.messageId === 0x02 || pkt.messageId === 0x03)
      ) {
        return decodeAckNack(pkt.payload);
      }
      return null;
    });
  }

  // --- Notification Subscriptions ---
  /**
   * Subscribe to history data messages (downloaded data, 0xFF 0x21).
   * Calls onData for each valid RaceBoxLiveData message.
   * @param onData Callback for each decoded history data message
   * @returns Unsubscribe function
   */
  subscribeHistoryData(onData: (data: RaceBoxLiveData) => void): () => void {
    const subscription = this.device.monitorCharacteristicForService(
      RACEBOX_UART_SERVICE_UUID,
      RACEBOX_UART_TX_UUID,
      (error, characteristic) => {
        if (error || !characteristic?.value) return;
        const data = fromBase64(characteristic.value!);
        const pkt = decodePacket(data);
        if (!pkt) return;
        if (pkt.messageClass === 0xff && pkt.messageId === 0x21) {
          const history = decodeLiveData(pkt.payload);
          if (history) onData(history);
        }
      }
    );
    return () => subscription.remove();
  }

  /**
   * Subscribe to state change messages (pause/start/stop events, 0xFF 0x26).
   * Calls onChange for each valid StateChangePayload message.
   * @param onChange Callback for each state change
   * @returns Unsubscribe function
   */
  subscribeStateChanges(
    onChange: (data: StateChangePayload) => void
  ): () => void {
    const subscription = this.device.monitorCharacteristicForService(
      RACEBOX_UART_SERVICE_UUID,
      RACEBOX_UART_TX_UUID,
      (error, characteristic) => {
        if (error || !characteristic?.value) return;
        const data = fromBase64(characteristic.value!);
        const pkt = decodePacket(data);
        if (!pkt) return;
        if (pkt.messageClass === 0xff && pkt.messageId === 0x26) {
          const state = decodeStateChange(pkt.payload);
          if (state) onChange(state);
        }
      }
    );
    return () => subscription.remove();
  }

  /**
   * Subscribe to erase progress notifications (0xFF 0x24).
   * Calls onProgress for each valid EraseProgressPayload message.
   * @param onProgress Callback for each erase progress update
   * @returns Unsubscribe function
   */
  subscribeEraseProgress(
    onProgress: (progress: EraseProgressPayload) => void
  ): () => void {
    const subscription = this.device.monitorCharacteristicForService(
      RACEBOX_UART_SERVICE_UUID,
      RACEBOX_UART_TX_UUID,
      (error, characteristic) => {
        if (error || !characteristic?.value) return;
        const data = fromBase64(characteristic.value!);
        const pkt = decodePacket(data);
        if (!pkt) return;
        if (pkt.messageClass === 0xff && pkt.messageId === 0x24) {
          const progress = decodeEraseProgress(pkt.payload);
          if (progress) onProgress(progress);
        }
      }
    );
    return () => subscription.remove();
  }

  /**
   * Subscribe to ACK/NACK responses (0xFF 0x02/0x03).
   * Calls onAck for each valid AckNackPayload message.
   * @param onAck Callback for each ACK/NACK
   * @returns Unsubscribe function
   */
  subscribeAckNack(onAck: (ack: AckNackPayload) => void): () => void {
    const subscription = this.device.monitorCharacteristicForService(
      RACEBOX_UART_SERVICE_UUID,
      RACEBOX_UART_TX_UUID,
      (error, characteristic) => {
        if (error || !characteristic?.value) return;
        const data = fromBase64(characteristic.value!);
        const pkt = decodePacket(data);
        if (!pkt) return;
        if (
          pkt.messageClass === 0xff &&
          (pkt.messageId === 0x02 || pkt.messageId === 0x03)
        ) {
          const ack = decodeAckNack(pkt.payload);
          if (ack) onAck(ack);
        }
      }
    );
    return () => subscription.remove();
  }

  // --- NMEA Output ---
  /**
   * Subscribe to NMEA output (firmware 3.3+).
   * Calls onNmea for each NMEA sentence (string).
   * @param onNmea Callback for each NMEA sentence
   * @returns Unsubscribe function
   */
  subscribeNmeaOutput(onNmea: (nmea: string) => void): () => void {
    const subscription = this.device.monitorCharacteristicForService(
      RACEBOX_UART_SERVICE_UUID,
      RACEBOX_NMEA_TX_UUID,
      (error, characteristic) => {
        if (error || !characteristic?.value) return;
        // NMEA is sent as a single notification, base64 encoded
        const nmea =
          typeof Buffer !== 'undefined'
            ? Buffer.from(characteristic.value, 'base64').toString('utf-8')
            : atob(characteristic.value);
        onNmea(nmea);
      }
    );
    return () => subscription.remove();
  }

  // --- Device Info ---
  /**
   * Read device information (model, serial, firmware, hardware, manufacturer).
   * Reads Device Information Service characteristics by UUID.
   * @returns Object with model, serial, firmware, hardware, manufacturer or null on error
   */
  async readDeviceInfo(): Promise<{
    model?: string;
    serial?: string;
    firmware?: string;
    hardware?: string;
    manufacturer?: string;
  } | null> {
    const SERVICE = '0000180a-0000-1000-8000-00805f9b34fb';
    const UUIDS = {
      model: '00002a24-0000-1000-8000-00805f9b34fb',
      serial: '00002a25-0000-1000-8000-00805f9b34fb',
      firmware: '00002a26-0000-1000-8000-00805f9b34fb',
      hardware: '00002a27-0000-1000-8000-00805f9b34fb',
      manufacturer: '00002a29-0000-1000-8000-00805f9b34fb',
    };
    try {
      const [model, serial, firmware, hardware, manufacturer] =
        await Promise.all([
          this.device.readCharacteristicForService(SERVICE, UUIDS.model),
          this.device.readCharacteristicForService(SERVICE, UUIDS.serial),
          this.device.readCharacteristicForService(SERVICE, UUIDS.firmware),
          this.device.readCharacteristicForService(SERVICE, UUIDS.hardware),
          this.device.readCharacteristicForService(SERVICE, UUIDS.manufacturer),
        ]);
      const decode = (c: any) =>
        c?.value
          ? typeof Buffer !== 'undefined'
            ? Buffer.from(c.value, 'base64').toString('utf-8')
            : atob(c.value)
          : undefined;
      return {
        model: decode(model),
        serial: decode(serial),
        firmware: decode(firmware),
        hardware: decode(hardware),
        manufacturer: decode(manufacturer),
      };
    } catch {
      return null;
    }
  }
}
