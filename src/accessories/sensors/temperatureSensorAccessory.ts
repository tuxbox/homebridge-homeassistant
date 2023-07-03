import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { EventEmitter } from '../event-channel';
import { HomeassistantHomebridgePlatform } from '../platform';
import { LockConfiguration } from '../model/lock-configuration';
import { Payload } from '../model/mqtt-payload';
import { DeviceConfiguration } from '../model/device-configuration';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class TemperatureSensorPlatformAccessory {
  private service: Service;
  private configuration: DeviceConfiguration;

  private currentState : number;


  constructor(
    private readonly platform: HomeassistantHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    this.currentState = 0.0;
    this.configuration = accessory.context.configuration;
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

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onGet(this.handleHomekitCurrentTemperatureGet.bind(this));

    EventEmitter.on(`${this.accessory.UUID}:set-current-temperature`, this.handleMQTTCurrentTemperatureEvent.bind(this));
  }

  async handleMQTTCurrentTemperatureEvent(payload : Payload) {
    this.platform.log.info('Handling MQTT current temperature event');
    this.platform.log.info(`received payload ${payload.payload}`);
    // TODO extract value based on template
    // TODO
  }

  async handleHomekitCurrentTemperatureGet() : Promise<number> {
    return this.currentState;
  }

}
