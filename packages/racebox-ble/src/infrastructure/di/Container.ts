export interface ServiceProvider<T> {
  get(): T;
}

export class Container {
  private services = new Map<string, ServiceProvider<any>>();

  register<T>(name: string, provider: ServiceProvider<T>): void {
    this.services.set(name, provider);
  }

  get<T>(name: string): T {
    const provider = this.services.get(name);
    if (!provider) {
      throw new Error(`Service '${name}' not found`);
    }
    return provider.get();
  }

  has(name: string): boolean {
    return this.services.has(name);
  }

  clear(): void {
    this.services.clear();
  }
} 