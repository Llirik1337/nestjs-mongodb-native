# NestJS MongoDB Native

[![npm version](https://badge.fury.io/js/nestjs-mongodb-native.svg)](https://badge.fury.io/js/nestjs-mongodb-native)
[![License](https://img.shields.io/github/license/Llirik1337/nestjs-mongodb-native)](https://github.com/Llirik1337/nestjs-mongodb-native/blob/master/LICENSE)

A package for integrating MongoDB with NestJS using the MongoDB native driver.

## Installation

```bash
npm install nestjs-mongodb-native
```

## Usage

Import the `MongodbModule` into your NestJS application and provide the MongoDB connection options.

```typescript
import { Module } from '@nestjs/common';
import { MongodbModule } from 'nestjs-mongodb-native';

@Module({
  imports: [
    MongodbModule.forRoot({
      uri: 'mongodb://localhost:27017/mydatabase',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    }),
  ],
})
export class AppModule {}
```

You can also use the `MongodbModule` to create a connection to MongoDB within a specific module.

```typescript
import { Module } from '@nestjs/common';
import { MongodbModule } from 'nestjs-mongodb-native';
import { UserService } from './user.service';

@Module({
  imports: [
    MongodbModule.forRoot({
      url: 'mongodb://localhost:27017/',
    }),
    MongodbModule.forFeature({
      collectionName: `users`,
      indexes: [[{ name: 1 }]],
    }),
    MongodbModule.forFeature({
      collectionName: `users`,
      dbName: `archive`,
      indexes: [[{ name: 1 }]],
    }),
  ],
  provides: [UserService],
})
export class UserModule {}
```

Once you have imported the `MongodbModule` into your application or module, you can inject the `MongodbService` to interact with the MongoDB database.

```typescript
import { Injectable } from '@nestjs/common';
import { InjectCollection } from 'nestjs-mongodb-native';

export interface TestUser {
  name: string;
}

@Injectable()
export class UserService {
  constructor(
    @InjectCollection(`users`)
    private readonly defaultCollection: Collection<TestUser>,
    @InjectCollection(`users`, `archive`)
    private readonly archiveCollection: Collection<TestUser>,
  ) {}

  async saveUser(user: TestUser, archive = true): Promise<void> {
    await this.defaultCollection.insertOne(user);
    if (archive) {
      await this.archiveCollection.insertOne(user);
    }
  }

  // Other database operations...
}
```

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request.

## License

This package is [MIT licensed](LICENSE)
