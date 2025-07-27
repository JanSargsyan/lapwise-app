export interface ConfigOptions {
  [key: string]: any;
}

export class ConfigManager {
  private config: ConfigOptions = {};

  set(key: string, value: any): void {
    this.config[key] = value;
  }

  get<T>(key: string, defaultValue?: T): T {
    return this.config[key] ?? defaultValue;
  }

  has(key: string): boolean {
    return key in this.config;
  }

  remove(key: string): void {
    delete this.config[key];
  }

  clear(): void {
    this.config = {};
  }

  getAll(): ConfigOptions {
    return { ...this.config };
  }
} 