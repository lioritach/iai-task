import { Injectable } from '@angular/core';

const STORAGE_KEY = 'myAdIds';

@Injectable({ providedIn: 'root' })
export class MyAdsService {
  // קורא את רשימת ה-id מהדפדפן
  private load(): string[] {
    const text = localStorage.getItem(STORAGE_KEY);
    if (!text) {
      return [];
    }
    try {
      return JSON.parse(text);
    } catch {
      return []; // אם התוכן פגום - מתחילים מחדש
    }
  }

  // שומר את הרשימה בדפדפן
  private save(ids: string[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }

  // האם המודעה הזו שלי?
  isMine(id: string): boolean {
    return this.load().includes(id);
  }

  // מוסיף מודעה לרשימה שלי (אחרי יצירה)
  add(id: string): void {
    const ids = this.load();
    if (!ids.includes(id)) {
      ids.push(id);
      this.save(ids);
    }
  }

  // מסיר מודעה מהרשימה שלי (אחרי מחיקה)
  remove(id: string): void {
    const ids = this.load().filter((x) => x !== id);
    this.save(ids);
  }
}