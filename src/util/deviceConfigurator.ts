import { API, Logger, PlatformAccessory } from 'homebridge';
import { EventEmitter, Events } from './eventChannel';
import { PLATFORM_NAME, PLUGIN_NAME } from '../settings';
import { LockConfigurator } from './deviceConfigurator/lockConfigurator';
import { DeviceConfiguration } from '../model/configuration/device-configuration';
import { AccessoryConfigurationEvent } from '../model/events/accessoryConfigurationEvent';
import { HomeassistantHomebridgePlatform } from '../platform';
import { Configurator } from './deviceConfigurator/configurator';

export class DeviceConfigurator {

  private readonly log : Logger;
  private cachedAccessories : PlatformAccessory[] = [];
  private configuredAccessories : string[] = [];
  private configurators = new Map<string, Configurator<DeviceConfiguration>>();

  constructor(private readonly api : API, private readonly platform : HomeassistantHomebridgePlatform) {
    this.configurators.set('lock', new LockConfigurator(api, platform))
//                    .set('sensor', new SensorConfigurator(api, platform))
                    ;
    this.log = this.platform.log;
  }

  setup() {
    EventEmitter.on(Events.ConfigureDevice, ((payload : AccessoryConfigurationEvent<DeviceConfiguration>) => {
      this.log.info(`DeviceConfigurator - Handling message from topic ${payload.topic}`);
      const configurator = this.configurators.get(payload.deviceType);
      if( configurator ) {
        const configuration = payload.payload;
        const uuid = this.api.hap.uuid.generate(configuration.unique_id);
        let usedAccessory = this.cachedAccessories.find((accessory) => accessory.UUID === uuid);
        if( usedAccessory == null ) {
          this.log.info(`No accessory found with UUID ${uuid}`);
          this.log.info('Creating a new accessory');
          usedAccessory = new this.api.platformAccessory(configuration.name, uuid);
          usedAccessory.context.configuration = configuration;
          this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [usedAccessory]);
        }
        configurator.configure(usedAccessory);
      } else {
        this.log.info(`accessory type ${payload.deviceType} not yet supported`)
      }

    }).bind(this));
    //clean up
    //after 15s we presume all configurations received and all registered accessories that have not yet been configured to be obsolete
    setTimeout(() => {
      const configuratorTypes = Array.from(this.configurators.keys());
      const obsoleteAccessories = this.cachedAccessories.filter(
        // eslint-disable-next-line eqeqeq
        (accessory) => this.configuredAccessories.find((uuid) => uuid === accessory.UUID) == null ||
                       configuratorTypes.find((key) => key === accessory.context?.device_type) == null,
      );
      this.log.info(`Found ${obsoleteAccessories.length} obsolete accessories`);

      this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, obsoleteAccessories);
      // eslint-disable-next-line eqeqeq
      this.cachedAccessories = this.cachedAccessories.filter((item) => obsoleteAccessories.find((x) => x.UUID == item.UUID) == null);
    }, 15_000);
  }

  configureAccessory(accessory: PlatformAccessory) {
    if( accessory.context.configuration.state_topic ) {
      EventEmitter.emit(Events.MqttSubscribe, accessory.context.configurationTopic.state_topic);
    }
    if( accessory.context.configuration.command_topic ) {
      EventEmitter.emit(Events.MqttSubscribe, accessory.context.configuration.command_topic);
    }
    this.cachedAccessories.push(accessory);
  }

  registerCurrentlyConfiguredAccessory(uuid : string) {
    this.configuredAccessories.push(uuid);
  }

}