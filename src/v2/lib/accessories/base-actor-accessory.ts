import { Characteristic as HAPCharacteristic, CharacteristicValue } from 'hap-nodejs';
import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, WithUUID } from 'homebridge';
import { BasePlatformAccessory } from './base-accessory';
import { AccessoryConfiguration } from '../accessory-configuration';
import { ActorContext } from '../accessory-context';
import { EventEmitter, Events } from '../events/event-channel';
import { AccessoryState } from '../accessory-state';

export const UPDATE_TEMPERATURE_SENSOR = 'accessory:update:temperature';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export abstract class ActorPlatformAccessory<
  T extends AccessoryConfiguration,
  P extends DynamicPlatformPlugin>
  extends BasePlatformAccessory<T, P> {

  protected targetState : CharacteristicValue;

  constructor(
    protected readonly platform: P,
    protected readonly api: API,
    protected readonly accessory: PlatformAccessory<ActorContext<T>>,
    protected readonly logger : Logger,
  ) {
    super(platform, api, accessory, logger);
    this.targetState = this.initialTargetValue();
  }

  protected abstract initialTargetValue() : CharacteristicValue;

  protected abstract targetStateCharacteristic() : WithUUID<new () => HAPCharacteristic>;

  async handleHomekitTargetStateGet() : Promise<CharacteristicValue> {
    return this.targetState!;
  }

  async handleHomekitTargetStateSet(value : CharacteristicValue) : Promise<void> {
    this.log.debug(`handleHomekitTargetStateSet - ${value} - ${typeof value}`);
    this.targetState = value;
    EventEmitter.emit(`${Events.PublishAccessoryTargetState}:${this.accessory.UUID}`, {
      configuration: this.accessory.context.configuration,
      payload: {
        value,
      },
    });
  }

  protected postconfigureAccessory() {
    this.service.getCharacteristic(this.targetStateCharacteristic())
      .onGet(this.handleHomekitTargetStateGet.bind(this))
      .onSet(this.handleHomekitTargetStateSet.bind(this));
    EventEmitter.on(
      `${Events.UpdateAccessoryTargetState}:${this.accessory.UUID}`,
      (async (payload : AccessoryState) => {
        this.log.debug('UpdateAccessoryTargetState Event handled');
        const stuff = payload.value;
        this.updateCharacteristic(this.targetStateCharacteristic(), stuff, 'targetState');
      }).bind(this));
    super.postconfigureAccessory();
    this.updateCharacteristic(this.targetStateCharacteristic(), this.targetState, 'targetState');
  }

}
