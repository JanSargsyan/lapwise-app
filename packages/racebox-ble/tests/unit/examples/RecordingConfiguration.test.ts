import { RaceBoxMessageFactoryAdapter } from '../../../src/adapters/secondary/protocol/RaceBoxMessageFactoryAdapter';
import { RecordingConfiguration } from '../../../src/domain/entities/RecordingConfiguration';

describe('Recording Configuration Example', () => {
  let messageFactory: RaceBoxMessageFactoryAdapter;

  beforeEach(() => {
    messageFactory = new RaceBoxMessageFactoryAdapter();
  });

  describe('Recommended Setup Example', () => {
    it('should create recording configuration packet with recommended settings', () => {
      const recommendedConfig: RecordingConfiguration = {
        enabled: true,
        dataRate: 0, // 25Hz
        filters: {
          minSpeed: 0,
          maxSpeed: 300,
          minAccuracy: 5,
          enableAccelerometer: true,
          enableGyroscope: true,
          enableMagnetometer: false
        },
        thresholds: {
          speedThreshold: 5,
          accelerationThreshold: 0.1,
          rotationThreshold: 1.0
        },
        timeouts: {
          startDelay: 0,
          stopDelay: 0,
          autoStop: 300
        }
      };

      const message = messageFactory.createRecordingConfigSet(recommendedConfig);

      expect(message).toBeDefined();
      expect(typeof message).toBe('object');
    });
  });

  describe('Data Rate Configuration', () => {
    it('should create config messages with different data rates', () => {
      const dataRates = [
        { value: 0, description: '25Hz' },
        { value: 1, description: '10Hz' },
        { value: 2, description: '5Hz' },
        { value: 3, description: '1Hz' },
        { value: 4, description: '20Hz' }
      ];

      dataRates.forEach(({ value }) => {
        const config: RecordingConfiguration = {
          enabled: true,
          dataRate: value,
          filters: {
            minSpeed: 0,
            maxSpeed: 300,
            minAccuracy: 5,
            enableAccelerometer: true,
            enableGyroscope: true,
            enableMagnetometer: false
          },
          thresholds: {
            speedThreshold: 5,
            accelerationThreshold: 0.1,
            rotationThreshold: 1.0
          },
          timeouts: {
            startDelay: 0,
            stopDelay: 0,
            autoStop: 300
          }
        };

        const message = messageFactory.createRecordingConfigSet(config);
        expect(message).toBeDefined();
        expect(typeof message).toBe('object');
      });
    });
  });

  describe('Filter Configuration', () => {
    it('should create config messages with different filter settings', () => {
      const testCases = [
        {
          name: 'Basic filters',
          filters: {
            minSpeed: 0,
            maxSpeed: 300,
            minAccuracy: 5,
            enableAccelerometer: true,
            enableGyroscope: true,
            enableMagnetometer: false
          }
        },
        {
          name: 'High precision filters',
          filters: {
            minSpeed: 0,
            maxSpeed: 200,
            minAccuracy: 2,
            enableAccelerometer: true,
            enableGyroscope: true,
            enableMagnetometer: true
          }
        },
        {
          name: 'Minimal filters',
          filters: {
            minSpeed: 0,
            maxSpeed: 500,
            minAccuracy: 10,
            enableAccelerometer: false,
            enableGyroscope: false,
            enableMagnetometer: false
          }
        }
      ];

      testCases.forEach(({ filters }) => {
        const config: RecordingConfiguration = {
          enabled: true,
          dataRate: 0,
          filters,
          thresholds: {
            speedThreshold: 5,
            accelerationThreshold: 0.1,
            rotationThreshold: 1.0
          },
          timeouts: {
            startDelay: 0,
            stopDelay: 0,
            autoStop: 300
          }
        };

        const message = messageFactory.createRecordingConfigSet(config);
        expect(message).toBeDefined();
        expect(typeof message).toBe('object');
      });
    });
  });

  describe('Threshold Configuration', () => {
    it('should create config messages with different speed thresholds', () => {
      const testCases = [
        { speedKmh: 0, speedMms: 0 },
        { speedKmh: 5, speedMms: 5000 },
        { speedKmh: 10, speedMms: 10000 },
        { speedKmh: 50, speedMms: 50000 },
        { speedKmh: 100, speedMms: 100000 }
      ];

      testCases.forEach(({ speedKmh }) => {
        const config: RecordingConfiguration = {
          enabled: true,
          dataRate: 0,
          filters: {
            minSpeed: 0,
            maxSpeed: 300,
            minAccuracy: 5,
            enableAccelerometer: true,
            enableGyroscope: true,
            enableMagnetometer: false
          },
          thresholds: {
            speedThreshold: speedKmh,
            accelerationThreshold: 0.1,
            rotationThreshold: 1.0
          },
          timeouts: {
            startDelay: 0,
            stopDelay: 0,
            autoStop: 300
          }
        };

        const message = messageFactory.createRecordingConfigSet(config);
        expect(message).toBeDefined();
        expect(typeof message).toBe('object');
      });
    });
  });

  describe('Timeout Configuration', () => {
    it('should create config messages with different timeout settings', () => {
      const config: RecordingConfiguration = {
        enabled: true,
        dataRate: 0,
        filters: {
          minSpeed: 0,
          maxSpeed: 300,
          minAccuracy: 5,
          enableAccelerometer: true,
          enableGyroscope: true,
          enableMagnetometer: false
        },
        thresholds: {
          speedThreshold: 5,
          accelerationThreshold: 0.1,
          rotationThreshold: 1.0
        },
        timeouts: {
          startDelay: 30,
          stopDelay: 60,
          autoStop: 300
        }
      };

      const message = messageFactory.createRecordingConfigSet(config);
      expect(message).toBeDefined();
      expect(typeof message).toBe('object');
    });

    it('should handle zero timeouts', () => {
      const config: RecordingConfiguration = {
        enabled: true,
        dataRate: 0,
        filters: {
          minSpeed: 0,
          maxSpeed: 300,
          minAccuracy: 5,
          enableAccelerometer: true,
          enableGyroscope: true,
          enableMagnetometer: false
        },
        thresholds: {
          speedThreshold: 5,
          accelerationThreshold: 0.1,
          rotationThreshold: 1.0
        },
        timeouts: {
          startDelay: 0,
          stopDelay: 0,
          autoStop: 0
        }
      };

      const message = messageFactory.createRecordingConfigSet(config);
      expect(message).toBeDefined();
      expect(typeof message).toBe('object');
    });

    it('should handle maximum timeout values', () => {
      const config: RecordingConfiguration = {
        enabled: true,
        dataRate: 0,
        filters: {
          minSpeed: 0,
          maxSpeed: 300,
          minAccuracy: 5,
          enableAccelerometer: true,
          enableGyroscope: true,
          enableMagnetometer: false
        },
        thresholds: {
          speedThreshold: 5,
          accelerationThreshold: 0.1,
          rotationThreshold: 1.0
        },
        timeouts: {
          startDelay: 65535,
          stopDelay: 65535,
          autoStop: 65535
        }
      };

      const message = messageFactory.createRecordingConfigSet(config);
      expect(message).toBeDefined();
      expect(typeof message).toBe('object');
    });
  });

  describe('Disabled Configuration', () => {
    it('should create disabled recording configuration', () => {
      const config: RecordingConfiguration = {
        enabled: false,
        dataRate: 0,
        filters: {
          minSpeed: 0,
          maxSpeed: 300,
          minAccuracy: 5,
          enableAccelerometer: true,
          enableGyroscope: true,
          enableMagnetometer: false
        },
        thresholds: {
          speedThreshold: 5,
          accelerationThreshold: 0.1,
          rotationThreshold: 1.0
        },
        timeouts: {
          startDelay: 0,
          stopDelay: 0,
          autoStop: 300
        }
      };

      const message = messageFactory.createRecordingConfigSet(config);
      expect(message).toBeDefined();
      expect(typeof message).toBe('object');
    });
  });

  describe('Edge Cases', () => {
    it('should handle extreme threshold values', () => {
      const config: RecordingConfiguration = {
        enabled: true,
        dataRate: 0,
        filters: {
          minSpeed: 0,
          maxSpeed: 300,
          minAccuracy: 5,
          enableAccelerometer: true,
          enableGyroscope: true,
          enableMagnetometer: false
        },
        thresholds: {
          speedThreshold: 65535, // Max UInt16
          accelerationThreshold: 255, // Max UInt8
          rotationThreshold: 65535 // Max UInt16
        },
        timeouts: {
          startDelay: 65535,
          stopDelay: 65535,
          autoStop: 65535
        }
      };

      const message = messageFactory.createRecordingConfigSet(config);
      expect(message).toBeDefined();
      expect(typeof message).toBe('object');
    });

    it('should handle minimal configuration', () => {
      const config: RecordingConfiguration = {
        enabled: true,
        dataRate: 0,
        filters: {
          minSpeed: 0,
          maxSpeed: 300,
          minAccuracy: 5,
          enableAccelerometer: false,
          enableGyroscope: false,
          enableMagnetometer: false
        },
        thresholds: {
          speedThreshold: 0,
          accelerationThreshold: 0,
          rotationThreshold: 0
        },
        timeouts: {
          startDelay: 0,
          stopDelay: 0,
          autoStop: 0
        }
      };

      const message = messageFactory.createRecordingConfigSet(config);
      expect(message).toBeDefined();
      expect(typeof message).toBe('object');
    });
  });
}); 