const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 *
 * Concepts for College / Viva Presentation:
 * 1. Mongoose is an ODM (Object Data Modeling) library for MongoDB and Node.js.
 *    It manages relationships between data, provides schema validation, and translates
 *    between objects in code and the representation of those objects in MongoDB.
 * 2. mongoose.connect(uri, options):
 *    - Initiates an asynchronous connection to the MongoDB cluster or local daemon.
 *    - Uses a connection string URI (e.g., mongodb://localhost:27017/blog-platform).
 *    - Returns a Promise that resolves when connection is successfully established.
 *
 * 3. Fallback Strategy (mongodb-memory-server):
 *    - If the configured MongoDB URI (local or Atlas) is unreachable, we automatically
 *      start an in-memory MongoDB instance using the mongodb-memory-server package.
 *    - This is perfect for development and college demos — no separate MongoDB install needed.
 *    - NOTE: Data in memory mode is lost when the server restarts.
 */
const connectDB = async () => {
  try {
    // First, try connecting to the configured MongoDB URI (local or Atlas)
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Fail fast if MongoDB isn't reachable (5 seconds)
    });

    console.log(`[Database] MongoDB Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[Database] Could not connect to MongoDB at ${process.env.MONGODB_URI}`);
    console.warn(`[Database] Reason: ${error.message}`);
    console.log('[Database] Starting in-memory MongoDB server as fallback...');

    try {
      // Use mongodb-memory-server as a fallback (no external MongoDB needed)
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create({
        instance: { startTimeout: 30000 }, // Allow up to 30 seconds for first-time startup
      });
      const memoryUri = mongoServer.getUri();

      await mongoose.connect(memoryUri);

      console.log(`[Database] In-memory MongoDB started successfully at ${memoryUri}`);
      console.log('[Database] NOTE: Data will be lost when the server restarts.');
    } catch (memError) {
      console.error(`[Database Error] Failed to start in-memory MongoDB: ${memError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
