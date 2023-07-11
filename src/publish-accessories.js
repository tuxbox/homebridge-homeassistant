/*const nunjucks = require('nunjucks');

const template = nunjucks.compile('{{ value_json.POWER }}');

console.log(template.render({"value":"{\"POWER\":\"ON\"}","value_json":{"POWER":"ON"}}));
*/
const MqttClient = require('async-mqtt');

const accessories = [
  // eslint-disable-next-line max-len, quotes
  { 'topic': 'lock/shellies-811503bd-ae80-42c0-afc4-a82f3d537415/lock-basement-frontdoor/config', 'configuration': {"unique_id":"smartesthome-lock-basement-frontdoor-811503bd-ae80-42c0-afc4-a82f3d537415","availability_topic":"shellies/smartesthome/basement/lock/door/online","payload_available":"true","payload_unavailable":"false","availability_template":"{{ value|string|lower }}","json_attributes_topic":"shellies/smartesthome/basement/lock/door/info","json_attributes_template":"{{ value }}","state_topic":"shellies/smartesthome/basement/lock/door/relay/0","value_template":"{{ value }}","payload_unlock":"on","payload_lock":"off","state_locked":"off","state_unlocked":"on","command_topic":"shellies/smartesthome/basement/lock/door/relay/0/command","name":"Switch basement frontdoor 3494546ACABA","device":{"identifiers":"shelly-3494546ACABA-811503bd-ae80-42c0-afc4-a82f3d537415","name":"Shelly","suggested_area":"basement","model":"shelly-1","manufacturer":"Allterco Robotics"}} },
  // eslint-disable-next-line max-len, quotes
  { 'topic': 'sensor/shellies-811503bd-ae80-42c0-afc4-a82f3d537415/battery-kitchen-08B61FCE9774/config', 'configuration': {"device_class":"battery","unit_of_measurement":"%","unique_id":"smartesthome-battery-kitchen-811503bd-ae80-42c0-afc4-a82f3d537415","json_attributes_topic":"shellies/smartesthome/kitchen/sensors/shelly-ht/status/devicepower:0","json_attributes_template":"{{ value_json.battery|tojson }}","state_topic":"shellies/smartesthome/kitchen/sensors/shelly-ht/status/devicepower:0","value_template":"{{ value_json.battery.percent }}","name":"Battery Shelly HT kitchen","device":{"identifiers":"shelly-08B61FCE9774-811503bd-ae80-42c0-afc4-a82f3d537415","name":"Shelly Plus HT","suggested_area":"kitchen","model":"shelly-plus-ht","manufacturer":"Allterco Robotics"}} },
];

( async () => {
  const client = await MqttClient.connectAsync('tcp://smartbuntu-alt.smarthome.lan:61613', {
    'username': 'iulius@smartesthome',
    'password': 'T5CxqKacidburn',
  });

  await client.publish('test/homebridge/status', 'configuration started');

  // eslint-disable-next-line max-len
  const futures = accessories.map((accessory) => client.publish(`test/homebridge/accessories/${accessory.topic}`, JSON.stringify(accessory.configuration)) );

  console.log(futures.length);

  await Promise.allSettled(futures);

  await client.publish('test/homebridge/status', 'configuration done')
  client.end();
})();