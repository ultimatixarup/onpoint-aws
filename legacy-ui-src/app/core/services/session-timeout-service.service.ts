import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class SessionTimeoutService {

  private timeoutDuration: number = 30 * 60 * 1000; // 3 minutes in milliseconds
  private timeoutId: any;

  constructor(private router: Router, private toastr: ToastrService, private ngZone: NgZone) {
    this.startWatching();
    this.resetTimer();
  }

  // Start tracking user activity
  private startWatching(): void {
    window.addEventListener('mousemove', this.resetTimer.bind(this));
    window.addEventListener('keypress', this.resetTimer.bind(this));
  }

  // Reset the timer when user activity is detected
  private resetTimer(): void {
    clearTimeout(this.timeoutId);

    this.ngZone.runOutsideAngular(() => {
      this.timeoutId = setTimeout(() => {
        this.logout();
      }, this.timeoutDuration);
    });
  }

  // Logout when the timeout is reached
  private logout(): void {
    // this.toastr.error("Session expired due to inactivity. Please log in again.");
    sessionStorage.clear(); // Clear session data
    this.router.navigate(['/auth/logout']); // Navigate to the login page or logout route
  }

  // Optional: Stop tracking user activity
  public stopWatching(): void {
    window.removeEventListener('mousemove', this.resetTimer.bind(this));
    window.removeEventListener('keypress', this.resetTimer.bind(this));
    clearTimeout(this.timeoutId);
  }
}
