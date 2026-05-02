const { Kafka } = require('kafkajs');
const Notification = require('../models/Notification');
const { sendBookingConfirmation, sendCancellationNotice } = require('./mailer');

const kafkaConfig = {
  clientId: 'notification-service',
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

const consumer = kafka.consumer({ groupId: 'notification-group' });

async function connectKafka() {
  try {
    await consumer.connect();
    await consumer.subscribe({
      topics: ['booking.created', 'booking.cancelled'],
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        let data;
        try {
          data = JSON.parse(message.value.toString());
        } catch {
          console.error('[notification] Failed to parse Kafka message');
          return;
        }

        console.log(`[notification] Received event: ${topic}`, data.bookingReference);

        let type, subject, emailSent = false, emailError = null;

        if (topic === 'booking.created') {
          type = 'BOOKING_CONFIRMED';
          subject = `Booking Confirmed — ${data.bookingReference}`;
          try {
            await sendBookingConfirmation(data);
            emailSent = true;
            console.log(`[notification] Confirmation email sent to ${data.contactEmail}`);
          } catch (err) {
            emailError = err.message;
            console.warn(`[notification] Email send failed (non-fatal): ${err.message}`);
          }
        }

        if (topic === 'booking.cancelled') {
          type = 'BOOKING_CANCELLED';
          subject = `Booking Cancelled — ${data.bookingReference}`;
          try {
            await sendCancellationNotice(data);
            emailSent = true;
            console.log(`[notification] Cancellation email sent to ${data.contactEmail}`);
          } catch (err) {
            emailError = err.message;
            console.warn(`[notification] Email send failed (non-fatal): ${err.message}`);
          }
        }

        // Always persist notification record regardless of email success
        await Notification.create({
          bookingId: data.bookingId,
          bookingReference: data.bookingReference,
          recipientEmail: data.contactEmail,
          type,
          subject,
          payload: data,
          status: emailSent ? 'SENT' : 'FAILED',
          errorMessage: emailError,
          sentAt: emailSent ? new Date() : undefined,
        });
      },
    });

    console.log('[notification] Kafka consumer listening on: booking.created, booking.cancelled');
  } catch (err) {
    console.warn('[notification] Kafka not available, continuing without it:', err.message);
  }
}

module.exports = { connectKafka };
