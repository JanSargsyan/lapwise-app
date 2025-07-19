import { BleManager } from 'react-native-ble-plx';
import { RaceBoxRepositoryImpl } from '@/src/data/repository/RaceBoxRepositoryImpl';
import { DeviceStorageRepositoryImpl } from '@/src/data/repository/DeviceStorageRepository';
import { BLERespositoryImpl } from '@/src/data/repository/BLERespositoryImpl';
import { ConnectToClosestDeviceUseCase } from '@/src/usecase/ConnectToClosestDeviceUseCase';
import { GetLiveDataUseCase } from '@/src/usecase/GetLiveDataUseCase';
import { GetConnectedDeviceInfoUseCase } from '@/src/usecase/GetConnectedDeviceInfoUseCase';
import { DeviceRepositoryProvider } from '@/src/domain/DeviceRepositoryProvider';
import BleService from '@/src/data/service/BleService';

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