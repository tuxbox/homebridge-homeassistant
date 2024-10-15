import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { MQTTPlatform } from './util/mqttPlatform';
import { DeviceConfigurator } from './util/deviceConfigurator';
import { subscribeTopic } from './util/mqttHelpers';
import {
  TotalEnergyCharacteristic,
  PowerCharacteristic,
  CurrentCharacteristic,
  VoltageCharacteristic,
} from './homekit/electricityCharacteristics';

let ITotalEnergy;
let ICurrentPower;

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class HomebridgeMqttPlatform implements DynamicPlatformPlugin {

  public readonly Service: typeof Service = this.api.hap.Service;
  public Characteristic: typeof Characteristic & typeof ITotalEnergy & typeof ICurrentPower;
  private readonly mqtt : MQTTPlatform;
  private readonly deviceConfigurator : DeviceConfigurator;

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);
    this.mqtt = new MQTTPlatform(config, log);
    this.deviceConfigurator = new DeviceConfigurator(api, this);

    ITotalEnergy = TotalEnergyCharacteristic;
    ICurrentPower = PowerCharacteristic;


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
        await this.mqtt.connect();
        await this.mqtt.setup();
        this.deviceConfigurator.setup();
        subscribeTopic({
          topic: `${this.config.homebridgeConfigTopic}/#`,
          opts: null,
        });
      } catch (e : unknown) {
        log.error(JSON.stringify(e));
      }
    });

    let x = Object.defineProperty(this.api.hap.Characteristic, 'TotalEnergy', {value: TotalEnergyCharacteristic});
    x = Object.defineProperty(this.api.hap.Characteristic, 'Voltage', {value: VoltageCharacteristic});
    x = Object.defineProperty(this.api.hap.Characteristic, 'Current', {value: CurrentCharacteristic});
    this.Characteristic = Object.defineProperty(x, 'CurrentPower', {value: PowerCharacteristic});
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    //##this.deviceConfigurator.configureAccessory(accessory);
  }

}
