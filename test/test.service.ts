import { Injectable } from '@nestjs/common';
import { Collection } from 'mongodb';
import { InjectCollection } from '../src';

export interface TestUser {
  name: string;
}

@Injectable()
export class TestService {
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
}
