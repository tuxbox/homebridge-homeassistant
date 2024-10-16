import { Service, PlatformAccessory, Logger } from 'homebridge';
import { HomebridgeMqttPlatform } from '../../platform';
import { SensorConfiguration } from '../../model/configuration/sensorConfiguration';
import { Payload, SensorPayload } from '../../model/mqtt/mqtt-payload';
import { EventEmitter, Events } from '../../util/eventChannel';
import nunjucks from 'nunjucks';
import { AccessoryContext } from '../../model/accessoryContext';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export abstract class BaseSensorPlatformAccessory<StateType> {

  protected readonly log : Logger;
  protected service: Service;
  protected readonly configuration: SensorConfiguration;

  protected currentState : StateType;

  constructor(
    protected readonly platform: HomebridgeMqttPlatform,
    protected readonly accessory: PlatformAccessory<AccessoryContext<StateType, SensorConfiguration>>,
  ) {
    this.log = platform.log;
    this.configuration = accessory.context.configuration;
    this.currentState = this.initialValue();
    //##this.template = nunjucks.compile(this.configuration.value_template || '{{ value }}');
    // set accessory information
    this.platform.log.debug(JSON.stringify(this.configuration));
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, this.configuration.manufacturer || 'Homebridge Homeassistant')
      .setCharacteristic(this.platform.Characteristic.Model, this.configuration.model || 'Homebridge Homeassistant')
      // eslint-disable-next-line max-len
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.configuration.serial_number || 'dcbac663-04b2-42ae-ae03-3afd23037f93');
    this.service = this.createService();
    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, this.configuration.name);
    this.configureSensor();

    this.log.info(`Receiving Events on ${Events.MqttMessageReceived}:${this.configuration.state_topic}`);
    EventEmitter.on(`${Events.MqttMessageReceived}:${this.configuration.state_topic}`, ((payload : Payload) => {
      this.log.debug(`Handling MQTT state update for accessory ${this.accessory.displayName}`);
      //##const value = this.renderValue(payload);
      //##this.currentState = this.convertStatePayloadToStateValue(value);
      const data : SensorPayload<StateType> = JSON.parse(payload.payload);
      this.log.debug(`[DEBUG] - ${payload.topic} - ${JSON.stringify(data)}`);
      if (this.currentState === data.value) {
        this.log.debug(`Skipping update, incoming message has no update - current value: ${this.currentState} - new value: ${data.value}`);
      } else {
        this.currentState = data.value;
        this.accessory.context.__persisted_state = this.currentState;
        this.updateCharacteristic(this.currentState);
      }
    }).bind(this));

  }

  protected abstract initialValue() : StateType;

  protected abstract createService() : Service;

  protected abstract configureSensor();

  protected abstract updateCharacteristic(value: StateType);

  async handleHomekitCurrentStateGet() : Promise<StateType> {
    return this.currentState!;
  }

}
