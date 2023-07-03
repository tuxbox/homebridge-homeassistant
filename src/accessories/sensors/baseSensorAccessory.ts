import { Service, PlatformAccessory } from 'homebridge';
import { HomeassistantHomebridgePlatform } from '../../platform';
import { DeviceConfiguration } from '../../model/device-configuration';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export abstract class BaseSensorPlatformAccessory<StateType> {
  protected service: Service;
  protected readonly configuration: DeviceConfiguration;

  protected currentState : StateType;


  constructor(
    protected readonly platform: HomeassistantHomebridgePlatform,
    protected readonly accessory: PlatformAccessory,
  ) {
    this.configuration = accessory.context.configuration;
    this.currentState = this.initialValue();
    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, this.configuration.device?.manufacturer || 'Homebridge Homeassistant')
      .setCharacteristic(this.platform.Characteristic.Model, this.configuration.device?.model || 'Homebridge Homeassistant')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.configuration.device?.identifiers || '1');

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    this.service = this.accessory.getService(this.platform.Service.TemperatureSensor) ||
                   this.accessory.addService(this.platform.Service.TemperatureSensor);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, this.configuration.name);

  }

  protected abstract initialValue() : StateType;

  protected abstract configureSensor();

  async handleHomekitCurrentStateGet() : Promise<StateType> {
    return this.currentState!;
  }

}
