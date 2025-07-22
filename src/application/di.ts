import { BleManager } from 'react-native-ble-plx';
import { RaceBoxRepositoryImpl } from '@/src/data/repository/RaceBoxRepositoryImpl';
import { DeviceStorageRepositoryImpl } from '@/src/data/repository/DeviceStorageRepository';
import { BLERespositoryImpl } from '@/src/data/repository/BLERespositoryImpl';
import { ConnectToBLEDeviceUseCase } from '@/src/usecase/ConnectToBLEDeviceUseCase';
import { GetLiveDataUseCase } from '@/src/usecase/GetLiveDataUseCase';
import { GetConnectedDeviceInfoUseCase } from '@/src/usecase/GetConnectedDeviceInfoUseCase';
import { DeviceRepositoryProvider } from '@/src/domain/DeviceRepositoryProvider';
import BleService from '@/src/data/service/BleService';
import { ScanForBLEDevicesUseCase } from '@/src/usecase/ScanForBLEDevicesUseCase';
import { AddDeviceToCacheUseCase } from '@/src/usecase/AddDeviceToCacheUseCase';

const btManager = new BleManager();

const deviceStorageRepository = new DeviceStorageRepositoryImpl();

const bleRepository = new BLERespositoryImpl(btManager, deviceStorageRepository)
const bleService = new BleService(btManager, deviceStorageRepository);

const raceBoxRepository = new RaceBoxRepositoryImpl(bleService);

const deviceRepositoryProvider = new DeviceRepositoryProvider(deviceStorageRepository, raceBoxRepository);


// TODO: Add repository provider that will inject racebox/mock repository to the use cases
const getLiveDataUseCase = new GetLiveDataUseCase(deviceRepositoryProvider);
const getConnectedDeviceInfoUseCase = new GetConnectedDeviceInfoUseCase(deviceRepositoryProvider);

const connectToBLEDeviceUseCase = new ConnectToBLEDeviceUseCase(bleRepository);
const scanForBLEDevicesUseCase = new ScanForBLEDevicesUseCase(bleRepository);
const addDeviceToCacheUseCase = new AddDeviceToCacheUseCase(deviceStorageRepository);


export const container = {
    getLiveDataUseCase: getLiveDataUseCase,
    getConnectedDeviceInfoUseCase: getConnectedDeviceInfoUseCase,
    connectToBLEDeviceUseCase: connectToBLEDeviceUseCase,
    scanForBLEDevicesUseCase: scanForBLEDevicesUseCase,
    addDeviceToCacheUseCase: addDeviceToCacheUseCase
}