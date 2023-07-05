import { PlatformAccessory } from 'homebridge';
import { HomeassistantHomebridgePlatform } from '../../platform';
import { BaseSensorPlatformAccessory } from '../sensors/baseSensorAccessory';
import { publishMessage } from '../../util/mqttHelpers';
import { ActorConfiguration } from '../../model/configuration/actorConfiguration';
import { EventEmitter, Events } from '../../util/eventChannel';
import { Payload } from '../../model/mqtt/mqtt-payload';

export abstract class BaseActorPlatformAccessory<StateType, ActorType, T extends ActorConfiguration>
  extends BaseSensorPlatformAccessory<StateType, T> {

  constructor(
    protected readonly platform: HomeassistantHomebridgePlatform,
    protected readonly accessory: PlatformAccessory,
  ) {
    super(platform, accessory);
    EventEmitter.on(`${Events.MqttMessageReceived}:${accessory.context.configuration.command_topic}`, ((payload : Payload) => {
      this.log.debug(`Handling MQTT command update for accessory ${this.accessory.displayName} - noop`);
    }).bind(this));
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