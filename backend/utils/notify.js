import Notification from "../models/Notification.js";

/**
 * Central notification dispatcher. Persists an in-app Notification doc
 * always, then fans out to SMS/push/email if configured. Twilio and
 * Firebase clients are lazily required so the app runs fine in dev
 * without those env vars set (it just logs instead of sending).
 */
export async function notify({ userId, type, title, body, channel = ["push"], relatedListing, io, phone, email, pushToken }) {
  const doc = await Notification.create({ user: userId, type, title, body, channel, relatedListing });

  // Real-time in-app push via Socket.io, if the server passed an io instance
  if (io) io.to(`user:${userId}`).emit("notification", doc);

  if (channel.includes("sms") && phone) await sendSMS(phone, `${title}: ${body}`);
  if (channel.includes("email") && email) await sendEmail(email, title, body);
  if (channel.includes("push") && pushToken) await sendPush(pushToken, title, body);

  return doc;
}

async function sendSMS(to, message) {
  if (!process.env.TWILIO_ACCOUNT_SID) {
    console.log(`[SMS:dev-mode] to=${to} msg="${message}"`);
    return;
  }
  const twilio = (await import("twilio")).default;
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  await client.messages.create({ body: message, from: process.env.TWILIO_PHONE_NUMBER, to });
}

async function sendEmail(to, subject, text) {
  if (!process.env.SMTP_HOST) {
    console.log(`[Email:dev-mode] to=${to} subject="${subject}"`);
    return;
  }
  // Plug in nodemailer or SendGrid here.
  console.log(`[Email] to=${to} subject="${subject}" body="${text}"`);
}

async function sendPush(token, title, body) {
  if (!process.env.FIREBASE_SERVER_KEY) {
    console.log(`[Push:dev-mode] token=${token} title="${title}"`);
    return;
  }
  // Plug in firebase-admin messaging().send() here.
  console.log(`[Push] token=${token} title="${title}" body="${body}"`);
}
