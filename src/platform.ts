import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { EventEmitter } from './event-channel';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { AsyncMqttClient } from 'async-mqtt';
import MQTT from 'async-mqtt';
import { DeviceConfiguration } from './model/device-configuration';
import { LockConfiguration } from './model/lock-configuration';
import { LockPlatformAccessory } from './accessories/lockAccessory';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class HomeassistantHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
  private readonly topicRegEx = new RegExp('^/([^/]+)/([^/]+)(?:/([^/]+))?/config$');

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];
  private client : AsyncMqttClient | null = null;

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', async () => {
      log.debug('Executed didFinishLaunching callback');
      // run the method to discover / register your devices as accessories
      //this.discoverDevices();
      log.info(`Configuration: ${JSON.stringify(this.config)}`);
      try {
        log.info(`Connecting to ${this.config.host}`);
        this.client = await MQTT.connectAsync(`${this.config.protocol}://${this.config.host}:${this.config.port}`, {
          username: this.config.username,
          password: this.config.password,
        }, true);
        log.info(`connected to ${this.config.protocol}://${this.config.username}@${this.config.host}:${this.config.port}`);
        log.info('registering MQTT message handler');
        this.client?.on('message', async (topic, payload) => {
          if( topic !== null ) {
            if( topic.startsWith(this.config.homeassistantBaseTopic) ) {
              this.log.info(`Received configuration on topic '${topic}'`);
              if( payload !== null ) {
                try {
                  const jsonPayload = JSON.parse(payload.toString());
                  this.handleDeviceConfiguration(topic, jsonPayload as DeviceConfiguration);
                } catch (e: unknown) {
                  this.log.error(`error handling payload on topic ${topic} - ${JSON.stringify(e)}`);
                }
              } else {
                this.log.warn('payload was empty');
              }
            } else {
              this.log.debug(`Received event message in ${topic}`);
              const accessory = this.accessories.find(
                (accessory) => accessory.context.configuration.state_topic === topic ||
                               accessory.context.configuration.command_topic === topic,
              );
              if( accessory ) {
                if( topic === accessory?.context.configuration.state_topic ) {
                  this.log.debug(`publishing event ${accessory.UUID}:set-current-state} for topic ${topic}`);
                  EventEmitter.emit(`${accessory.UUID}:set-current-state`, { payload: payload.toString() } );
                } else if( topic === accessory.context.configuration.command_topic ) {
                  this.log.debug(`publishing event ${accessory.UUID}:set-current-state} for topic ${topic}`);
                  EventEmitter.emit(`${accessory.UUID}:get-target-state`, { payload: payload.toString() } );
                } else {
                  this.log.warn(`have not found an accessory for topic ${topic}`);
                }
              } else {
                this.log.warn(`have not found an accessory for topic ${topic}`);
              }
            }
          } else {
            this.log.warn('Received a message but topic was not set');
          }
        });
        log.info(`subscribing to topic "${this.config.homeassistantBaseTopic}/#"`);
        this.client?.subscribe(`${this.config.homeassistantBaseTopic}/#`);
      } catch (e : unknown) {
        log.error(JSON.stringify(e));
      }
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }


  handleDeviceConfiguration(topic: string, configuration : DeviceConfiguration ) {
    this.log.debug(`Handling device configuration received on topic "${topic}"`);
    const configurationTopic = topic.substring(this.config.homeassistantBaseTopic.length);
    const result = this.topicRegEx.exec(configurationTopic);
    if( result !== null ) {
      const deviceType = result[1];
      const uuid = this.api.hap.uuid.generate(configuration.unique_id);
      const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);
      if( deviceType === 'lock' ) {
        const lockConfiguration = configuration as LockConfiguration;
        let usedAccessory : PlatformAccessory;
        if( existingAccessory ) {
          this.log.info(`Found an accessory with UUID ${uuid}`);
          new LockPlatformAccessory(this, existingAccessory);
          usedAccessory = existingAccessory;
        } else {
          this.log.info(`No accessory found with UUID ${uuid}`);
          this.log.info('Creating a new lock accessory');
          const accessory = new this.api.platformAccessory(lockConfiguration.name, uuid);
          // store a copy of the device object in the `accessory.context`
          // the `context` property can be used to store any data about the accessory you may need
          accessory.context.device_type = 'lock';
          accessory.context.configuration = lockConfiguration;
          // create the accessory handler for the newly create accessory
          // this is imported from `platformAccessory.ts`
          new LockPlatformAccessory(this, accessory);

          // link the accessory to your platform
          this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
          usedAccessory = accessory;
        }
        this.client?.subscribe(usedAccessory.context.configuration.state_topic);
        this.client?.subscribe(usedAccessory.context.configuration.command_topic);
        EventEmitter.on(`${usedAccessory.UUID}:set-target-state`, async (payload) => {
          this.log.debug(`Publish payload (${payload}) to topic ${usedAccessory.context.configuration.command_topic}`);
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
          this.client?.publish(usedAccessory.context.configuration.command_topic, actualPayload);
        });
      } else {
        this.log.warn(`Unhandled device type ${deviceType}`);
      }
    } else {
      this.log.error(`Failed to extract configuration details from topic "${topic}"`);
    }
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  discoverDevices() {

    // EXAMPLE ONLY
    // A real plugin you would discover accessories from the local network, cloud services
    // or a user-defined array in the platform config.
    /*
    const exampleDevices = [
      {
        exampleUniqueId: 'ABCD',
        exampleDisplayName: 'Bedroom',
      },
      {
        exampleUniqueId: 'EFGH',
        exampleDisplayName: 'Kitchen',
      },
    ];


    // loop over the discovered devices and register each one if it has not already been registered
    for (const device of exampleDevices) {

      // generate a unique id for the accessory this should be generated from
      // something globally unique, but constant, for example, the device serial
      // number or MAC address
      const uuid = this.api.hap.uuid.generate(device.exampleUniqueId);

      // see if an accessory with the same uuid has already been registered and restored from
      // the cached devices we stored in the `configureAccessory` method above
      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {
        // the accessory already exists
        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

        // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
        // existingAccessory.context.device = device;
        // this.api.updatePlatformAccessories([existingAccessory]);

        // create the accessory handler for the restored accessory
        // this is imported from `platformAccessory.ts`
        new ExamplePlatformAccessory(this, existingAccessory);

        // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
        // remove platform accessories when no longer present
        // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
        // this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
      } else {
        // the accessory does not yet exist, so we need to create it
        this.log.info('Adding new accessory:', device.exampleDisplayName);

        // create a new accessory
        const accessory = new this.api.platformAccessory(device.exampleDisplayName, uuid);

        // store a copy of the device object in the `accessory.context`
        // the `context` property can be used to store any data about the accessory you may need
        accessory.context.device = device;

        // create the accessory handler for the newly create accessory
        // this is imported from `platformAccessory.ts`
        new ExamplePlatformAccessory(this, accessory);

        // link the accessory to your platform
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }*/
  }
}
