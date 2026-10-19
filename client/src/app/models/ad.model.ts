
export interface AdLocation {
  lat: number;
  lng: number;
  address: string;
}


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


export interface AdInput {
  title: string;
  description: string;
  category: string;
  contact: string;
  location: AdLocation | null;
}