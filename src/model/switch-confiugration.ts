import { DeviceConfiguration } from './device-configuration';

export type SwitchConfiguration = DeviceConfiguration & {

  value_template: string;
  payload_on: string;
  payload_off: string;
  command_topic: string;

};