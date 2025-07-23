import { BleManager } from 'react-native-ble-plx';
// import { RaceBoxRepositoryImpl } from '@/src/data/repository/RaceBoxRepositoryImpl';
import { DeviceStorageRepositoryImpl } from '@/src/data/repository/DeviceStorageRepository';
import { BLERespositoryImpl } from '@/src/data/repository/BLERespositoryImpl';
import { ConnectToBLEDeviceUseCase } from '@/src/usecase/ble/ConnectToBLEDeviceUseCase';
// import { GetLiveDataUseCase } from '@/src/usecase/GetLiveDataUseCase';
// import { GetConnectedDeviceInfoUseCase } from '@/src/usecase/ble/GetConnectedDeviceInfoUseCase';
// import { DeviceRepositoryProvider } from '@/src/domain/DeviceRepositoryProvider';
// import BleService from '@/src/data/service/BleService';
import { ScanForBLEDevicesUseCase } from '@/src/usecase/ble/ScanForBLEDevicesUseCase';
import { AddDeviceToCacheUseCase } from '@/src/usecase/cache/AddDeviceToCacheUseCase';
import { GetCachedDevicesUseCase } from '@/src/usecase/cache/GetCachedDevicesUseCase';
import { RemoveDeviceFromCacheUseCase } from '@/src/usecase/cache/RemoveDeviceFromCacheUseCase';
import { IsBLEDeviceConnectedUseCase } from '@/src/usecase/ble/IsBLEDeviceConnectedUseCase';
import { AddAndConnectToBleDeviceUseCase } from '@/src/usecase/ble/AddAndConnectToBleDeviceUseCase';
import { DisconnectFromDeviceUseCase } from '@/src/usecase/ble/DisconnectFromDeviceUseCase';

const btManager = new BleManager();

const deviceStorageRepository = new DeviceStorageRepositoryImpl();

const bleRepository = new BLERespositoryImpl(btManager)
// const bleService = new BleService(btManager, deviceStorageRepository);

// const raceBoxRepository = new RaceBoxRepositoryImpl(bleService);

// const deviceRepositoryProvider = new DeviceRepositoryProvider(deviceStorageRepository, raceBoxRepository);


// TODO: Add repository provider that will inject racebox/mock repository to the use cases
// const getLiveDataUseCase = new GetLiveDataUseCase(deviceRepositoryProvider);
// const getConnectedDeviceInfoUseCase = new GetConnectedDeviceInfoUseCase(deviceRepositoryProvider);
const getCachedDevicesUseCase = new GetCachedDevicesUseCase(deviceStorageRepository);
const removeDeviceFromCacheUseCase = new RemoveDeviceFromCacheUseCase(deviceStorageRepository);

const connectToBLEDeviceUseCase = new ConnectToBLEDeviceUseCase(bleRepository);
const scanForBLEDevicesUseCase = new ScanForBLEDevicesUseCase(bleRepository);
const addDeviceToCacheUseCase = new AddDeviceToCacheUseCase(deviceStorageRepository);
const isBLEDeviceConnectedUseCase = new IsBLEDeviceConnectedUseCase(bleRepository);
const addAndConnectToBleDeviceUseCase = new AddAndConnectToBleDeviceUseCase(addDeviceToCacheUseCase, connectToBLEDeviceUseCase);
const disconnectFromDeviceUseCase = new DisconnectFromDeviceUseCase(bleRepository);

export const container = {
    ble: {
        connectToBLEDeviceUseCase: connectToBLEDeviceUseCase,
        scanForBLEDevicesUseCase: scanForBLEDevicesUseCase,
        isBLEDeviceConnectedUseCase: isBLEDeviceConnectedUseCase,
        addAndConnectToBleDeviceUseCase: addAndConnectToBleDeviceUseCase,
        disconnectFromDeviceUseCase: disconnectFromDeviceUseCase
    },
    cache: {
        addDeviceToCacheUseCase: addDeviceToCacheUseCase,
        getCachedDevicesUseCase: getCachedDevicesUseCase,
        removeDeviceFromCacheUseCase: removeDeviceFromCacheUseCase
    }
    // getLiveDataUseCase: getLiveDataUseCase,
    // getConnectedDeviceInfoUseCase: getConnectedDeviceInfoUseCase,
}