import { BleManager } from 'react-native-ble-plx';
import { RaceBoxService } from '../data/service/RaceBoxService';
import { RaceBoxRepositoryImpl } from '../data/repository/RaceBoxRepositoryImpl';
import { DeviceStorageRepositoryImpl } from '../data/repository/DeviceStorageRepository';
import { BLERespositoryImpl } from '../data/repository/BLERespositoryImpl';
import { ConnectToClosestDeviceUseCase } from './use-cases/ConnectToClosestDeviceUseCase';
import { GetLiveDataUseCase } from './use-cases/GetLiveDataUseCase';
import { GetConnectedDeviceInfoUseCase } from './use-cases/GetConnectedDeviceInfoUseCase';
import { DeviceRepositoryProvider } from '../domain/DeviceRepositoryProvider';

const btManager = new BleManager();

const deviceStorageRepository = new DeviceStorageRepositoryImpl();

const bleRepository = new BLERespositoryImpl(btManager, deviceStorageRepository)
const raceBoxService = new RaceBoxService(bleRepository);

const raceBoxRepository = new RaceBoxRepositoryImpl(raceBoxService);

const deviceRepositoryProvider = new DeviceRepositoryProvider(deviceStorageRepository, raceBoxRepository);

const connectToClosestDeviceUseCase = new ConnectToClosestDeviceUseCase(bleRepository);
// TODO: Add repository provider that will inject racebox/mock repository to the use cases
const getLiveDataUseCase = new GetLiveDataUseCase(deviceRepositoryProvider);
const getConnectedDeviceInfoUseCase = new GetConnectedDeviceInfoUseCase(deviceRepositoryProvider);


export const container = {
    connectToClosestDeviceUseCase: connectToClosestDeviceUseCase,
    getLiveDataUseCase: getLiveDataUseCase,
    getConnectedDeviceInfoUseCase: getConnectedDeviceInfoUseCase
}