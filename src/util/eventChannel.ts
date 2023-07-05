import { EventEmitter as NodeEventEmitter } from 'events';

export const EventEmitter = new NodeEventEmitter();
export const Events= {
  'ConfigureDevice': 'configure:device',
  'MqttSubscribe': 'mqtt:subscribe',
  'MqttPublish': 'mqtt:publish',
  'MqttUnsubscribe': 'mqtt:unsubscribe',
  'MqttMessageReceived': 'mqtt:message:received',
  // TODO remove 'SetCurrentState': 'set-current-state',
  // TODO remove 'GetTargetState': 'get-target-state',
  // TODO remove test 'SetTargetState': 'set-target-state',
};
