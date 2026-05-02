const nodemailer = require('nodemailer');

// Create a single reusable transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  secure: false,
  auth: {
    user: 'annabelle87@ethereal.email',
    pass: 'nJxxs9RfrRfWREfZT8'
  }
});

// Verify connection on startup (non-fatal if email not configured)
transporter.verify((err) => {
  if (err) {
    console.warn('[notification] Email transporter not configured:', err.message);
  } else {
    console.log('[notification] Email transporter ready');
  }
});

/**
 * Send a booking confirmation email
 */
async function sendBookingConfirmation(booking) {
  const passengerList = booking.passengers
    .map(p => `  • ${p.name} — Seat ${p.seatNumber}`)
    .join('\n');

  const mailOptions = {
    from: `"Train Booking System" <${process.env.EMAIL_USER}>`,
    to: booking.contactEmail,
    subject: `Booking Confirmed — ${booking.bookingReference}`,
    text: `
Dear Passenger,

Your ticket has been confirmed!

Booking Reference : ${booking.bookingReference}
Route             : ${booking.origin} → ${booking.destination}
Journey Date      : ${new Date(booking.journeyDate).toDateString()}
Class             : ${booking.seatClass}
Total Amount      : LKR ${booking.totalAmount.toFixed(2)}

Passengers:
${passengerList}

Please arrive at the station 30 minutes before departure.

Thank you for travelling with us.
— Train Booking System
    `.trim(),
    html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e0e0e0;border-radius:8px">
  <h2 style="color:#1a73e8">Booking Confirmed ✓</h2>
  <p>Your ticket has been confirmed. Details below:</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Reference</td><td style="padding:8px">${booking.bookingReference}</td></tr>
    <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Route</td><td style="padding:8px">${booking.origin} → ${booking.destination}</td></tr>
    <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Date</td><td style="padding:8px">${new Date(booking.journeyDate).toDateString()}</td></tr>
    <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Class</td><td style="padding:8px">${booking.seatClass}</td></tr>
    <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold">Total</td><td style="padding:8px">LKR ${booking.totalAmount.toFixed(2)}</td></tr>
  </table>
  <h3>Passengers</h3>
  <ul>${booking.passengers.map(p => `<li>${p.name} — Seat <strong>${p.seatNumber}</strong></li>`).join('')}</ul>
  <p style="color:#666;font-size:13px">Please arrive at the station 30 minutes before departure.</p>
  <p style="color:#666;font-size:13px">— Train Booking System</p>
</div>`,
  };

  return transporter.sendMail(mailOptions);
}

/**
 * Send a booking cancellation email
 */
async function sendCancellationNotice(booking) {
  const mailOptions = {
    from: `"Train Booking System" <${process.env.EMAIL_USER}>`,
    to: booking.contactEmail,
    subject: `Booking Cancelled — ${booking.bookingReference}`,
    text: `
Your booking ${booking.bookingReference} (${booking.origin} → ${booking.destination}) has been cancelled.
Refund of LKR ${booking.totalAmount.toFixed(2)} will be processed within 5-7 business days.
— Train Booking System
    `.trim(),
    html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e0e0e0;border-radius:8px">
  <h2 style="color:#d32f2f">Booking Cancelled</h2>
  <p>Your booking <strong>${booking.bookingReference}</strong> for the journey<br>
  <strong>${booking.origin} → ${booking.destination}</strong> has been cancelled.</p>
  <p>A refund of <strong>LKR ${booking.totalAmount.toFixed(2)}</strong> will be processed within 5–7 business days.</p>
  <p style="color:#666;font-size:13px">— Train Booking System</p>
</div>`,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendBookingConfirmation, sendCancellationNotice };
