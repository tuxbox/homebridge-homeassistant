import { PlatformAccessory } from 'homebridge';
import { EventEmitter } from '../../event-channel';
import { HomeassistantHomebridgePlatform } from '../../platform';
import { Payload } from '../../model/mqtt-payload';
import { BaseSensorPlatformAccessory } from './baseSensorAccessory';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class TemperatureSensorPlatformAccessory extends BaseSensorPlatformAccessory<number> {

  constructor(
    protected readonly platform: HomeassistantHomebridgePlatform,
    protected readonly accessory: PlatformAccessory,
  ) {
    super(platform, accessory);
    this.currentState = 0.0;

    this.service = this.accessory.getService(this.platform.Service.HumiditySensor) ||
                   this.accessory.addService(this.platform.Service.HumiditySensor);
  }

  override configureSensor() {
    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, this.configuration.name);
    this.service.getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
      .onGet(this.handleHomekitCurrentStateGet.bind(this));

    EventEmitter.on(`${this.accessory.UUID}:set-current-humidity`, this.handleMQTTCurrentHumidityEvent.bind(this));
  }

  protected override initialValue(): number {
    return 0.0;
  }

  async handleMQTTCurrentHumidityEvent(payload : Payload) {
    this.platform.log.info('Handling MQTT current temperature event');
    this.platform.log.info(`received payload ${payload.payload}`);
    // TODO extract value based on template
    // TODO
  }

}
