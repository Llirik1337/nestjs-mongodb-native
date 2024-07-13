import {
  Inject,
  Module,
  type DynamicModule,
  type ForwardReference,
  type InjectionToken,
  type OnModuleDestroy,
  type OptionalFactoryDependency,
  type Provider,
  type Type,
} from '@nestjs/common';
import { MongoClient, type Db } from 'mongodb';

export class MongodbModuleOptions {
  url!: string;
  dbName?: string;
}

export class MongodbModuleCollectionOptions {
  collectionName!: string;
  dbName?: string;
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
export class MongodbModule implements OnModuleDestroy {
  constructor(private readonly client: MongoClient) {}

  async onModuleDestroy(): Promise<void> {
    await this.client.close();
  }

  static forRootAsync(params: {
    imports: Array<
      Type | DynamicModule | Promise<DynamicModule> | ForwardReference
    >;
    inject: Array<InjectionToken | OptionalFactoryDependency>;
    useFactory: (
      ...args: any[]
    ) => MongodbModuleOptions | Promise<MongodbModuleOptions>;
  }): DynamicModule {
    const defaultDatabaseToken = getMongoDatabaseToken();

    const providers: Provider[] | undefined = [
      {
        provide: MongodbModuleOptions,
        inject: params.inject,
        useFactory: params.useFactory,
      },
      {
        provide: MongoClient,
        inject: [MongodbModuleOptions],
        useFactory: async (options: MongodbModuleOptions) => {
          return await new Promise<MongoClient>((resolve, reject): void => {
            const client = new MongoClient(options.url);

            client.on(`error`, reject);
            client.on(`timeout`, reject);
            client.on(`connectionCheckOutFailed`, reject);

            client.on(`serverHeartbeatFailed`, (event) => {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment

              reject(new Error(JSON.stringify(event, undefined, 2)));
            });

            client.connect().then(resolve).catch(reject);
          });
        },
      },
      {
        provide: defaultDatabaseToken,
        inject: [MongoClient, MongodbModuleOptions],
        useFactory(mongoClient: MongoClient, options: MongodbModuleOptions) {
          return mongoClient.db(options.dbName);
        },
      },
    ];
    return {
      global: true,
      module: MongodbModule,
      imports: params.imports,
      providers,
      exports: providers,
    };
  }

  static forRoot(options: MongodbModuleOptions): DynamicModule {
    const defaultDatabaseToken = getMongoDatabaseToken();

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

          await client.connect();

          return client;
        },
      },
      {
        provide: defaultDatabaseToken,
        inject: [MongoClient, MongodbModuleOptions],
        useFactory(mongoClient: MongoClient, options: MongodbModuleOptions) {
          return mongoClient.db(options.dbName);
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
