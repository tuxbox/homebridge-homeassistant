import { API, DynamicPlatformPlugin, Logger, PlatformAccessory } from 'homebridge';
import { AccessoryConfiguration } from './accessory-configuration';
import { AccessoryContext, ActorContext } from './accessory-context';
import { EventEmitter, Events } from './events/event-channel';
import { AccessoryConfigurationEvent } from './events/accessory-configuration-event';
import { TemperatureSensorPlatformAccessory } from './accessories/sensors/temperature-sensor';
import { HumiditySensorPlatformAccessory } from './accessories/sensors/humidity-sensor';
import { BasePlatformAccessory } from './accessories/base-accessory';
import { LockPlatformAccessory } from './accessories/locks/lock-accessory';
import { SwitchAccessory } from './accessories/switch/switch-accessory';
import { LightAccessory } from './accessories/light/light-accessory';

export class AccessoryRegistration<Platform extends DynamicPlatformPlugin> {

  constructor(
    protected readonly platform: Platform,
    protected readonly api: API,
    private readonly logger : Logger,
  ) {
  }

  public setup() {
    EventEmitter.on(Events.ConfigureAccessory, (async (payload : AccessoryConfigurationEvent<AccessoryConfiguration>) => {
      let instance : BasePlatformAccessory<
        unknown & AccessoryConfiguration,
        unknown & DynamicPlatformPlugin> | undefined = undefined;
      if(payload.accessory_type === 'sensor') {
        this.logger.debug('XXXX - Handle ConfigureAccessory');
        if( payload.payload.type === 'temperature') {
          const accessory = payload.accessory as PlatformAccessory<AccessoryContext<AccessoryConfiguration>>;
          instance = new TemperatureSensorPlatformAccessory(this.platform, this.api, accessory, this.logger);
        } else if( payload.payload.type === 'humidity') {
          const accessory = payload.accessory as PlatformAccessory<AccessoryContext<AccessoryConfiguration>>;
          instance = new HumiditySensorPlatformAccessory(this.platform, this.api, accessory, this.logger);
        } else {
          this.logger.debug(`Unknown sensor type '${payload.payload.type}'`);
        }
      } else if( payload.accessory_type === 'lock' ) {
        this.logger.info('\'lock\' accessory type setting up');
        const accessory = payload.accessory as PlatformAccessory<ActorContext<AccessoryConfiguration>>;
        instance = new LockPlatformAccessory(this.platform, this.api, accessory, this.logger);
      } else if( payload.accessory_type === 'switch' ) {
        this.logger.info('\'switch\' accessory type setting up');
        const accessory = payload.accessory as PlatformAccessory<ActorContext<AccessoryConfiguration>>;
        try {
          this.logger.debug(payload.accessory_type);
          this.logger.debug(JSON.stringify(payload.payload));
          this.logger.debug(JSON.stringify(accessory.UUID));
          instance = new SwitchAccessory(this.platform, this.api, accessory, this.logger);
        } catch (e) {
          this.logger.error('ERRÖR');
          this.logger.error(JSON.stringify(e));
        }
      } else if( payload.accessory_type === 'light' ) {
        const accessory = payload.accessory as PlatformAccessory<AccessoryContext<AccessoryConfiguration>>;
        try {
          instance = new LightAccessory(this.platform, this.api, accessory, this.logger);
        } catch (e) {
          this.logger.error('error');
          this.logger.error(JSON.stringify(e));
        }
      } else {
        this.logger.warn(`accessory type ('${payload.accessory_type}') not yet implemented`);
      }
      try {
        instance?.configureAccessory();
      } catch(e) {
        this.logger.error('eRrOr');
        this.logger.error(`Configuration error! ${e}`);
      }
    }).bind(this));
  }

  //public publishSensors(accessory : PlatformAccessory<AccessoryContext<number, AccessoryConfiguration>>) {
  //  new TemperatureSensorPlatformAccessory(this.platform, accessory, this.logger);
  //}

}