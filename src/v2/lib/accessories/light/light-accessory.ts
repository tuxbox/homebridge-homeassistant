import {
  Characteristic as HAPCharacteristic,
  Service as HAPService,
} from 'hap-nodejs';
import { API, Characteristic, CharacteristicValue, DynamicPlatformPlugin, Logger, PlatformAccessory, Service, WithUUID } from 'homebridge';
import { AccessoryConfiguration } from '../../accessory-configuration';
import { BasePlatformAccessory } from '../base-accessory';
import { EventEmitter, Events } from '../../events/event-channel';
import { AccessoryContext } from '../../accessory-context';
import { AccessoryState } from '../../accessory-state';

export class LightAccessory<
  T extends AccessoryConfiguration,
  P extends DynamicPlatformPlugin
> extends BasePlatformAccessory<T, P> {

  private brightnessState : CharacteristicValue;

  constructor(
    protected readonly platform: P,
    protected readonly api: API,
    protected readonly accessory: PlatformAccessory<AccessoryContext<T>>,
    protected readonly logger : Logger,
  ) {
    super(platform, api, accessory, logger);
    this.brightnessState = this.accessory.context.__persisted_state[HAPCharacteristic.Brightness.UUID] || 0.0;
  }

  protected initialValue(): CharacteristicValue {
    return 0;
  }

  protected createService(): Service {
    return this.accessory.getService(HAPService.Lightbulb) || this.accessory.addService(HAPService.Lightbulb);
  }

  protected stateCharacteristic(): WithUUID<new () => Characteristic> {
    return HAPCharacteristic.On;
  }

  protected override postconfigureAccessory(): void {
    super.postconfigureAccessory();
    this.service.getCharacteristic(this.stateCharacteristic())
      .onSet(this.handleHomekitCurrentStateSet.bind(this));
    this.service.addOptionalCharacteristic(HAPCharacteristic.Brightness);
    //this.service.addOptionalCharacteristic(HAPCharacteristic.Saturation);
    //this.service.addOptionalCharacteristic(HAPCharacteristic.Hue);
    //this.service.addOptionalCharacteristic(HAPCharacteristic.ColorTemperature);
    this.service.getCharacteristic(HAPCharacteristic.Brightness)
      .onGet(this.handleHomekitBrightnessGet.bind(this))
      .onSet(this.handleHomekitBrightnessSet.bind(this));
    EventEmitter.on(`${Events.UpdateAccessoryState}:${this.accessory.UUID}:brightness`, (async (payload : AccessoryState) => {
      const stuff = payload.value;
      this.updateCharacteristic(HAPCharacteristic.Brightness, stuff);
    }).bind(this));
  }

  async handleHomekitCurrentStateSet(value : CharacteristicValue) : Promise<void> {
    this.log.debug(`handleHomekitTargetStateSet - ${value} - ${typeof value}`);
    this.currentState = value;
    try {
      EventEmitter.emit(`${Events.PublishAccessoryState}:${this.accessory.UUID}`, {
        configuration: this.accessory.context.configuration,
        payload: {
          value,
        },
      });
    } catch (e) {
      this.log.error(JSON.stringify(e));
    }
  }

  async handleHomekitBrightnessGet() : Promise<CharacteristicValue> {
    return this.brightnessState;
  }

  async handleHomekitBrightnessSet(value : CharacteristicValue) : Promise<void> {
    this.log.debug(`handleHomekitBrightnessSet - ${value} - ${typeof value}`);
    this.brightnessState = value;
    try {
      EventEmitter.emit(`${Events.PublishAccessoryState}:${this.accessory.UUID}:brightness`, {
        configuration: this.accessory.context.configuration,
        payload: {
          value,
        },
      });
    } catch (e) {
      this.log.error(JSON.stringify(e));
    }
  }

}