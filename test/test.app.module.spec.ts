import { faker } from '@faker-js/faker';
import { Test, type TestingModule } from '@nestjs/testing';
import { type Collection, type Db } from 'mongodb';
import { getMongoCollectionToken, getMongoDatabaseToken } from '../src';
import { TestAppModule } from './test.app.module';
import { TestService, type TestUser } from './test.service';

describe(`MongodbModule`, () => {
  let moduleRef!: TestingModule;
  let defaultCollection!: Collection<TestUser>;
  let archiveCollection!: Collection<TestUser>;

  let testService!: TestService;

  let defaultDb!: Db;
  let archiveDb!: Db;

  beforeAll(async () => {
    const { MONGODB_URL = `mongodb://localhost:27017` } = process.env;

    moduleRef = await Test.createTestingModule(
      TestAppModule.register({
        mongodbUrl: MONGODB_URL,
      }),
    ).compile();

    await moduleRef.init();

    archiveCollection = moduleRef.get(
      getMongoCollectionToken(`users`, `archive`),
    );
    defaultCollection = moduleRef.get(getMongoCollectionToken(`users`));
    archiveDb = moduleRef.get(getMongoDatabaseToken(`archive`));
    defaultDb = moduleRef.get(getMongoDatabaseToken());
    testService = moduleRef.get(TestService);
  });

  afterEach(async () => {
    await defaultDb.dropDatabase();
    await archiveDb.dropDatabase();
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it(`Should save user to archive and default database`, async () => {
    const user: TestUser = {
      name: faker.person.firstName(),
    };

    const countDocumentsBeforeInDefaultCollection =
      await defaultCollection.countDocuments();

    const countDocumentsBeforeInArchiveCollection =
      await archiveCollection.countDocuments();

    await testService.saveUser(user);

    const countDocumentsAfterInDefaultCollection =
      await defaultCollection.countDocuments();

    const countDocumentsAfterInArchiveCollection =
      await archiveCollection.countDocuments();

    expect(countDocumentsBeforeInArchiveCollection).toStrictEqual(0);
    expect(countDocumentsBeforeInDefaultCollection).toStrictEqual(0);
    expect(countDocumentsAfterInDefaultCollection).toStrictEqual(1);
    expect(countDocumentsAfterInArchiveCollection).toStrictEqual(1);
  });

  it(`Should save user to only default database`, async () => {
    const user: TestUser = {
      name: faker.person.firstName(),
    };

    const countDocumentsBeforeInDefaultCollection =
      await defaultCollection.countDocuments();

    const countDocumentsBeforeInArchiveCollection =
      await archiveCollection.countDocuments();

    await testService.saveUser(user, false);

    const countDocumentsAfterInDefaultCollection =
      await defaultCollection.countDocuments();

    const countDocumentsAfterInArchiveCollection =
      await archiveCollection.countDocuments();

    expect(countDocumentsBeforeInArchiveCollection).toStrictEqual(0);
    expect(countDocumentsBeforeInDefaultCollection).toStrictEqual(0);
    expect(countDocumentsAfterInDefaultCollection).toStrictEqual(1);
    expect(countDocumentsAfterInArchiveCollection).toStrictEqual(0);
  });
});
