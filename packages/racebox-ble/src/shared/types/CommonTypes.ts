// Common types used across the application
export type Optional<T> = T | undefined;
export type Nullable<T> = T | null;

export interface Result<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

export interface AsyncResult<T, E = Error> extends Promise<Result<T, E>> {}

export type Callback<T> = (value: T) => void;
export type AsyncCallback<T> = (value: T) => Promise<void>; 