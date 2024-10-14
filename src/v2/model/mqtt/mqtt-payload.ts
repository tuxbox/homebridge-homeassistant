export type Payload = {
  topic: string;
  payload: string;
};

export type SensorPayload<T> = {
  source: string;
  type: string;
  published_at: string;
  value: T;
  uom: string;
};
