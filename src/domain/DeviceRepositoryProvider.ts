import { DeviceType } from "./model/DeviceType";
import { DeviceRepository } from "./repository/DeviceRepository";
import { DeviceStorageRepository } from "./repository/DeviceStorageRepository";
import { RaceBoxRepository } from "./repository/RaceBoxRepository";

export class DeviceRepositoryProvider {

    constructor(
        private deviceStorageRepository: DeviceStorageRepository,
        private raceBoxRepository: RaceBoxRepository
    ) {}

    async get(): Promise<DeviceRepository> {
        const deviceType = await this.deviceStorageRepository.getConnectedDeviceType();

        switch (deviceType) {
            case DeviceType.RACEBOX:
                return this.raceBoxRepository;
            default:
                throw new Error(`Unsupported device type: ${deviceType}`);
        }
    }
}