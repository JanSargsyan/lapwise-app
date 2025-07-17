import { RaceBoxApi } from './RaceBoxApi';
import { Device } from 'react-native-ble-plx';
import {
  RACEBOX_UART_SERVICE_UUID,
  RACEBOX_UART_RX_UUID,
  RACEBOX_UART_TX_UUID,
  encodePacket,
} from './protocol/messages';
import { toBase64 } from './utils';
import type { GnssConfigPayload } from './protocol/types';

describe('RaceBoxApi.readGnssConfig', () => {
  it('sends the correct packet and decodes GNSS config', async () => {
    // Prepare expected packet and response
    const gnssPayload = new Uint8Array([4, 1, 5]); // platformModel=4, enable3DSpeed=true, minHorizontalAccuracy=5
    const expectedPacket = encodePacket(0xff, 0x27, new Uint8Array([]));
    const responsePacket = encodePacket(0xff, 0x27, gnssPayload);
    const base64Response = toBase64(responsePacket);

    // Mock BLE device
    const writeMock = jest.fn().mockResolvedValue(undefined);
    const monitorMock = jest.fn((_svc, _char, cb) => {
      // Simulate GNSS config notification
      setTimeout(() => cb(null, { value: base64Response }), 0);
      return { remove: jest.fn() };
    });
    const device = {
      writeCharacteristicWithResponseForService: writeMock,
      monitorCharacteristicForService: monitorMock,
    } as unknown as Device;
    const api = new RaceBoxApi(device);

    const result = await api.readGnssConfig();
    expect(writeMock).toHaveBeenCalledWith(
      RACEBOX_UART_SERVICE_UUID,
      RACEBOX_UART_RX_UUID,
      toBase64(expectedPacket)
    );
    expect(monitorMock).toHaveBeenCalledWith(
      RACEBOX_UART_SERVICE_UUID,
      RACEBOX_UART_TX_UUID,
      expect.any(Function)
    );
    const expected: GnssConfigPayload = {
      platformModel: 4,
      enable3DSpeed: true,
      minHorizontalAccuracy: 5,
    };
    expect(result).toEqual(expected);
  });
});
