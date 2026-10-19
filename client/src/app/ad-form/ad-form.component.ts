import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdsService } from '../services/ads.service';
import { MyAdsService } from '../services/my-ads.service';
import { Ad, AdInput } from '../models/ad.model';
import { MESSAGES } from '../constants/messages';

@Component({
  selector: 'app-ad-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ad-form.component.html',
  styleUrl: './ad-form.component.scss'
})
export class AdFormComponent implements OnInit {
  // אם מועבר ad — זו עריכה. אם null — זו יצירה.
  @Input() ad: Ad | null = null;

  // אירוע שה-component ההורה יאזין לו
  @Output() closed = new EventEmitter<boolean>(); // true = הייתה שמירה

  categories: string[] = [];
  saving = false;
  errorMessage = '';

  // ערכי הטופס
  title = '';
  description = '';
  category = '';
  contact = '';
  locationAddress = '';
  locationLat: number | null = null;
  locationLng: number | null = null;
  gettingLocation = false;
  locationError = '';

  constructor(
    private adsService: AdsService,
    private myAdsService: MyAdsService
  ) { }

  readonly msg = MESSAGES;

  ngOnInit() {
    // if there is and ad, its for update
    if (this.ad) {
      this.title = this.ad.title;
      this.description = this.ad.description;
      this.category = this.ad.category;
      this.contact = this.ad.contact;
      if (this.ad.location) {
        this.locationLat = this.ad.location.lat;
        this.locationLng = this.ad.location.lng;
        this.locationAddress = this.ad.location.address;
      }
    }

    this.adsService.getCategories().subscribe({
      next: (cats) => { this.categories = cats; }
    });
  }

  getMyLocation() {
    if (!navigator.geolocation) {
      this.locationError = 'Geolocation is not supported by your browser';
      return;
    }
    this.gettingLocation = true;
    this.locationError = '';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.locationLat = position.coords.latitude;
        this.locationLng = position.coords.longitude;
        this.gettingLocation = false;

        if (!this.locationAddress) {
          this.locationAddress = this.locationLat.toFixed(4) + ', ' + this.locationLng.toFixed(4);
        }
      },
      () => {
        this.locationError = 'Could not get location. Please allow location access.';
        this.gettingLocation = false;
      }
    );
  }

  onSubmit() {
    this.errorMessage = '';
 
    if (this.title.trim().length < 2) {
      this.errorMessage = 'Title must be at least 2 characters';
      return;
    }
    if (this.description.trim().length < 1) {
      this.errorMessage = 'Description is required';
      return;
    }
    if (!this.category) {
      this.errorMessage = 'Please select a category';
      return;
    }

    const adInput: AdInput = {
      title: this.title.trim(),
      description: this.description.trim(),
      category: this.category,
      contact: this.contact.trim(),
      location: (this.locationLat !== null && this.locationLng !== null)
        ? { lat: this.locationLat, lng: this.locationLng, address: this.locationAddress.trim() }
        : null
    };

    this.saving = true;

    if (this.ad) {
      // Edit
      this.adsService.updateAd(this.ad.id, adInput).subscribe({
        next: () => {
          this.saving = false;
          this.closed.emit(true); 
        },
        error: (err) => {
          this.saving = false;
          this.errorMessage = err?.error?.error || 'Save failed';
        }
      });
    } else {
      // Create
      this.adsService.createAd(adInput).subscribe({
        next: (newAd) => {
          this.myAdsService.add(newAd.id); // Save in localstorage
          this.saving = false;
          this.closed.emit(true);
        },
        error: (err) => {
          this.saving = false;
          this.errorMessage = err?.error?.error || 'Save failed';
        }
      });
    }
  }

  onCancel() {
    this.closed.emit(false); // סגור בלי שמירה
  }
}