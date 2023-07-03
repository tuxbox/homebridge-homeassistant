import { DeviceConfiguration } from './device-configuration';

export type SwitchConfiguration = DeviceConfiguration & {

  availability_topic: string;
  availability_template: string;
  json_attributes_topic: string;
  json_attributes_template: string;
  value_template: string;
  payload_on: string;
  payload_off: string;
  command_topic: string;

};