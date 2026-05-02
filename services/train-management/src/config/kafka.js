const { Kafka } = require('kafkajs');

const kafkaConfig = {
  clientId: 'train-management-service',
  brokers: [(process.env.KAFKA_BROKER || 'localhost:9092')],
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
    console.log('[train-management] Kafka producer connected');
  } catch (err) {
    console.warn('[train-management] Kafka not available, continuing without it:', err.message);
  }
}

async function publishEvent(topic, message) {
  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
  } catch (err) {
    console.error(`[train-management] Failed to publish to ${topic}:`, err.message);
  }
}

module.exports = { connectKafka, publishEvent };
