import { AccessoryConfiguration } from './accessory-configuration';

export type AccessoryContext<StateType, Configuration extends AccessoryConfiguration> = {
  __persisted_state : StateType;
  configuration: Configuration;
};
