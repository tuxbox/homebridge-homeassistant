export type MqttPublishEvent = {
  topic : string;
  payload : string;
  opts : object | null;
};