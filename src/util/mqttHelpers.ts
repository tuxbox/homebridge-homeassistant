import { MqttPublishEvent } from '../model/mqtt/mqttPublishEvent';
import { MqttSubscribeEvent } from '../model/mqtt/mqttSubscribeEvent';
import { EventEmitter, Events } from './eventChannel';

const publishMessage = async function(event : MqttPublishEvent) {
  EventEmitter.emit(Events.MqttPublish, event);
};

const subscribeTopic = async function(event : MqttSubscribeEvent) {
  EventEmitter.emit(Events.MqttSubscribe, event);
};

export { publishMessage, subscribeTopic };