import { DeviceStorageRepository } from '@/src/domain/repository/DeviceStorageRepository';
import { BleManager, Device } from 'react-native-ble-plx';

class BleService {

    constructor(
        private manager: BleManager,
        private deviceStorageRepository: DeviceStorageRepository
    ) { }

    private async getDevice(): Promise<Device | null> {
        const id = await this.deviceStorageRepository.getConnectedDeviceId();
        if (!id) return null;
        try {
            const device = await this.manager.devices([id]);
            return device && device.length > 0 ? device[0] : null;
        } catch {
            return null;
        }
    }

    async getConnectedDevice(): Promise<Device> {
        const found = await this.getDevice();
        if (!found) throw new Error('Device not found');
        let connected = found;
        if (typeof found.isConnected === 'function') {
            const isConnected = await found.isConnected();
            if (!isConnected) {
                connected = await found.connect();
            }
        }
        if (typeof connected.discoverAllServicesAndCharacteristics === 'function') {
            connected = await connected.discoverAllServicesAndCharacteristics();
        }
        return connected;
    }

    async disconnectDevice(): Promise<void> {
        const found = await this.getDevice();
        if (found) {
            await found.cancelConnection();
        }
    }

    async isDeviceConnected(): Promise<boolean> {
        const found = await this.getDevice();
        if (!found) return false;
        if (typeof found.isConnected === 'function') {
            return found.isConnected();
        }
        return false;
    }
}

export default BleService;