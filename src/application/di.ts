import { BleManager } from 'react-native-ble-plx';
import { RaceBoxRepositoryImpl } from '../data/repository/RaceBoxRepositoryImpl';
import { DeviceStorageRepositoryImpl } from '../data/repository/DeviceStorageRepository';
import { BLERespositoryImpl } from '../data/repository/BLERespositoryImpl';
import { ConnectToClosestDeviceUseCase } from '../usecase/ConnectToClosestDeviceUseCase';
import { GetLiveDataUseCase } from '../usecase/GetLiveDataUseCase';
import { GetConnectedDeviceInfoUseCase } from '../usecase/GetConnectedDeviceInfoUseCase';
import { DeviceRepositoryProvider } from '../domain/DeviceRepositoryProvider';
import BleService from '../data/service/BleService';

const btManager = new BleManager();

const deviceStorageRepository = new DeviceStorageRepositoryImpl();

const bleRepository = new BLERespositoryImpl(btManager, deviceStorageRepository)
const bleService = new BleService(btManager, deviceStorageRepository);

const raceBoxRepository = new RaceBoxRepositoryImpl(bleService);

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