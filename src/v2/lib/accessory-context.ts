import { CharacteristicValue } from 'homebridge';
import { AccessoryConfiguration } from './accessory-configuration';

export type AccessoryContext<Configuration extends AccessoryConfiguration> = {
  __persisted_state : Map<string, CharacteristicValue>;
  configuration: Configuration;
};

export type ActorContext<Configuration extends AccessoryConfiguration> = AccessoryContext<Configuration> & {
  __persisted_target_state : Map<string, CharacteristicValue>;
};