import { BleManager } from 'react-native-ble-plx';
import { DeviceStorageRepositoryImpl } from '@/src/data/repository/DeviceStorageRepository';
import { BLERespositoryImpl } from '@/src/data/repository/BLERespositoryImpl';
import { ConnectToBLEDeviceUseCase } from '@/src/usecase/ble/ConnectToBLEDeviceUseCase';
import { ScanForBLEDevicesUseCase } from '@/src/usecase/ble/ScanForBLEDevicesUseCase';
import { AddDeviceToCacheUseCase } from '@/src/usecase/cache/AddDeviceToCacheUseCase';
import { GetCachedDevicesUseCase } from '@/src/usecase/cache/GetCachedDevicesUseCase';
import { RemoveDeviceFromCacheUseCase } from '@/src/usecase/cache/RemoveDeviceFromCacheUseCase';
import { IsBLEDeviceConnectedUseCase } from '@/src/usecase/ble/IsBLEDeviceConnectedUseCase';
import { AddAndConnectToBleDeviceUseCase } from '@/src/usecase/ble/AddAndConnectToBleDeviceUseCase';
import { DisconnectFromDeviceUseCase } from '@/src/usecase/ble/DisconnectFromDeviceUseCase';
import { DisconnectAndRemoveBLEDeviceUseCase } from '@/src/usecase/ble/DisconnectAndRemoveBLEDeviceUseCase';
import { RaceBoxRepositoryImpl } from '@/src/data/repository/RaceBoxRepositoryImpl';
import { ReadRecordingConfigUseCase } from '@/src/usecase/racebox/ReadRecordingConfigUseCase';
import { SetRecordingConfigUseCase } from '@/src/usecase/racebox/SetRecordingConfigUseCase';
import { StartRecordingUseCase } from '@/src/usecase/racebox/StartRecordingUseCase';
import { StopRecordingUseCase } from '@/src/usecase/racebox/StopRecordingUseCase';

const btManager = new BleManager();

const deviceStorageRepository = new DeviceStorageRepositoryImpl();
const bleRepository = new BLERespositoryImpl(btManager);
const raceBoxRepository = new RaceBoxRepositoryImpl(btManager);

const getCachedDevicesUseCase = new GetCachedDevicesUseCase(deviceStorageRepository);
const removeDeviceFromCacheUseCase = new RemoveDeviceFromCacheUseCase(deviceStorageRepository);

const connectToBLEDeviceUseCase = new ConnectToBLEDeviceUseCase(bleRepository);
const scanForBLEDevicesUseCase = new ScanForBLEDevicesUseCase(bleRepository);
const addDeviceToCacheUseCase = new AddDeviceToCacheUseCase(deviceStorageRepository);
const isBLEDeviceConnectedUseCase = new IsBLEDeviceConnectedUseCase(bleRepository);
const addAndConnectToBleDeviceUseCase = new AddAndConnectToBleDeviceUseCase(addDeviceToCacheUseCase, connectToBLEDeviceUseCase);
const disconnectFromDeviceUseCase = new DisconnectFromDeviceUseCase(bleRepository);
const disconnectAndRemoveBleDeviceUseCase = new DisconnectAndRemoveBLEDeviceUseCase(removeDeviceFromCacheUseCase, disconnectFromDeviceUseCase, isBLEDeviceConnectedUseCase);

const readRecordingConfigUseCase = new ReadRecordingConfigUseCase(raceBoxRepository);
const setRecordingConfigUseCase = new SetRecordingConfigUseCase(raceBoxRepository);
const startRecordingUseCase = new StartRecordingUseCase(raceBoxRepository);
const stopRecordingUseCase = new StopRecordingUseCase(raceBoxRepository);

export const container = {
    ble: {
        connectToBLEDeviceUseCase: connectToBLEDeviceUseCase,
        scanForBLEDevicesUseCase: scanForBLEDevicesUseCase,
        isBLEDeviceConnectedUseCase: isBLEDeviceConnectedUseCase,
        addAndConnectToBleDeviceUseCase: addAndConnectToBleDeviceUseCase,
        disconnectFromDeviceUseCase: disconnectFromDeviceUseCase,
        disconnectAndRemoveBleDeviceUseCase: disconnectAndRemoveBleDeviceUseCase
    },
    cache: {
        addDeviceToCacheUseCase: addDeviceToCacheUseCase,
        getCachedDevicesUseCase: getCachedDevicesUseCase
    },
    racebox: {
        readRecordingConfigUseCase: readRecordingConfigUseCase,
        setRecordingConfigUseCase: setRecordingConfigUseCase,
        startRecordingUseCase: startRecordingUseCase,
        stopRecordingUseCase: stopRecordingUseCase
    }
}