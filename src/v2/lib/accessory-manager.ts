/* eslint-disable max-len */
import { API, DynamicPlatformPlugin, Logger, PlatformAccessory } from 'homebridge';
import { EventEmitter, Events } from './events/event-channel';
import { AccessoryConfiguration } from './accessory-configuration';
import { AccessoryConfiguredEvent, AccessoryRegistrationEvent } from './events/accessory-configuration-event';

export class AccessoryManager {

  private cachedAccessories : PlatformAccessory[] = [];
  private configuredAccessories : string[] = [];

  constructor(
    private readonly api : API,
    private log : Logger) {
  }

  setup(platformName: string, pluginName: string) {
    EventEmitter.on(Events.AccessoryConfigured, (payload: AccessoryConfiguredEvent<AccessoryConfiguration>) => {
      this.registerCurrentlyConfiguredAccessory(payload.accessory_id);
    });
    EventEmitter.on(Events.RegisterAccessory, ((payload : AccessoryRegistrationEvent<AccessoryConfiguration>) => {
      this.log.info('AccessoryManager - ');
      const accessoryConfiguration : AccessoryConfiguration = payload.payload;
      const uuid = this.api.hap.uuid.generate(accessoryConfiguration.id);
      const configuredAccessory = this.configuredAccessories.find((configuredUUID) => configuredUUID === uuid);
      let usedAccessory = this.cachedAccessories.find((accessory) => accessory.UUID === uuid);
      if (configuredAccessory === undefined) {
        this.log.info(`No accessory with UUID ${uuid} configured - setting up new one`);
        if (usedAccessory === undefined) {
          this.log.info('Configuring new accessory');
          usedAccessory = new this.api.platformAccessory(accessoryConfiguration.name, uuid);
          usedAccessory.context = {
            configuration: accessoryConfiguration,
          };
          this.api.registerPlatformAccessories(pluginName, platformName, [usedAccessory]);
        } else {
          this.log.info('using existing accessory');
        }
        if( usedAccessory ) {
          EventEmitter.emit(Events.ConfigureAccessory, {
            accessory_type: payload.accessory_type,
            accessory: usedAccessory,
            payload: payload.payload,
          });
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
      obsoleteAccessories.forEach((accessory) => EventEmitter.emit(Events.ObsoleteAccessory, {
        id: accessory.UUID,
        accessory_type: accessory.context.accessory_type,
        configuration: accessory.context.configuration,
      }));
      if(obsoleteAccessories.length>0) {
        this.api.unregisterPlatformAccessories(pluginName, platformName, obsoleteAccessories);
        // eslint-disable-next-line eqeqeq
        this.cachedAccessories = this.cachedAccessories.filter((item) => obsoleteAccessories.find((x) => x.UUID == item.UUID) == null);
      }
    }, 15_000);
  }

  registerCurrentlyConfiguredAccessory(uuid : string) {
    this.configuredAccessories.push(uuid);
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.info(`Tracking accessory as cached and restored ${accessory.UUID}`);
    this.cachedAccessories.push(accessory);
    EventEmitter.emit(Events.ConfigureAccessory, {
      accessory_type: accessory.context.accessory_type,
      accessory: accessory,
      payload: accessory.context.configuration,
    });
  }

}