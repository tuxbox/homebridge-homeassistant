export type AccessoryConfigurationEvent<T> = {
  topic: string;
  payload: T;
};