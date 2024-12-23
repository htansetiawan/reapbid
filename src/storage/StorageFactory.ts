import { StorageAdapter } from './StorageAdapter';
import { FirebaseStorageAdapter } from './FirebaseStorageAdapter';
import { LocalStorageAdapter } from './LocalStorageAdapter';

export enum StorageType {
  Firebase = 'firebase',
  LocalStorage = 'localStorage'
}

export class StorageFactory {
  private static instance: StorageAdapter | null = null;

  static getStorage(type: StorageType = StorageType.Firebase): StorageAdapter {
    if (!this.instance) {
      switch (type) {
        case StorageType.Firebase:
          this.instance = new FirebaseStorageAdapter();
          break;
        case StorageType.LocalStorage:
          this.instance = new LocalStorageAdapter();
          break;
        default:
          throw new Error(`Unsupported storage type: ${type}`);
      }
    }
    return this.instance;
  }

  static cleanup(): void {
    if (this.instance) {
      this.instance.cleanup();
      this.instance = null;
    }
  }
}
