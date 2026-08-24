const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  PORT: process.env.PORT || 5017,
  MONGODB_URI:
    process.env.MONGODB_URI ||
    "mongodb+srv://krishukumarsingh:28144136@cluster0.zrjmugd.mongodb.net/ecommerce_review",
  RABBITMQ_URL: process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672",
  ORDER_SERVICE_URL:
    process.env.ORDER_SERVICE_URL || "http://localhost:5012",
  PRODUCT_SERVICE_URL:
    process.env.PRODUCT_SERVICE_URL || "http://localhost:5009",
  JWT_SECRET:
    process.env.SECRET_TOKEN ||
    process.env.JWT_SECRET ||
    "krishukumar@2814",
};
