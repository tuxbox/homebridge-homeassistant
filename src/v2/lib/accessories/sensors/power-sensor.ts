import { Characteristic as HAPCharacteristic } from 'hap-nodejs';
import { API, CharacteristicValue, DynamicPlatformPlugin, Logger, PlatformAccessory, Service, WithUUID } from 'homebridge';
import { AccessoryConfiguration } from '../../accessory-configuration';
import { AccessoryContext } from '../../accessory-context';
import { BasePlatformAccessory } from '../base-accessory';

export const UPDATE_TEMPERATURE_SENSOR = 'accessory:update:temperature';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class PowerSensorPlatformAccessory<T extends AccessoryConfiguration, P extends DynamicPlatformPlugin>
  extends BasePlatformAccessory<T, P> {

  constructor(
    protected readonly platform: P,
    protected readonly api: API,
    protected readonly accessory: PlatformAccessory<AccessoryContext<T>>,
    protected readonly logger : Logger,
  ) {
    super(platform, api, accessory, logger);
  }

  protected createService(): Service {
    throw new Error('Method not implemented.');
  }

  protected initialValue(): CharacteristicValue {
    return this.accessory.context.__persisted_state[this.stateCharacteristic().UUID] || 0.0;
  }

  protected stateValueType(): string {
    return 'number';
  }

  protected stateCharacteristic(): WithUUID<new () => HAPCharacteristic> {
    return HAPCharacteristic.CurrentTemperature;
  }


}
