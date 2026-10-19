import { Injectable } from '@angular/core';

const STORAGE_KEY = 'myAdIds';

@Injectable({ providedIn: 'root' })
export class MyAdsService {
  private load(): string[] {
    const text = localStorage.getItem(STORAGE_KEY);
    if (!text) {
      return [];
    }
    try {
      return JSON.parse(text);
    } catch {
      return [];
    }
  }

  private save(ids: string[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }
  
  isMine(id: string): boolean {
    return this.load().includes(id);
  }

  add(id: string): void {
    const ids = this.load();
    if (!ids.includes(id)) {
      ids.push(id);
      this.save(ids);
    }
  }
  
  remove(id: string): void {
    const ids = this.load().filter((x) => x !== id);
    this.save(ids);
  }
}