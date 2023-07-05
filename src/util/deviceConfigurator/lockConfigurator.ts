import { API, Logger, PlatformAccessory } from 'homebridge';
import { LockConfiguration } from '../../model/configuration/lock-configuration';
import { LockPlatformAccessory } from '../../accessories/actor/lockAccessory';
import { HomeassistantHomebridgePlatform } from '../../platform';
import { PLATFORM_NAME, PLUGIN_NAME } from '../../settings';
import { EventEmitter, Events } from '../eventChannel';
import { Configurator } from './configurator';

export class LockConfigurator implements Configurator<LockConfiguration> {

  private readonly log : Logger;

  constructor(private api: API, private platform : HomeassistantHomebridgePlatform) {
    this.log = platform.log;
  }

  configure(accessory: PlatformAccessory) {
    accessory.context.device_type = 'lock';
    EventEmitter.on(`${accessory.UUID}:${Events.SetTargetState}`, async (payload) => {
      this.log.debug(`Publish payload (${payload}) to topic ${accessory.context.configuration.command_topic}`);
      let actualPayload = '';
      if( payload !== null && payload.payload !== null ) {
        if( typeof payload.payload === 'string' ) {
          this.log.debug('received payload is of type string - just passing it on');
          actualPayload = payload.payload;
        } else {
          this.log.debug('received payload is not of type string - JSON.stringify applied');
          actualPayload = JSON.stringify(payload.payload);
        }
      }
      EventEmitter.emit(Events.MqttPublish, accessory.context.configuration.command_topic, actualPayload);
    });
  }

}