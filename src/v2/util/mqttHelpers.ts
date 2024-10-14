import { MqttPublishEvent } from '../model/mqtt/mqttPublishEvent';
import { MqttSubscribeEvent } from '../model/mqtt/mqttSubscribeEvent';
import { MqttUnsubscribeEvent } from '../model/mqtt/mqttUnsubscribeEvent';
import { EventEmitter, Events } from './eventChannel';

const publishMessage = async function(event : MqttPublishEvent) {
  EventEmitter.emit(Events.MqttPublish, event);
};

const subscribeTopic = async function(event : MqttSubscribeEvent) {
  EventEmitter.emit(Events.MqttSubscribe, event);
};

const unsubscribeTopics = async function(event: MqttUnsubscribeEvent) {
  EventEmitter.emit(Events.MqttUnsubscribe, event);
};

export { publishMessage, subscribeTopic, unsubscribeTopics };