import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { EventEmitter } from '../event-channel';
import { HomeassistantHomebridgePlatform } from '../platform';
import { LockConfiguration } from '../model/lock-configuration';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class LockPlatformAccessory {
  private service: Service;
  private configuration: LockConfiguration;

  private currentState : CharacteristicValue;
  private targetState : CharacteristicValue;


  constructor(
    private readonly platform: HomeassistantHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    this.currentState = this.platform.Characteristic.LockCurrentState.UNKNOWN;
    this.configuration = accessory.context.configuration as LockConfiguration;
    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, this.configuration.device?.manufacturer || 'Homebridge Homeassistant')
      .setCharacteristic(this.platform.Characteristic.Model, this.configuration.device?.model || 'Homebridge Homeassistant')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.configuration.device?.identifiers || '1');

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    this.service = this.accessory.getService(this.platform.Service.LockMechanism) ||
                   this.accessory.addService(this.platform.Service.LockMechanism);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, this.configuration.name);

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    this.service.getCharacteristic(this.platform.Characteristic.LockCurrentState)
      .onGet(this.handleHomekitLockCurrentStateGet.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.LockTargetState)
      .onGet(this.handleHomekitLockTargetStateGet.bind(this))
      .onSet(this.handleHomekitLockTargetStateSet.bind(this));
    EventEmitter.on(`${this.accessory.UUID}:set-current-state`, this.handleMQTTCurrentStateEvent.bind(this));
    EventEmitter.on(`${this.accessory.UUID}:get-target-state`, this.handleMQTTTargetStateEvent.bind(this));
  }

  async handleMQTTTargetStateEvent(payload : string) {
    if( payload === this.configuration.payload_lock ) {
      this.targetState = this.platform.Characteristic.LockTargetState.SECURED;
    } else if( payload === this.configuration.payload_unlock ) {
      this.targetState = this.platform.Characteristic.LockTargetState.UNSECURED;
    } else {
      this.platform.log.warn(`Could not handle target state for lock (${payload})`);
    }
  }

  async handleMQTTCurrentStateEvent(payload : string) {
    this.platform.log.debug('Handling MQTT current state event');
    this.platform.log.debug(`received payload ${payload}`);
    // TODO extract value based on template
    if( payload === this.configuration.state_locked ) {
      this.currentState = this.platform.Characteristic.LockCurrentState.SECURED;
    } else if( payload === this.configuration.state_unlocked ) {
      this.currentState = this.platform.Characteristic.LockCurrentState.UNSECURED;
    } else {
      this.platform.log.warn(`unknown state payload -> ${payload}`);
      this.currentState = this.platform.Characteristic.LockCurrentState.UNKNOWN;
    }
  }

  async handleHomekitLockCurrentStateGet() : Promise<CharacteristicValue> {
    return this.currentState;
  }

  async handleHomekitLockTargetStateGet() {
    return this.platform.Characteristic.LockTargetState.SECURED;
  }

  async handleHomekitLockTargetStateSet(value : CharacteristicValue) {
    this.platform.log.debug('handleLockTargetStateSet -> ', value);
    let payload = this.configuration.payload_lock || "lock";
    if( value === this.platform.Characteristic.LockTargetState.UNSECURED ) {
      payload = this.configuration.payload_unlock || "unlock";
    }
    EventEmitter.emit(`${this.accessory.UUID}:set-target-state`, { payload });
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possbile. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  async getOn() : Promise<CharacteristicValue {
    // implement your own code to check if the device is on
    const isOn = this.exampleStates.On;

    this.platform.log.debug('Get Characteristic On ->', isOn);

    // if you need to return an error to show the device as "Not Responding" in the Home app:
    // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);

    return isOn;
  }

}
