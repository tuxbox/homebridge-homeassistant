import { PlatformAccessory } from 'homebridge';
import { DeviceConfiguration } from '../../model/configuration/device-configuration';
import { HomeassistantHomebridgePlatform } from '../../platform';
import { BaseSensorPlatformAccessory } from '../sensors/baseSensorAccessory';
import { EventEmitter, Events } from '../../util/eventChannel';

export abstract class BaseActorPlatformAccessory<StateType, ActorType, T extends DeviceConfiguration>
  extends BaseSensorPlatformAccessory<StateType, T> {

  constructor(
    protected readonly platform: HomeassistantHomebridgePlatform,
    protected readonly accessory: PlatformAccessory,
  ) {
    super(platform, accessory);
  }

  protected abstract mapActorTypeToPayload(value : ActorType) : unknown;

  async handleHomekitTargetStateSet(value : ActorType) {
    this.platform.log.debug('handleTargetStateSet -> ', value);
    const payload = this.mapActorTypeToPayload(value);
    EventEmitter.emit(Events.MqttPublish, { payload });
  }

}