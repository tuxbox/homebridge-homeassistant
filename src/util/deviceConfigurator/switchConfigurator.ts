import { API, Logger, PlatformAccessory } from 'homebridge';
import { SwitchConfiguration } from '../../model/configuration/switch-confiugration';
import { Configurator } from './configurator';
import { HomeassistantHomebridgePlatform } from '../../platform';
import { SwitchPlatformAccessory } from '../../accessories/actor/switchAccessory';

export class SwitchConfigurator implements Configurator<SwitchConfiguration> {

  private readonly log : Logger;

  constructor(private api: API, private platform : HomeassistantHomebridgePlatform) {
    this.log = platform.log;
  }

  configure(accessory: PlatformAccessory) {
    this.log.info(`configure a switch with name ${accessory.displayName}`);
    accessory.context.device_type = 'switch';
    new SwitchPlatformAccessory(this.platform, accessory);
  }

}