// Validation utilities
export class ValidationUtils {
  static isValidLatitude(latitude: number): boolean {
    return latitude >= -90 && latitude <= 90;
  }

  static isValidLongitude(longitude: number): boolean {
    return longitude >= -180 && longitude <= 180;
  }

  static isValidSpeed(speed: number): boolean {
    return speed >= 0 && speed <= 1000; // 0-1000 km/h
  }

  static isValidHeading(heading: number): boolean {
    return heading >= 0 && heading <= 360;
  }

  static isValidBatteryLevel(level: number): boolean {
    return level >= 0 && level <= 100;
  }

  static isValidTemperature(temperature: number): boolean {
    return temperature >= -40 && temperature <= 85;
  }

  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
} 