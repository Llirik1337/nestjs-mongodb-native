import { faker } from '@faker-js/faker';
import { Test, type TestingModule } from '@nestjs/testing';
import { Collection, MongoClient } from 'mongodb';
import { MongodbModule, getMongoCollectionToken } from './mongodb.module';

describe(`MongodbModule`, () => {
  let moduleRef!: TestingModule;
  let collection!: Collection;
  let mongodbClient!: MongoClient;

  beforeAll(async () => {
    const { MONGODB_URL = `mongodb://localhost:27017` } = process.env;

    moduleRef = await Test.createTestingModule({
      imports: [
        MongodbModule.forRoot({ url: MONGODB_URL }),
        MongodbModule.forFeature({
          collectionName: `users`,
          indexes: [[{ name: 1 }]],
        }),
      ],
    }).compile();

    collection = moduleRef.get(getMongoCollectionToken(`users`));
    mongodbClient = moduleRef.get(MongoClient);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it(`Should forRoot initialize`, () => {
    expect(mongodbClient).toBeInstanceOf(MongoClient);
  });

  it(`Should forFeature create collection`, () => {
    expect(collection).toBeInstanceOf(Collection);
  });

  it(`Should forFeature create collection with indexes`, async () => {
    const indexes = await collection.indexes();

    expect(indexes).toStrictEqual([
      { v: 2, key: { _id: 1 }, name: `_id_` },
      { v: 2, key: { name: 1 }, name: `name_1` },
    ]);
  });

  it(`Should insert document and remove`, async () => {
    const user = { name: faker.person.firstName() };

    const countDocumentsBeforeInsert = await collection.countDocuments();

    const insertedDocument = await collection.insertOne(user);

    const countDocumentsAfterInsert = await collection.countDocuments();

    await collection.deleteOne({
      _id: insertedDocument.insertedId,
    });

    const countDocumentsAfterDelete = await collection.countDocuments();

    expect(countDocumentsBeforeInsert).toStrictEqual(0);
    expect(countDocumentsAfterInsert).toStrictEqual(1);
    expect(countDocumentsAfterDelete).toStrictEqual(0);
  });

  it(`Should throw error on insert duplicate document`, async () => {
    const user = { name: faker.person.firstName() };

    await collection.insertOne(user);
    await expect(collection.insertOne(user)).rejects.toThrow();
  });
});
