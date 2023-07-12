import {
  Module,
  type DynamicModule,
  type OnModuleDestroy,
  type Provider,
} from '@nestjs/common';
import { MongoClient, type Collection } from 'mongodb';

export class MongodbModuleOptions {
  url!: string;
}

export class MongodbModuleCollectionOptions {
  collectionName!: string;
  dbName?: string;
  indexes?: Array<Parameters<Collection['createIndex']>>;
}

export const getMongoCollectionToken = (name: string): string =>
  `${MongodbModule.name.toLocaleUpperCase()}_COLLECTION_${name.toLocaleUpperCase()}`;

export const getMongoCollectionOptionsToken = (name: string): string =>
  `${getMongoCollectionToken(name)}_OPTIONS`;

@Module({})
export class MongodbModule implements OnModuleDestroy {
  private static mongoClient: MongoClient;

  async onModuleDestroy(): Promise<void> {
    await MongodbModule.mongoClient.close();
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
    const providers: Provider[] = [
      {
        provide: optionsToken,
        useValue: options,
      },
      {
        provide: getMongoCollectionToken(options.collectionName),
        inject: [MongoClient, optionsToken],
        useFactory: async (
          mongoClient: MongoClient,
          options: MongodbModuleCollectionOptions,
        ) => {
          const collection = mongoClient
            .db(options.dbName)
            .collection(options.collectionName);

          if (options.indexes != null) {
            await Promise.all(
              options.indexes.map(async (args) => {
                return await collection.createIndex(...args);
              }),
            );
          }

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
