import { PlatformAccessory, Service } from 'homebridge';
import { HomebridgeMqttPlatform } from '../../platform';
import { BaseSensorPlatformAccessory } from './baseSensorAccessory';
import { SensorConfiguration } from '../../model/configuration/sensorConfiguration';
import { EveElgatoService } from '../../homekit/eveElgatoService';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class PowerSensorPlatformAccessory extends BaseSensorPlatformAccessory<number> {

  constructor(
    protected readonly platform: HomebridgeMqttPlatform,
    protected readonly accessory: PlatformAccessory<SensorConfiguration>,
  ) {
    super(platform, accessory);
  }

  override createService() : Service {
    const service = new EveElgatoService('Power Management');
    return this.accessory.getService('Power Management') ||
            this.accessory.addService(service);
  }

  override configureSensor() {
    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.getCharacteristic(this.platform.Characteristic.CurrentPower)
      .onGet(this.handleHomekitCurrentStateGet.bind(this));
  }

  override updateCharacteristic(value: number) {
    //##this.platform.log.info(`Updating Characteristic value for ${this.configuration.name} to ${value}`);
    this.service.updateCharacteristic(this.platform.Characteristic.CurrentPower, value);
  }

  protected override initialValue(): number {
    return 0.0;
  }

}
