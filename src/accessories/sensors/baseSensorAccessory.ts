import { Service, PlatformAccessory, Logger } from 'homebridge';
import { HomeassistantHomebridgePlatform } from '../../platform';
import { DeviceConfiguration } from '../../model/configuration/device-configuration';
import { Payload } from '../../model/mqtt/mqtt-payload';
import { TemplatePayload } from '../../model/templatePayload';
import { EventEmitter, Events } from '../../util/eventChannel';
import nunjucks from 'nunjucks';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export abstract class BaseSensorPlatformAccessory<StateType, T extends DeviceConfiguration> {

  protected readonly log : Logger;
  protected service: Service;
  protected readonly configuration: T;

  protected currentState : StateType;
  protected template : any;


  constructor(
    protected readonly platform: HomeassistantHomebridgePlatform,
    protected readonly accessory: PlatformAccessory,
  ) {
    this.log = platform.log;
    this.configuration = accessory.context.configuration;
    this.currentState = this.initialValue();
    this.template = nunjucks.compile(this.configuration.value_template || '{{ value }}');
    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, this.configuration.device?.manufacturer || 'Homebridge Homeassistant')
      .setCharacteristic(this.platform.Characteristic.Model, this.configuration.device?.model || 'Homebridge Homeassistant')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.configuration.device?.identifiers || '1');
    this.service = this.createService();
    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, this.configuration.name);
    this.configureSensor();

    EventEmitter.on(`${Events.MqttMessageReceived}:${accessory.context.configuration.state_topic}`, ((payload : Payload) => {
      this.log.debug(`Handling MQTT state update for accessory ${this.accessory.displayName}`);
      const value = this.renderValue(payload);
      this.currentState = this.convertStatePayloadToStateValue(value);
      this.updateCharacteristic(this.currentState);
    }).bind(this));

  }

  protected abstract initialValue() : StateType;

  protected abstract createService() : Service;

  protected abstract configureSensor();

  protected abstract updateCharacteristic(value: StateType);

  protected payloadToTemplateValue(payload: Payload) : TemplatePayload {
    const result : TemplatePayload = {
      value: '',
      value_json: null,
    };
    if( payload ) {
      if( payload.payload ) {
        result.value = payload.payload;
        try {
          result.value_json = JSON.parse(payload.payload);
        } catch (e) {
          //this.platform.log.warn(`Error parsing payload although defined as JSON payload (${payload.payload})`);
        }
      }
    }
    this.log.debug(`Payload2Template -> ${JSON.stringify(result)}`);
    return result;
  }

  protected renderValue(payload : Payload) : string {
    try {
      return this.template.render(this.payloadToTemplateValue(payload));
    } catch (e) {
      this.log.error(`error rendering template - ${JSON.stringify(this.template)} - ${e}`);
    }
    return '';
  }

  protected convertStatePayloadToStateValue(value: string) : StateType {
    return value as unknown as StateType;
  }


  async handleHomekitCurrentStateGet() : Promise<StateType> {
    return this.currentState!;
  }

}
