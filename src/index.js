const express = require("express");
const { PORT } = require("./config/serverConfig");
const { connectDB } = require("./config/database");
const { connectRabbitMQ } = require("./config/rabbitmq");
const apiRoutes = require("./routes/index");
const correlationMiddleware = require("./middleware/correlation-middleware");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(correlationMiddleware);

app.use("/api", apiRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    service: "Review-Service",
    status: "HEALTHY",
    timestamp: new Date().toISOString(),
  });
});

const startServer = async () => {
  try {
    await connectDB();
    await connectRabbitMQ();

    app.listen(PORT, () => {
      console.log(`[Review Service] Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("[Review Service] Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
