import { DeviceDetails } from '../mqtt/device-details';

export type DeviceConfiguration = {
  unique_id : string;
  device_class: string | null;
  state_topic: string;
  value_template: string;
  name: string;
  device: DeviceDetails | null;
};
