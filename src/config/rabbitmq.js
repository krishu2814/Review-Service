const amqplib = require("amqplib");
const { RABBITMQ_URL } = require("./serverConfig");
const { getCorrelationId } = require("../middleware/correlation-middleware");

let channel = null;
let connection = null;

const EXCHANGE_NAME = "ecommerce_events";
const DLX_NAME = "ecommerce_dlx";

async function connectRabbitMQ() {
  try {
    connection = await amqplib.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
    await channel.assertExchange(DLX_NAME, "topic", { durable: true });

    console.log("[RabbitMQ] Review Service connected to RabbitMQ");

    connection.on("error", (err) => {
      console.error("[RabbitMQ Error] Review Service connection error:", err.message);
    });

    connection.on("close", () => {
      console.warn("[RabbitMQ Warning] Review Service connection closed. Reconnecting...");
      setTimeout(connectRabbitMQ, 5000);
    });

    return channel;
  } catch (error) {
    console.error("[RabbitMQ Error] Review Service RabbitMQ connection failed:", error.message);
    setTimeout(connectRabbitMQ, 5000);
  }
}

async function publishEvent(routingKey, message) {
  try {
    if (!channel) {
      await connectRabbitMQ();
    }

    const correlationId = getCorrelationId();
    const headers = {
      "x-correlation-id": correlationId,
    };

    const payload = Buffer.from(
      JSON.stringify({
        ...message,
        correlationId,
      }),
    );

    channel.publish(EXCHANGE_NAME, routingKey, payload, {
      persistent: true,
      headers,
    });

    console.log(`[RabbitMQ Publish] Event [${routingKey}] sent with Trace [${correlationId}]`);
  } catch (error) {
    console.error(`[RabbitMQ Error] Failed to publish event [${routingKey}]:`, error.message);
  }
}

function getChannel() {
  return channel;
}

module.exports = {
  connectRabbitMQ,
  publishEvent,
  getChannel,
  EXCHANGE_NAME,
  DLX_NAME,
};
