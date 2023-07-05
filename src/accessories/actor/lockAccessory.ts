import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { EventEmitter, Events } from '../../util/eventChannel';
import { HomeassistantHomebridgePlatform } from '../../platform';
import { LockConfiguration } from '../../model/configuration/lock-configuration';
import { Payload } from '../../model/mqtt/mqtt-payload';
import { BaseActorPlatformAccessory } from './baseActorAccessory';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class LockPlatformAccessory extends BaseActorPlatformAccessory<string, CharacteristicValue, LockConfiguration> {

  private targetState : CharacteristicValue;


  constructor(
    protected readonly platform: HomeassistantHomebridgePlatform,
    protected readonly accessory: PlatformAccessory,
  ) {
    super(platform, accessory);
    this.targetState = this.platform.Characteristic.LockTargetState.SECURED;
  }

  async handleMQTTTargetStateEvent(payload : Payload) {
    this.platform.log.info(`Handling target state event -> ${payload.payload}`);
    if( payload.payload === this.configuration.payload_lock ) {
      this.targetState = this.platform.Characteristic.LockTargetState.SECURED;
      this.service.updateCharacteristic(
        this.platform.Characteristic.LockTargetState,
        this.platform.Characteristic.LockTargetState.SECURED,
      );
    } else if( payload.payload === this.configuration.payload_unlock ) {
      this.targetState = this.platform.Characteristic.LockTargetState.UNSECURED;
      this.service.updateCharacteristic(
        this.platform.Characteristic.LockTargetState,
        this.platform.Characteristic.LockTargetState.UNSECURED,
      );
    } else {
      this.platform.log.warn(`Could not handle target state for lock (${payload})`);
    }
  }

  async handleHomekitLockCurrentStateGet() : Promise<CharacteristicValue> {
    let result = this.platform.Characteristic.LockCurrentState.UNKNOWN;
    if( this.currentState === this.configuration.state_unlocked ) {
      result = this.platform.Characteristic.LockCurrentState.UNSECURED;
    } else if( this.currentState === this.configuration.state_locked ) {
      result = this.platform.Characteristic.LockCurrentState.SECURED;
    }
    return result;
  }

  async handleHomekitLockTargetStateGet() {
    return this.targetState;
  }

  override createService(): Service {
    return this.service = this.accessory.getService(this.platform.Service.LockMechanism) ||
    this.accessory.addService(this.platform.Service.LockMechanism);
  }

  override initialValue(): string {
    return ''; //this.platform.Characteristic.LockCurrentState.UNKNOWN;
  }

  protected override configureSensor() {
    this.service.setCharacteristic(this.platform.Characteristic.Name, this.configuration.name);
    this.service.getCharacteristic(this.platform.Characteristic.LockCurrentState)
      .onGet(this.handleHomekitLockCurrentStateGet.bind(this));
    this.service.getCharacteristic(this.platform.Characteristic.LockTargetState)
      .onGet(this.handleHomekitLockTargetStateGet.bind(this))
      .onSet(this.handleHomekitTargetStateSet.bind(this));
    EventEmitter.on(`${this.accessory.UUID}:${Events.GetTargetState}`, this.handleMQTTTargetStateEvent.bind(this));
  }

  override updateCharacteristic(value: string) {
    this.platform.log.info('Handling MQTT current state event');
    this.platform.log.info(`received payload ${value}`);
    if( value === this.configuration.state_locked ) {
      this.service.updateCharacteristic(
        this.platform.Characteristic.LockCurrentState,
        this.platform.Characteristic.LockCurrentState.SECURED,
      );
      this.targetState = this.platform.Characteristic.LockTargetState.SECURED;
      this.service.updateCharacteristic(
        this.platform.Characteristic.LockTargetState,
        this.platform.Characteristic.LockTargetState.SECURED,
      );
    } else if( value === this.configuration.state_unlocked ) {
      this.service.updateCharacteristic(
        this.platform.Characteristic.LockCurrentState,
        this.platform.Characteristic.LockCurrentState.UNSECURED,
      );
      this.targetState = this.platform.Characteristic.LockTargetState.UNSECURED;
      this.service.updateCharacteristic(
        this.platform.Characteristic.LockTargetState,
        this.platform.Characteristic.LockTargetState.UNSECURED,
      );
    } else {
      this.platform.log.warn('unknown state value');
      this.platform.log.debug(`state_locked: ${this.configuration.state_locked}`);
      this.platform.log.debug(`state_unlocked: ${this.configuration.state_unlocked}`);
      this.platform.log.debug(`actual state: ${value}`);
    }
  }

  protected override mapActorTypeToPayload(value: CharacteristicValue): unknown {
    let payload = this.configuration.payload_lock || 'lock';
    if( value === this.platform.Characteristic.LockTargetState.UNSECURED ) {
      payload = this.configuration.payload_unlock || 'unlock';
    }
    return payload;
  }

}
