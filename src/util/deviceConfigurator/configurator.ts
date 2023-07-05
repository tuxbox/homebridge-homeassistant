import { PlatformAccessory } from 'homebridge';
import { DeviceConfiguration } from '../../model/configuration/device-configuration';

export interface Configurator<T extends DeviceConfiguration> {

  configure(existingAccessory: PlatformAccessory) : void;

}