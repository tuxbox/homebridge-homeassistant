import { DeviceConfiguration } from '../configuration/device-configuration';

export type AccessoryConfigurationEvent<T extends DeviceConfiguration> = {
  topic: string;
  deviceType: string;
  payload: T;
};