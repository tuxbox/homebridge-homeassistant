import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, APIEvent } from 'homebridge';

import { EventEmitter } from './events/event-channel';
import { AccessoryManager } from './accessory-manager';
import { PLUGIN_NAME } from '../../settings';

export abstract class AccessoryManagerPlatform implements DynamicPlatformPlugin {

  protected readonly accessoryManager : AccessoryManager;

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug(JSON.stringify(config));
    this.log.debug(`Finished initializing platform: ${this.config.platform}`);
    this.accessoryManager = new AccessoryManager(api, log);
    EventEmitter.setMaxListeners(150);
    this.setup();
    this.api.on(APIEvent.DID_FINISH_LAUNCHING, async () => {
      await this.onDidFinishLaunching();
    });
  }

  protected async onDidFinishLaunching() {
    this.log.debug('Called onDidFinishLaunching()');
    this.accessoryManager.setup(this.config.platform, PLUGIN_NAME);
  }

  protected setup() {
    //
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.accessoryManager.configureAccessory(accessory);
  }

}
