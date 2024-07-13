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
        }),
      ],
    }).compile();

    collection = moduleRef.get(getMongoCollectionToken(`users`));
    mongodbClient = moduleRef.get(MongoClient);
    await moduleRef.init();
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
});
