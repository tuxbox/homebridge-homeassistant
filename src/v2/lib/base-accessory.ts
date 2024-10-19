import { Service, PlatformAccessory, Logger, DynamicPlatformPlugin } from 'homebridge';
import { Service as HAPService, Characteristic } from 'hap-nodejs';
import { AccessoryConfiguration } from './accessory-configuration';
import { AccessoryContext } from './accessory-context';
import { EventEmitter, Events } from './events/event-channel';
import { AccessoryState } from './accessory-state';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export abstract class BasePlatformAccessory<
  StateType,
  Configuration extends AccessoryConfiguration,
  Platform extends DynamicPlatformPlugin> {

  protected readonly configuration: Configuration;
  protected service: Service;
  protected currentState : StateType;

  constructor(
    protected readonly platform: Platform,
    protected accessory: PlatformAccessory<AccessoryContext<StateType, Configuration>>,
    protected readonly log: Logger,
  ) {
    this.configuration = accessory.context.configuration;
    this.service = this.createService();
    this.currentState = this.initialValue();
  }

  protected abstract initialValue() : StateType;

  protected abstract createService() : Service;

  public configureAccessory() {
    this.log.debug('configureAccessory');
    this.preconfigureAccessory();
    this.log.debug(JSON.stringify(this.configuration));
    this.accessory.getService(HAPService.AccessoryInformation)!
      .setCharacteristic(Characteristic.Manufacturer, this.configuration.manufacturer || 'Homebridge')
      .setCharacteristic(Characteristic.Model, this.configuration.model || 'Homebridge Accessory')
      // eslint-disable-next-line max-len
      .setCharacteristic(Characteristic.SerialNumber, this.configuration.serial_number || 'dcbac663-04b2-42ae-ae03-3afd23037f93');
    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(Characteristic.Name, this.configuration.name);
    EventEmitter.on(`${Events.UpdateAccessoryState}:${this.accessory.UUID}`, (async (payload : AccessoryState<StateType>) => {
      this.log.debug('UpdateAccessoryState Event handled');
      const stuff = payload.value;
      this.updateCharacteristic(stuff);
    }).bind(this));
    this.postconfigureAccessory();
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected preconfigureAccessory() {
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected postconfigureAccessory() {
    this.updateCharacteristic(this.currentState);
  }

  public reconfigureAccessory(configuration: Configuration) {
    const currentConfiguration = this.accessory.context.configuration;
    if (currentConfiguration.last_changed === configuration.last_changed) {
      this.log.info('No update required - configuration unchanged');
      this.preReconfigureAccessory(false);
      this.doReconfigureAccessory(false, configuration);
      this.postReconfigureAccessory(false);
    } else {
      this.preReconfigureAccessory(false);
      this.doReconfigureAccessory(false, configuration);
      this.postReconfigureAccessory(false);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  protected preReconfigureAccessory(_updated: boolean) {

  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected doReconfigureAccessory(updated: boolean, configuration: Configuration) {
    if(updated) {
      this.accessory.context.configuration = configuration;
      this.service.setCharacteristic(Characteristic.Name, this.configuration.name);
    }
  }


  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  protected postReconfigureAccessory(_updated: boolean) {

  }

  protected abstract updateCharacteristic(value: StateType);

  async handleHomekitCurrentStateGet() : Promise<StateType> {
    return this.currentState!;
  }

}
