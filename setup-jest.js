const { MongoMemoryServer } = require('mongodb-memory-server');

/**
 * @type {import('mongodb-memory-server').MongoMemoryServer}
 */
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();

  process.env.MONGODB_URL = mongoServer.getUri();
});

afterAll(async () => {
  await mongoServer.stop();
});
