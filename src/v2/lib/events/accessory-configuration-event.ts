import { PlatformAccessory } from 'homebridge';
import { AccessoryConfiguration } from '../accessory-configuration';

export type AccessoryRegistrationEvent<T extends AccessoryConfiguration> = {

  accessory_type: string;
  payload: T;

};

export type AccessoryConfigurationEvent<T extends AccessoryConfiguration> = {

  accessory_type: string;
  accessory: PlatformAccessory;
  payload: T;

};

export type AccessoryConfiguredEvent = {

  accessory_type: string;
  accessory_id: string;

};

export type AccessoryObsoleteEvent<T extends AccessoryConfiguration> = {

  id: string;
  accessory_type: string;
  configuration: T;

};