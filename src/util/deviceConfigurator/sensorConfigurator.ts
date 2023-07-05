import { API, Logger, PlatformAccessory } from 'homebridge';
import { DeviceConfiguration } from '../../model/configuration/device-configuration';
import { HomeassistantHomebridgePlatform } from '../../platform';
import { TemperatureSensorPlatformAccessory } from '../../accessories/sensors/temperatureSensorAccessory';
import { HumiditySensorPlatformAccessory } from '../../accessories/sensors/humiditySensorAccessory';
import { EventEmitter, Events } from '../eventChannel';
import { Configurator } from './configurator';
import { publishMessage } from '../mqttHelpers';

export class SensorConfigurator implements Configurator<DeviceConfiguration> {

  private readonly log : Logger;

  constructor(private api: API, private platform : HomeassistantHomebridgePlatform) {
    this.log = platform.log;
  }

  private configureAccessory(accessory: PlatformAccessory) {
    if( accessory.context.device_class === 'temperature' ) {
      new TemperatureSensorPlatformAccessory(this.platform, accessory);
    } else if (accessory.context.device_class === 'humidity' ) {
      new HumiditySensorPlatformAccessory(this.platform, accessory);
    } else {
      this.log.warn(`No sensor implementation for device_class ${accessory.context.device_class} available`);
    }
  }

  configure(accessory: PlatformAccessory) {
    accessory.context.device_type = 'sensor';
    accessory.context.device_class = accessory.context.configuration.device_class;
    this.configureAccessory(accessory);
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
      publishMessage({
        topic: accessory.context.configuration.command_topic,
        payload: actualPayload,
        opts: null,
      });
    });
  }

}