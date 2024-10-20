import { API, DynamicPlatformPlugin, Logger, PlatformAccessory } from 'homebridge';
import { AccessoryConfiguration } from './accessory-configuration';
import { AccessoryContext } from './accessory-context';
import { EventEmitter, Events } from './events/event-channel';
import { AccessoryConfigurationEvent } from './events/accessory-configuration-event';
import { TemperatureSensorPlatformAccessory } from './accessories/sensors/temperature-sensor';
import { HumiditySensorPlatformAccessory } from './accessories/sensors/humidity-sensor';
import { BasePlatformAccessory } from './base-accessory';

export class AccessoryRegistration<Platform extends DynamicPlatformPlugin> {

  constructor(
    protected readonly platform: Platform,
    protected readonly api: API,
    private readonly logger : Logger,
  ) {
  }

  public setup() {
    EventEmitter.on(Events.ConfigureAccessory, (async (payload : AccessoryConfigurationEvent<AccessoryConfiguration>) => {
      let instance : BasePlatformAccessory<unknown, unknown & AccessoryConfiguration, unknown & DynamicPlatformPlugin> | undefined
            = undefined;
      if(payload.accessory_type === 'sensor') {
        this.logger.debug('XXXX - Handle ConfigureAccessory');
        if( payload.payload.type === 'temperature') {
          const accessory = payload.accessory as PlatformAccessory<AccessoryContext<number, AccessoryConfiguration>>;
          instance = new TemperatureSensorPlatformAccessory(this.platform, this.api, accessory, this.logger);
        } else if( payload.payload.type === 'humidity') {
          const accessory = payload.accessory as PlatformAccessory<AccessoryContext<number, AccessoryConfiguration>>;
          instance = new HumiditySensorPlatformAccessory(this.platform, this.api, accessory, this.logger);
        } else {
          this.logger.debug(`Unknown sensor type '${payload.payload.type}'`);
        }
      } else if( payload.accessory_type === 'lock' ) {
        this.logger.warn('\'lock\' accessory type not yet implemented');
      } else {
        this.logger.warn(`accessory type ('${payload.accessory_type}') not yet implemented`);
      }
      instance?.configureAccessory();
    }).bind(this));
  }

  //public publishSensors(accessory : PlatformAccessory<AccessoryContext<number, AccessoryConfiguration>>) {
  //  new TemperatureSensorPlatformAccessory(this.platform, accessory, this.logger);
  //}

}