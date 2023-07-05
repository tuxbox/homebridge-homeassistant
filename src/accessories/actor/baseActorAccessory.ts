import { Logger, PlatformAccessory } from 'homebridge';
import { DeviceConfiguration } from '../../model/configuration/device-configuration';
import { HomeassistantHomebridgePlatform } from '../../platform';
import { BaseSensorPlatformAccessory } from '../sensors/baseSensorAccessory';
import { publishMessage } from '../../util/mqttHelpers';
import { ActorConfiguration } from '../../model/configuration/actorConfiguration';

export abstract class BaseActorPlatformAccessory<StateType, ActorType, T extends ActorConfiguration>
  extends BaseSensorPlatformAccessory<StateType, T> {

  constructor(
    protected readonly platform: HomeassistantHomebridgePlatform,
    protected readonly accessory: PlatformAccessory,
  ) {
    super(platform, accessory);
  }

  protected abstract mapActorTypeToPayload(value : ActorType) : string;

  async handleHomekitTargetStateSet(value : ActorType) {
    this.log.debug('handleTargetStateSet -> ', value);
    const payload = this.mapActorTypeToPayload(value);
    publishMessage({
      topic: this.configuration.command_topic,
      payload,
      opts: null,
    });
  }

}