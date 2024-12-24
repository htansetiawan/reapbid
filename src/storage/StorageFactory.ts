import { StorageAdapter } from './StorageAdapter';
import { FirebaseStorageAdapter } from './FirebaseStorageAdapter';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import { SessionStorageAdapter } from './SessionStorageAdapter';

export enum StorageType {
  Firebase = 'firebase',
  LocalStorage = 'localStorage',
  Session = 'session'
}

export class StorageFactory {
  private static instance: StorageAdapter | null = null;

  static getInstance(type: StorageType = StorageType.Firebase): StorageAdapter {
    if (!this.instance) {
      switch (type) {
        case StorageType.Firebase:
          this.instance = new FirebaseStorageAdapter();
          break;
        case StorageType.LocalStorage:
          this.instance = new LocalStorageAdapter();
          break;
        case StorageType.Session:
          this.instance = new SessionStorageAdapter();
          break;
        default:
          throw new Error(`Unsupported storage type: ${type}`);
      }
    }
    return this.instance as StorageAdapter;
  }

  static cleanup(): void {
    if (this.instance) {
      this.instance.cleanup();
      this.instance = null;
    }
  }
}
