import { useState, useEffect, useCallback, useRef } from 'react';
import { Device, DeviceData } from '../../domain/entities/Device';
import { DeviceUseCases } from '../../application/use-cases/DeviceUseCases';
import { Container } from '../../infrastructure/di/Container';
import { useDataRecording } from './useDataRecording';

export interface UseDeviceManagerReturn {
  // State
  devices: Device[];
  connectedDevices: Device[];
  isScanning: boolean;
  error: string | null;
  deviceData: Map<string, DeviceData>;
  
  // Actions
  startScan: () => Promise<void>;
  stopScan: () => Promise<void>;
  connectToDevice: (deviceId: string) => Promise<void>;
  disconnectFromDevice: (deviceId: string) => Promise<void>;
  clearError: () => void;
  setEnableRealBLE?: (enable: boolean) => void;
  getEnableRealBLE?: () => boolean;
  checkBLEAvailability?: () => Promise<{ available: boolean; error?: string }>;
  
  // Utilities
  getDeviceData: (deviceId: string) => DeviceData | undefined;
  isConnected: (deviceId: string) => boolean;
}

export function useDeviceManager(enableRealBLE: boolean = true): UseDeviceManagerReturn {
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevices, setConnectedDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceData, setDeviceData] = useState<Map<string, DeviceData>>(new Map());
  
  const deviceUseCases = useRef<DeviceUseCases | null>(null);
  const dataCallbacks = useRef<Map<string, (data: DeviceData) => void>>(new Map());
  const repositoryRef = useRef<any>(null);

  // Get data recording hook
  const { recordDataPoint, isRecording } = useDataRecording();
  
  // Store the latest recording functions in refs to avoid stale closures
  const recordingFunctionsRef = useRef({ recordDataPoint, isRecording });
  recordingFunctionsRef.current = { recordDataPoint, isRecording };

  // Initialize device use cases
  useEffect(() => {
    const container = Container.getInstance();
    const repository = container.getDeviceRepository();
    repositoryRef.current = repository;
    if (repository.setEnableRealBLE) {
      repository.setEnableRealBLE(enableRealBLE);
    }
    deviceUseCases.current = new DeviceUseCases(repository);
    
    return () => {
      if (deviceUseCases.current) {
        deviceUseCases.current.cleanup();
      }
    };
  }, [enableRealBLE]);

  // Update scanning state
  useEffect(() => {
    if (deviceUseCases.current) {
      setIsScanning(deviceUseCases.current.isScanning());
    }
  }, [devices]);

  const startScan = useCallback(async () => {
    if (!deviceUseCases.current) return;
    
    try {
      setError(null);
      await deviceUseCases.current.scanForDevices();
      setIsScanning(true);
    } catch (err: any) {
      setError(err.message || 'Failed to start scanning');
    }
  }, []);

  const stopScan = useCallback(async () => {
    if (!deviceUseCases.current) return;
    
    try {
      await deviceUseCases.current.stopScanning();
      setIsScanning(false);
    } catch (err: any) {
      setError(err.message || 'Failed to stop scanning');
    }
  }, []);

  const connectToDevice = useCallback(async (deviceId: string) => {
    if (!deviceUseCases.current) return;
    
    try {
      setError(null);
      await deviceUseCases.current.connectToDevice(deviceId);
      
      // Set up data callback
      const dataCallback = (data: DeviceData) => {
        console.log('🔧 useDeviceManager: Received data for device:', deviceId, 'Data:', data);
        setDeviceData(prev => new Map(prev).set(deviceId, data));
        
        // Automatically record data if recording is active for this device
        const { isRecording, recordDataPoint } = recordingFunctionsRef.current;
        if (isRecording(deviceId)) {
          console.log('🔧 useDeviceManager: Recording data for device:', deviceId);
          recordDataPoint(deviceId, data);
        } else {
          console.log('🔧 useDeviceManager: Not recording for device:', deviceId, 'isRecording:', isRecording(deviceId));
        }
      };
      
      deviceUseCases.current.onDeviceDataReceived(deviceId, dataCallback);
      dataCallbacks.current.set(deviceId, dataCallback);
      
      // Update connected devices
      const connected = await deviceUseCases.current.getConnectedDevices();
      setConnectedDevices(connected);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to device');
    }
  }, []);

  const disconnectFromDevice = useCallback(async (deviceId: string) => {
    if (!deviceUseCases.current) return;
    
    try {
      setError(null);
      
      // Remove data callback
      const callback = dataCallbacks.current.get(deviceId);
      if (callback) {
        deviceUseCases.current.offDeviceDataReceived(deviceId, callback);
        dataCallbacks.current.delete(deviceId);
      }
      
      await deviceUseCases.current.disconnectFromDevice(deviceId);
      
      // Remove device data
      setDeviceData(prev => {
        const newMap = new Map(prev);
        newMap.delete(deviceId);
        return newMap;
      });
      
      // Update connected devices
      const connected = await deviceUseCases.current.getConnectedDevices();
      setConnectedDevices(connected);
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect from device');
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getDeviceData = useCallback((deviceId: string): DeviceData | undefined => {
    return deviceData.get(deviceId);
  }, [deviceData]);

  const isConnected = useCallback((deviceId: string): boolean => {
    return deviceUseCases.current?.isConnected(deviceId) || false;
  }, []);

  const checkBLEAvailability = useCallback(async (): Promise<{ available: boolean; error?: string }> => {
    if (!repositoryRef.current?.checkBLEAvailability) {
      return { available: false, error: 'BLE availability check not supported' };
    }
    return await repositoryRef.current.checkBLEAvailability();
  }, []);

  // Poll for device updates
  useEffect(() => {
    const pollDevices = async () => {
      if (!deviceUseCases.current) return;
      
      try {
        const scanned = await deviceUseCases.current.getScannedDevices();
        setDevices(scanned);
        
        const connected = await deviceUseCases.current.getConnectedDevices();
        setConnectedDevices(connected);
      } catch (err) {
        console.error('Error polling devices:', err);
      }
    };

    const interval = setInterval(pollDevices, 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    devices,
    connectedDevices,
    isScanning,
    error,
    deviceData,
    startScan,
    stopScan,
    connectToDevice,
    disconnectFromDevice,
    clearError,
    getDeviceData,
    isConnected,
    setEnableRealBLE: repositoryRef.current?.setEnableRealBLE?.bind(repositoryRef.current),
    getEnableRealBLE: repositoryRef.current?.getEnableRealBLE?.bind(repositoryRef.current),
    checkBLEAvailability,
  };
} 