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

export type ActorStatePayload = {
  source: string;
  type: string;
  published_at: string;
  value: string;
};

export type ActorCommandPayload = {
  source: string;
  type: string;
  published_at: string;
  value: string;
};
