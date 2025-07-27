import { ServiceProvider } from './Container';

export class SingletonProvider<T> implements ServiceProvider<T> {
  private instance?: T;

  constructor(private factory: () => T) {}

  get(): T {
    if (!this.instance) {
      this.instance = this.factory();
    }
    return this.instance;
  }
}

export class FactoryProvider<T> implements ServiceProvider<T> {
  constructor(private factory: () => T) {}

  get(): T {
    return this.factory();
  }
} 