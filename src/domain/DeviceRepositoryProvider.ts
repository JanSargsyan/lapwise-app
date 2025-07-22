// import { DeviceType } from "@/src/domain/model/device/Device";
// import { DeviceRepository } from "@/src/domain/repository/DeviceRepository";
// import { DeviceStorageRepository } from "@/src/domain/repository/DeviceStorageRepository";
// import { RaceBoxRepository } from "@/src/domain/repository/RaceBoxRepository";

// export class DeviceRepositoryProvider {

//     constructor(
//         private deviceStorageRepository: DeviceStorageRepository,
//         private raceBoxRepository: RaceBoxRepository
//     ) {}

//     async get(): Promise<DeviceRepository> {
//         const deviceType = await this.deviceStorageRepository.getConnectedDeviceType();

//         switch (deviceType) {
//             case DeviceType.RaceBoxMicro:
//             case DeviceType.RaceBoxMini:
//                 return this.raceBoxRepository;
//             default:
//                 throw new Error(`Unsupported device type: ${deviceType}`);
//         }
//     }
// }