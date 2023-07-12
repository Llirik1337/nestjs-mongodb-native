import { Module, type ModuleMetadata, type Provider } from '@nestjs/common';
import { MongodbModule } from '../src';
import { TestService } from './test.service';

export interface Config {
  mongodbUrl: string;
}

@Module({})
export class TestAppModule {
  static register(config: Config): ModuleMetadata {
    const imports = [
      MongodbModule.forRoot({
        url: config.mongodbUrl,
      }),
      MongodbModule.forFeature({
        collectionName: `users`,
      }),
      MongodbModule.forFeature({
        collectionName: `users`,
        dbName: `archive`,
      }),
    ];
    const providers: Provider[] = [TestService];

    return {
      imports,
      providers,
      exports: providers,
    };
  }
}
