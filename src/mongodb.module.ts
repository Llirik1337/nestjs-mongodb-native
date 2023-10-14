import {
  Inject,
  Module,
  type DynamicModule,
  type OnModuleDestroy,
  type Provider,
  type OnModuleInit,
} from '@nestjs/common';
import { MongoClient, type Collection, type Db } from 'mongodb';

export class MongodbModuleOptions {
  url!: string;
}

export class MongodbModuleCollectionOptions {
  collectionName!: string;
  dbName?: string;
  indexes?: Array<Parameters<Collection['createIndex']>>;
}

export const getMongoCollectionToken = (
  name: string,
  dbName?: string,
): string =>
  `${getMongoDatabaseToken(dbName)}_COLLECTION_${name.toLocaleUpperCase()}`;

export const getMongoDatabaseToken = (name = `default`): string =>
  `${MongodbModule.name.toLocaleUpperCase()}_DATABASE_${name.toLocaleUpperCase()}`;

export const getMongoCollectionOptionsToken = (name: string): string =>
  `${getMongoCollectionToken(name)}_OPTIONS`;

export const InjectCollection = (
  name: string,
  dbName?: string,
): ReturnType<typeof Inject> => Inject(getMongoCollectionToken(name, dbName));

@Module({})
export class MongodbModule implements OnModuleDestroy, OnModuleInit {
  async onModuleInit(): Promise<void> {
    await Promise.all(
      [...MongodbModule.initIndexList.values()].map(async (initFn) => {
        await initFn();
      }),
    );
  }

  private static mongoClient: MongoClient;

  static initIndexList = new Set<() => Promise<void>>();

  async onModuleDestroy(): Promise<void> {
    await MongodbModule.mongoClient.close();
    MongodbModule.initIndexList.clear();
  }

  static forRoot(options: MongodbModuleOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: MongodbModuleOptions,
        useValue: options,
      },
      {
        provide: MongoClient,
        inject: [MongodbModuleOptions],
        useFactory: async (options: MongodbModuleOptions) => {
          const client = new MongoClient(options.url);

          MongodbModule.mongoClient = client;

          await client.connect();

          return client;
        },
      },
    ];

    return {
      global: true,
      module: MongodbModule,
      providers,
      exports: providers,
    };
  }

  static forFeature(options: MongodbModuleCollectionOptions): DynamicModule {
    const optionsToken = getMongoCollectionOptionsToken(options.collectionName);
    const databaseToken = getMongoDatabaseToken(options.dbName);
    const collectionToken = getMongoCollectionToken(
      options.collectionName,
      options.dbName,
    );

    const providers: Provider[] = [
      {
        provide: optionsToken,
        useValue: options,
      },
      {
        provide: databaseToken,
        inject: [MongoClient, optionsToken],
        useFactory(
          mongoClient: MongoClient,
          options: MongodbModuleCollectionOptions,
        ) {
          return mongoClient.db(options.dbName);
        },
      },
      {
        provide: collectionToken,
        inject: [optionsToken, databaseToken],
        useFactory: (options: MongodbModuleCollectionOptions, db: Db) => {
          const collection = db.collection(options.collectionName);

          this.initIndexList.add(async (): Promise<void> => {
            if (options.indexes != null) {
              await Promise.all(
                options.indexes.map(async (args) => {
                  await collection.createIndex(...args);
                }),
              );
            }
          });

          return collection;
        },
      },
    ];

    return {
      module: MongodbModule,
      providers,
      exports: providers,
    };
  }
}
