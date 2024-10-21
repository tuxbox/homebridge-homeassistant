import { Service as HAPService, Characteristic as HAPCharacteristic, CharacteristicValue as HAPCharacteristicValue } from 'hap-nodejs';
import { API, CharacteristicValue, DynamicPlatformPlugin, Logger, PlatformAccessory, Service, WithUUID } from 'homebridge';
import { AccessoryConfiguration } from '../../accessory-configuration';
import { ActorContext } from '../../accessory-context';
import { ActorPlatformAccessory } from '../base-actor-accessory';

export const UPDATE_TEMPERATURE_SENSOR = 'accessory:update:temperature';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class LockPlatformAccessory<
  T extends AccessoryConfiguration,
  P extends DynamicPlatformPlugin>
  extends ActorPlatformAccessory<T, P> {
  protected initialTargetValue(): HAPCharacteristicValue {
    throw new Error('Method not implemented.');
  }

  constructor(
    protected readonly platform: P,
    protected readonly api: API,
    protected readonly accessory: PlatformAccessory<ActorContext<T>>,
    protected readonly logger : Logger,
  ) {
    super(platform, api, accessory, logger);
  }

  override createService() : Service {
    return this.accessory.getService(HAPService.LockMechanism) ||
            this.accessory.addService(HAPService.LockMechanism);
  }

  protected override initialValue(): CharacteristicValue {
    return this.accessory.context.__persisted_state[this.stateCharacteristic().UUID] || HAPCharacteristic.LockCurrentState.UNKNOWN;
  }

  protected targetStateCharacteristic(): WithUUID<new () => HAPCharacteristic> {
    return HAPCharacteristic.LockTargetState;
  }

  protected stateValueType(): string {
    throw 'number';
  }

  protected stateCharacteristic(): WithUUID<new () => HAPCharacteristic> {
    return HAPCharacteristic.LockCurrentState;
  }

}
