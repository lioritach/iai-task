import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ad, AdInput } from '../models/ad.model';

// כתובת השרת שבנינו
const API_URL = 'http://localhost:3000/api';

// השירות הזה מדבר עם ה-REST API. כל פונקציה מתאימה לנתיב אחד בשרת.
@Injectable({ providedIn: 'root' })
export class AdsService {
  constructor(private http: HttpClient) { }


  getAds(search: string, category: string, lat?: number, lng?: number, radius?: number): Observable<Ad[]> {
    let params = new HttpParams();
    if (search) { 
      params = params.set('q', search); 
    }
    if (category) { 
      params = params.set('category', category); 
    }
    if (lat !== undefined && lng !== undefined) {
      params = params.set('lat', lat.toString());
      params = params.set('lng', lng.toString());
      params = params.set('radius', (radius ?? 10).toString());
    }
    return this.http.get<Ad[]>(`${API_URL}/ads`, { params });
  }

  // GET /api/ads/:id
  getAd(id: string): Observable<Ad> {
    return this.http.get<Ad>(API_URL + '/ads/' + id);
  }

  // POST /api/ads
  createAd(ad: AdInput): Observable<Ad> {
    return this.http.post<Ad>(API_URL + '/ads', ad);
  }

  // PUT /api/ads/:id
  updateAd(id: string, ad: AdInput): Observable<Ad> {
    return this.http.put<Ad>(API_URL + '/ads/' + id, ad);
  }

  // DELETE /api/ads/:id
  deleteAd(id: string): Observable<void> {
    return this.http.delete<void>(API_URL + '/ads/' + id);
  }

  // GET /api/categories
  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(API_URL + '/categories');
  }
}