import { PlatformAccessory, Service } from 'homebridge';
import { HomebridgeMqttPlatform } from '../../platform';
import { BaseSensorPlatformAccessory } from './baseSensorAccessory';
import { SensorConfiguration } from '../../model/configuration/sensorConfiguration';
import { EveElgatoService } from '../../homekit/eveElgatoService';
import { AccessoryContext } from '../../model/accessoryContext';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class CurrentSensorPlatformAccessory extends BaseSensorPlatformAccessory<number> {

  constructor(
    protected readonly platform: HomebridgeMqttPlatform,
    protected readonly accessory: PlatformAccessory<AccessoryContext<number, SensorConfiguration>>,
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
    this.service.getCharacteristic(this.platform.Characteristic.Current)
      .onGet(this.handleHomekitCurrentStateGet.bind(this));
  }

  override updateCharacteristic(value: number) {
    //##this.platform.log.info(`Updating Characteristic value for ${this.configuration.name} to ${value}`);
    this.service.updateCharacteristic(this.platform.Characteristic.Current, value);
  }

  protected override initialValue(): number {
    return this.accessory.context.__persisted_state || 0.0;
  }

}
