import { PlatformAccessory, Service } from 'homebridge';
import { HomeassistantHomebridgePlatform } from '../../platform';
import { BaseSensorPlatformAccessory } from './baseSensorAccessory';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class HumiditySensorPlatformAccessory extends BaseSensorPlatformAccessory<number> {

  constructor(
    protected readonly platform: HomeassistantHomebridgePlatform,
    protected readonly accessory: PlatformAccessory,
  ) {
    super(platform, accessory);
    this.currentState = 0.0;
  }

  override createService() : Service {
    return this.accessory.getService(this.platform.Service.HumiditySensor) ||
            this.accessory.addService(this.platform.Service.HumiditySensor);
  }

  override configureSensor() {
    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
      .onGet(this.handleHomekitCurrentStateGet.bind(this));
  }

  override updateCharacteristic(value: number) {
    this.service.updateCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity, value);
  }

  protected override initialValue(): number {
    return 0.0;
  }

}
