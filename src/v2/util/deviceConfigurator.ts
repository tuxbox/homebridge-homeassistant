/* eslint-disable max-len */
import { API, Logger, PlatformAccessory } from 'homebridge';
import { EventEmitter, Events } from './eventChannel';
import { PLATFORM_NAME, PLUGIN_NAME } from '../../settings';
import { HomebridgeMqttPlatform } from '../platform';
import { subscribeTopic, unsubscribeTopics } from './mqttHelpers';
import { SensorConfiguration } from '../model/configuration/sensorConfiguration';
import { AccessoryConfigurationEvent } from '../model/events/accessoryConfigurationEvent';
import { TemperatureSensorPlatformAccessory } from '../accessories/sensors/temperatureSensorAccessory';
import { HumiditySensorPlatformAccessory } from '../accessories/sensors/humiditySensorAccessory';
import { EnergySensorPlatformAccessory } from '../accessories/sensors/energySensorAccessory';
import { VoltageSensorPlatformAccessory } from '../accessories/sensors/voltageSensorAccessory';
import { PowerSensorPlatformAccessory } from '../accessories/sensors/powerSensorAccessory';
import { CurrentSensorPlatformAccessory } from '../accessories/sensors/currentSensorAccessory';
import { AccessoryContext } from '../model/accessoryContext';
import { BaseSensorPlatformAccessory } from '../accessories/sensors/baseSensorAccessory';

export class DeviceConfigurator {

  //##private readonly api : API;
  private readonly log : Logger;
  private cachedAccessories : PlatformAccessory[] = [];
  private configuredAccessories : string[] = [];

  constructor(private readonly api : API, private readonly platform : HomebridgeMqttPlatform) {
    this.api = api;
    this.log = this.platform.log;
  }

  setup() {
    EventEmitter.on(Events.ConfigureSensor, ((payload : AccessoryConfigurationEvent<SensorConfiguration>) => {
      this.log.info(`DeviceConfigurator - Handling message from topic ${payload.topic}`);
      this.log.info(`Configuring a sensor of type ${payload.payload.type}`);
      const sensorConfiguration : SensorConfiguration = payload.payload;
      const uuid = this.api.hap.uuid.generate(sensorConfiguration.id);
      const configuredAccessory = this.configuredAccessories.find((configuredUUID) => configuredUUID === uuid);
      let usedAccessory = this.cachedAccessories.find((accessory) => accessory.UUID === uuid);
      if (configuredAccessory === undefined) {
        this.log.info(`No accessory with UUID ${uuid} configured - setting up new one`);
        if (usedAccessory === undefined) {
          this.log.info('Configuring new accessory');
          usedAccessory = new this.api.platformAccessory(sensorConfiguration.name, uuid);
          usedAccessory.context = {
            configuration: sensorConfiguration,
          };
          this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [usedAccessory]);
        } else {
          this.log.info('using existing accessory');
        }
        if( usedAccessory ) {
          let sensor : BaseSensorPlatformAccessory<any> | undefined = undefined;
          this.log.info(JSON.stringify(sensorConfiguration));
          if (sensorConfiguration.type === 'temperature') {
            this.log.info('configure temperature accessory');
            sensor = new TemperatureSensorPlatformAccessory(this.platform, usedAccessory as PlatformAccessory<AccessoryContext<number, SensorConfiguration>>);
          } else if (sensorConfiguration.type === 'humidity') {
            this.log.info('configure humidity accessory');
            sensor = new HumiditySensorPlatformAccessory(this.platform, usedAccessory as PlatformAccessory<AccessoryContext<number, SensorConfiguration>>);
          } else if (sensorConfiguration.type === 'energy') {
            this.log.info('configure energy sensor');
            sensor = new EnergySensorPlatformAccessory(this.platform, usedAccessory as PlatformAccessory<AccessoryContext<number, SensorConfiguration>>);
          } else if (sensorConfiguration.type === 'power') {
            this.log.info('configure power sensor');
            sensor = new PowerSensorPlatformAccessory(this.platform, usedAccessory as PlatformAccessory<AccessoryContext<number, SensorConfiguration>>);
          } else if (sensorConfiguration.type === 'voltage') {
            this.log.info('configure voltage sensor');
            sensor = new VoltageSensorPlatformAccessory(this.platform, usedAccessory as PlatformAccessory<AccessoryContext<number, SensorConfiguration>>);
          } else if (sensorConfiguration.type === 'current') {
            this.log.info('configure current sensor');
            sensor = new CurrentSensorPlatformAccessory(this.platform, usedAccessory as PlatformAccessory<AccessoryContext<number, SensorConfiguration>>);
          } else {
            this.log.info('no platform accessory configured');
            this.log.info(JSON.stringify(sensorConfiguration));
          }
          sensor?.configureSensor();
          this.configureSensorAccessory(usedAccessory as PlatformAccessory<AccessoryContext<number, SensorConfiguration>>);
          this.registerCurrentlyConfiguredAccessory(usedAccessory.UUID);
        } else {
          this.log.info(`häää? ${usedAccessory}`);
        }
      } else {
        this.log.info(`accessory with ${uuid} already configured - skipping`);
      }

    }).bind(this));
    //clean up
    //after 15s we presume all configurations received and all registered accessories that have not yet been configured to be obsolete
    setTimeout(() => {
      this.log.info(`${this.configuredAccessories.length} configured accessories`);
      this.log.info(`${this.cachedAccessories.length} cached accessories`);
      const obsoleteAccessories = this.cachedAccessories.filter(
        // eslint-disable-next-line eqeqeq
        (accessory) => this.configuredAccessories.find((uuid) => uuid === accessory.UUID) === null,
      );
      this.log.info(`Found ${obsoleteAccessories.length} obsolete accessories`);
      const unsubscriptions = obsoleteAccessories.map((e) => {
        const result : string[] = [];
        if( e.context?.state_topic ) {
          result.push(e.context.configuration.state_topic);
        }
        return result;
      }).reduce((prev, cur) => prev.concat(cur), []);
      if (unsubscriptions.length > 0) {
        unsubscribeTopics({
          topics: unsubscriptions,
        });
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, obsoleteAccessories);
        // eslint-disable-next-line eqeqeq
        this.cachedAccessories = this.cachedAccessories.filter((item) => obsoleteAccessories.find((x) => x.UUID == item.UUID) == null);
      }
    }, 15_000);
  }

  configureSensorAccessory(accessory: PlatformAccessory<AccessoryContext<number, SensorConfiguration>>) {
    this.log.debug(`configuring accessory ${accessory.displayName}`);
    if( accessory.context.configuration.state_topic ) {
      subscribeTopic({
        topic: accessory.context.configuration.state_topic,
        opts: null,
      });
    }
    /*if( accessory.context.configuration.command_topic ) {
      subscribeTopic({
        topic: accessory.context.configuration.command_topic,
        opts: null,
      });
    }*/
  }

  registerCurrentlyConfiguredAccessory(uuid : string) {
    this.configuredAccessories.push(uuid);
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.info(`Tracking accessory as cached and restored ${accessory.UUID}`);
    this.cachedAccessories.push(accessory);
  }

}