const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'ticket-booking-service',
  brokers: [(process.env.KAFKA_BROKER || 'localhost:9092')],
  retry: { initialRetryTime: 300, retries: 5 },
});

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
