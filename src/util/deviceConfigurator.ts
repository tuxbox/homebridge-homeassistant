import { API, Logger, PlatformAccessory } from 'homebridge';
import { EventEmitter, Events } from './eventChannel';
import { PLATFORM_NAME, PLUGIN_NAME } from '../settings';
import { LockConfigurator } from './deviceConfigurator/lockConfigurator';
import { DeviceConfiguration } from '../model/configuration/device-configuration';
import { AccessoryConfigurationEvent } from '../model/events/accessoryConfigurationEvent';
import { HomeassistantHomebridgePlatform } from '../platform';
import { Configurator } from './deviceConfigurator/configurator';
import { subscribeTopic, unsubscribeTopics } from './mqttHelpers';
import { SwitchConfigurator } from './deviceConfigurator/switchConfigurator';

export class DeviceConfigurator {

  private readonly log : Logger;
  private cachedAccessories : PlatformAccessory[] = [];
  private configuredAccessories : string[] = [];
  private configurators = new Map<string, Configurator<DeviceConfiguration>>();

  constructor(private readonly api : API, private readonly platform : HomeassistantHomebridgePlatform) {
    this.configurators.set('lock', new LockConfigurator(api, platform))
    //  .set('sensor', new SensorConfigurator(api, platform))
      .set('switch', new SwitchConfigurator(api, platform))
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
        } else {
          this.log.info('configuring existing accessory');
        }
        this.configureAccessory(usedAccessory);
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

      const unsubscriptions = obsoleteAccessories.map((e) => {
        const result : string[] = [];
        if( e.context?.configuration?.command_topic ) {
          result.push(e.context.configuration.command_topic);
        }
        if( e.context?.configuration?.state_topic ) {
          result.push(e.context.configuration.state_topic);
        }
        return result;
      }).reduce((prev, cur) => prev.concat(cur), []);
      unsubscribeTopics({
        topics: unsubscriptions,
      });
      this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, obsoleteAccessories);
      // eslint-disable-next-line eqeqeq
      this.cachedAccessories = this.cachedAccessories.filter((item) => obsoleteAccessories.find((x) => x.UUID == item.UUID) == null);
    }, 15_000);
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.debug(`configuring accessory ${accessory.displayName}`);
    if( accessory.context.configuration.state_topic ) {
      subscribeTopic({
        topic: accessory.context.configuration.state_topic,
        opts: null,
      });
    }
    if( accessory.context.configuration.command_topic ) {
      subscribeTopic({
        topic: accessory.context.configuration.command_topic,
        opts: null,
      });
    }
    this.cachedAccessories.push(accessory);
  }

  registerCurrentlyConfiguredAccessory(uuid : string) {
    this.configuredAccessories.push(uuid);
  }

}