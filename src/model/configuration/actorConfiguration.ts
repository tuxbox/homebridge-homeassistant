import { DeviceConfiguration } from './device-configuration';

export type ActorConfiguration = DeviceConfiguration & {

  command_topic : string;

};