
// timer.service.ts
import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, interval } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TimerServiceService {
  private _tick$ = new BehaviorSubject<number>(0);
  tick$ = this._tick$.asObservable();

  constructor(private ngZone: NgZone) {
    this.ngZone.runOutsideAngular(() => {
      interval(1000).subscribe(() => {
        this.ngZone.run(() => this._tick$.next(Date.now()));
      });
    });
  }
}
