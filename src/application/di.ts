import { BleManager } from 'react-native-ble-plx';
import { RaceBoxService } from '../data/service/RaceBoxService';
import { RaceBoxRepositoryImpl } from '../data/repository/RaceBoxRepositoryImpl';
import { DeviceStorageRepositoryImpl } from '../data/repository/DeviceStorageRepository';
import { BLERespositoryImpl } from '../data/repository/BLERespositoryImpl';
import { ConnectToClosestRaceBoxUseCase } from './use-cases/ConnectToClosestRaceBoxUseCase';
import { GetLiveDataUseCase } from './use-cases/GetLiveDataUseCase';
import { GetConnectedDeviceInfoUseCase } from './use-cases/GetConnectedDeviceInfoUseCase';

const btManager = new BleManager();

const deviceStorageRepository = new DeviceStorageRepositoryImpl();

const bleRepository = new BLERespositoryImpl(btManager, deviceStorageRepository)
const raceBoxService = new RaceBoxService(bleRepository);

const raceBoxRepository = new RaceBoxRepositoryImpl(raceBoxService);

const connectToClosestRaceBoxUseCase = new ConnectToClosestRaceBoxUseCase(bleRepository);
// TODO: Add repository provider that will inject racebox/mock repository to the use cases
const getLiveDataUseCase = new GetLiveDataUseCase(raceBoxRepository);
const getConnectedDeviceInfoUseCase = new GetConnectedDeviceInfoUseCase(raceBoxRepository);


export const container = {
    connectToClosestRaceBoxUseCase: connectToClosestRaceBoxUseCase,
    getLiveDataUseCase: getLiveDataUseCase,
    getConnectedDeviceInfoUseCase: getConnectedDeviceInfoUseCase
}