import { API, Logger, PlatformAccessory } from 'homebridge';
import { LockConfiguration } from '../../model/configuration/lock-configuration';
import { HomeassistantHomebridgePlatform } from '../../platform';
import { Configurator } from './configurator';
import { EventEmitter, Events } from '../eventChannel';
import { LockPlatformAccessory } from '../../accessories/actor/lockAccessory';
import { publishMessage } from '../mqttHelpers';

export class LockConfigurator implements Configurator<LockConfiguration> {

  private readonly log : Logger;

  constructor(private api: API, private platform : HomeassistantHomebridgePlatform) {
    this.log = platform.log;
  }

  configure(accessory: PlatformAccessory) {
    this.log.info(`configure a lock with name ${accessory.displayName}`);
    accessory.context.device_type = 'lock';
    new LockPlatformAccessory(this.platform, accessory);
    EventEmitter.on(`${accessory.UUID}:${Events.SetTargetState}`, async (payload) => {
      this.log.info(`Publish payload (${payload}) to topic ${accessory.context.configuration.command_topic}`);
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
      publishMessage({
        topic: accessory.context.configuration.command_topic,
        payload: actualPayload,
        opts: null,
      });
    });
  }

}