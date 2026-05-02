const { Kafka } = require('kafkajs');
const SeatInventory = require('../models/SeatInventory');

const kafkaConfig = {
  clientId: 'seat-availability-service',
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
const consumer = kafka.consumer({ groupId: 'seat-availability-group' });

async function connectKafka() {
  try {
    await producer.connect();
    console.log('[seat-availability] Kafka producer connected');

    await consumer.connect();
    // Subscribe to booking.cancelled so we can release seats
    await consumer.subscribe({ topics: ['booking.cancelled'], fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        const data = JSON.parse(message.value.toString());
        console.log(`[seat-availability] Received ${topic}:`, data);

        if (topic === 'booking.cancelled') {
          // Release seats back to available
          await SeatInventory.findOneAndUpdate(
            { scheduleId: data.scheduleId },
            {
              $inc: { availableSeats: data.seatCount || 1 },
              $pull: { reservedSeats: { bookingId: data.bookingId } },
            }
          );
          console.log(`[seat-availability] Released ${data.seatCount} seat(s) for booking ${data.bookingId}`);
        }
      },
    });

    console.log('[seat-availability] Kafka consumer listening on: booking.cancelled');
  } catch (err) {
    console.warn('[seat-availability] Kafka not available, continuing without it:', err.message);
  }
}

async function publishEvent(topic, message) {
  try {
    await producer.send({ topic, messages: [{ value: JSON.stringify(message) }] });
  } catch (err) {
    console.error(`[seat-availability] Failed to publish to ${topic}:`, err.message);
  }
}

module.exports = { connectKafka, publishEvent };
