import { PlatformAccessory, Service } from 'homebridge';
import { HomebridgeMqttPlatform } from '../../platform';
import { BaseSensorPlatformAccessory } from './baseSensorAccessory';
import { SensorConfiguration } from '../../model/configuration/sensorConfiguration';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class TemperatureSensorPlatformAccessory extends BaseSensorPlatformAccessory<number> {

  constructor(
    protected readonly platform: HomebridgeMqttPlatform,
    protected readonly accessory: PlatformAccessory<SensorConfiguration>,
  ) {
    super(platform, accessory);
  }

  override createService() : Service {
    return this.accessory.getService(this.platform.Service.TemperatureSensor) ||
            this.accessory.addService(this.platform.Service.TemperatureSensor);
  }

  override configureSensor() {
    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onGet(this.handleHomekitCurrentStateGet.bind(this));
  }

  override updateCharacteristic(value: number) {
    //##this.platform.log.info(`Updating Characteristic value for ${this.configuration.name} to ${value}`);
    this.service.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, value);
  }

  protected override initialValue(): number {
    return 0.0;
  }

}
