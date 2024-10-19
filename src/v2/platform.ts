import { API, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { MQTTPlatform } from './lib-mqtt/mqtt-platform';
import { AccessoryManager } from './lib/accessory-manager';
import { AccessoryManagerPlatform } from './lib/platform';
import { subscribeTopic } from './lib-mqtt/mqtt-utils';
import { EventEmitter } from './lib/events/event-channel';
import { Events } from './lib/events/event-channel';
import { MqttConfiguration, MqttEvents } from './lib-mqtt/mqtt-events';

let ITotalEnergy;
let ICurrentPower;

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class HomebridgeMqttPlatform extends AccessoryManagerPlatform {

  public readonly Service: typeof Service = this.api.hap.Service;
  public Characteristic: typeof Characteristic & typeof ITotalEnergy & typeof ICurrentPower;
  private readonly mqtt : MQTTPlatform;

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    super(log, config, api);
    this.mqtt = new MQTTPlatform(config, log);
  }

  protected override async onDidFinishLaunching(): Promise<void> {
    await super.onDidFinishLaunching();
    this.log.debug('Executed didFinishLaunching callback');
    this.log.info(`Configuration: ${JSON.stringify(this.config)}`);
    try {
      await this.mqtt.configure();
      EventEmitter.emit(MqttEvents.ConfigureMQTT, {
        ...this.config,
        configuration_topic: `${this.config.homebridgeConfigTopic}/#`,
      });
    } catch (e : unknown) {
      this.log.error(JSON.stringify(e));
    }
  }

  override setup() {
    super.setup();
    EventEmitter.on(Events.ConfigureAccessory, async (payload) => {
      this.log.debug('Configure Accessory for platform');
      this.log.debug(JSON.stringify(payload));
    });
    //ITotalEnergy = TotalEnergyCharacteristic;
    //ICurrentPower = PowerCharacteristic;
    //let x = Object.defineProperty(this.api.hap.Characteristic, 'TotalEnergy', {value: TotalEnergyCharacteristic});
    //x = Object.defineProperty(this.api.hap.Characteristic, 'Voltage', {value: VoltageCharacteristic});
    //x = Object.defineProperty(this.api.hap.Characteristic, 'Current', {value: CurrentCharacteristic});
    //this.Characteristic = Object.defineProperty(x, 'CurrentPower', {value: PowerCharacteristic});
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
