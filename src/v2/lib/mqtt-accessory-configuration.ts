import { AccessoryConfiguration } from './accessory-configuration';

export type MqttAccessoryConfiguration = AccessoryConfiguration & {

  state_topic: string;

};