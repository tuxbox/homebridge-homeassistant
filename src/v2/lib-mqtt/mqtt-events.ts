/**
 *
 */
export const MqttEvents = {
  'ConfigureMQTT': 'mqtt:configure',
  'SubscribeTopic': 'mqtt:subscribe:topic',
  'PublishMessage': 'mqtt:message:publish',
  'UnsubscribeTopic': 'mqtt:unsubscribe:topic',
  'MessageReceived': 'mqtt:message:received',
  'MqttError': 'error:mqtt',
};

/**
 *
 */
type MqttBaseMessage = {
  topic: string;
  qos: 0 | 1 | 2 | undefined;
  retain: boolean | undefined;
};

/**
 *
 */
export type MqttSubscription = MqttBaseMessage;

/**
 *
 */
export type MqttCancelSubscription = {
  topic: string;
};

/**
 *
 */
export type MqttMessage = MqttBaseMessage & {
  payload : string;
};

/**
 *
 */
export type MqttConfiguration = {
  client_id: string | undefined;
  protocol: 'tcp' | 'tcps';
  host: string;
  port: string;
  username: string;
  password: string;
  keepalive: number | undefined;
  clean_session: boolean | undefined;
};
