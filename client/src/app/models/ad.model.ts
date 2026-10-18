// מיקום של מודעה (לא חובה)
export interface AdLocation {
  lat: number;
  lng: number;
  address: string;
}

// מודעה כפי שהיא חוזרת מהשרת
export interface Ad {
  id: string;
  title: string;
  description: string;
  category: string;
  contact: string;
  location: AdLocation | null;
  createdAt: string;
  updatedAt: string;
}

// הנתונים שהלקוח שולח ביצירה ובעריכה (בלי id ותאריכים - השרת יוצר אותם)
export interface AdInput {
  title: string;
  description: string;
  category: string;
  contact: string;
  location: AdLocation | null;
}