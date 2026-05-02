const { Kafka } = require('kafkajs');

const kafkaConfig = {
  clientId: 'ticket-booking-service',
  brokers: (process.env.KAFKA_BROKER || 'localhost:9092').split(','),
  connectionTimeout: 10000,
  authenticationTimeout: 10000,
  retry: { initialRetryTime: 300, retries: 5 },
};

if (process.env.KAFKA_USERNAME && process.env.KAFKA_PASSWORD) {
  kafkaConfig.ssl = true;
  kafkaConfig.sasl = {
    mechanism: 'plain',
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD,
  };
}

const kafka = new Kafka(kafkaConfig);

const producer = kafka.producer();

async function connectKafka() {
  try {
    await producer.connect();
    console.log('[ticket-booking] Kafka producer connected');
  } catch (err) {
    console.warn('[ticket-booking] Kafka not available, continuing without it:', err.message);
  }
}

async function publishEvent(topic, message) {
  try {
    await producer.send({ topic, messages: [{ value: JSON.stringify(message) }] });
    console.log(`[ticket-booking] Published to ${topic}:`, message);
  } catch (err) {
    console.error(`[ticket-booking] Failed to publish to ${topic}:`, err.message);
  }
}

module.exports = { connectKafka, publishEvent };
