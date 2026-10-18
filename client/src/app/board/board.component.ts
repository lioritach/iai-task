import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdsService } from '../services/ads.service';
import { MyAdsService } from '../services/my-ads.service';
import { Ad } from '../models/ad.model';
import { AdFormComponent } from '../ad-form/ad-form.component';
import { ToastService } from '../services/toast.service';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { MESSAGES } from '../constants/messages';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, FormsModule, AdFormComponent, ConfirmDialog],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss'
})
export class BoardComponent implements OnInit {
  readonly msg = MESSAGES;
  ads: Ad[] = [];
  categories: string[] = [];
  searchText = '';
  selectedCategory = '';
  nearMe = false;
  userLat: number | null = null;
  userLng: number | null = null;
  locationError = '';
  loading = false;
  errorMessage = '';

  // מצב הטופס
  showForm = false;
  editingAd: Ad | null = null; // null = יצירה, ad = עריכה

  constructor(
    private adsService: AdsService,
    private myAdsService: MyAdsService,
    private toast: ToastService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit() {
    this.loadCategories();
    this.loadAds();
  }

  loadCategories() {
    this.adsService.getCategories().subscribe({
      next: (cats) => { this.categories = cats; }
    });
  }

  loadAds() {
    this.loading = true;
    this.errorMessage = '';

    const lat = this.nearMe && this.userLat !== null ? this.userLat : undefined;
    const lng = this.nearMe && this.userLng !== null ? this.userLng : undefined;

    this.adsService.getAds(this.searchText, this.selectedCategory, lat, lng).subscribe({
      next: (ads) => {
        this.ads = ads;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Could not load ads. Is the server running?';
        this.loading = false;
      }
    });
  }

  onSearch() { this.loadAds(); }
  onCategoryChange() { this.loadAds(); }

  isMine(ad: Ad): boolean {
    return this.myAdsService.isMine(ad.id);
  }

  // פתיחת טופס יצירה
  openNewForm() {
    this.editingAd = null;
    this.showForm = true;
  }

  // פתיחת טופס עריכה
  openEditForm(ad: Ad) {
    this.editingAd = ad;
    this.showForm = true;
  }

  // סגירת הטופס — saved=true אם הייתה שמירה
  onFormClosed(saved: boolean) {
    this.showForm = false;
    this.editingAd = null;
    if (saved) {
      this.loadAds(); // טוענים מחדש כדי לראות את השינויים
    }
  }

  toggleNearMe() {
    if (this.nearMe) {
      this.nearMe = false;
      this.userLat = null;
      this.userLng = null;
      this.locationError = '';
      this.loadAds();
      return;
    }

    if (!navigator.geolocation) {
      this.locationError = 'Geolocation not supported';
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.userLat = position.coords.latitude;
        this.userLng = position.coords.longitude;
        this.nearMe = true;
        this.locationError = '';
        this.loadAds();
      },
      () => {
        this.locationError = 'Could not get location';
      }
    );
  }

  // מחיקת מודעה
  deleteAd(ad: Ad) {
    this.confirmationService.confirm({
      message: 'האם אתה בטוח שברצונך למחוק את המודעה?',
      header: 'מחיקת מודעה',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'כן',
      rejectLabel: 'לא',
      accept: () => {
        this.adsService.deleteAd(ad.id).subscribe({
          next: () => {
            this.myAdsService.remove(ad.id);
            this.toast.success('המודעה נמחקה בהצלחה');
            this.loadAds();
          },
          error: () => {
            this.toast.error('המחיקה נכשלה. נסה שוב.');
          }
        });
      }
    });
  }
}