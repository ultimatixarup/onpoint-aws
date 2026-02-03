import { Pipe, PipeTransform, ChangeDetectorRef, OnDestroy } from '@angular/core';
// import moment from 'moment';
// import 'moment-timezone';
import moment from 'moment-timezone';
import { Subscription } from 'rxjs';
import { TimezoneService } from 'src/app/layouts/user-role/users-role.service';

const DEFAULT_TIMEZONE = 'UTC';

@Pipe({ name: 'timeAgo', pure: false })
export class TimeAgoPipe implements PipeTransform, OnDestroy {
  private timezone = DEFAULT_TIMEZONE;
  private subs: Subscription;
  private lastValue: string | null = null;
  private lastResult: string = '';

  constructor(
    private cdr: ChangeDetectorRef,
    private timezoneService: TimezoneService
  ) {
    // only listen to timezone changes
    this.subs = this.timezoneService.timezone$.subscribe((tz) => {
      this.timezone = tz || DEFAULT_TIMEZONE;
      this.recalculate(); // update cached result
      this.cdr.markForCheck();
    });
  }

  transform(timestamp: string): string {
    if (!timestamp) return '--';

    if (timestamp !== this.lastValue) {
      this.lastValue = timestamp;
      this.lastResult = this.formatTime(timestamp, this.timezone);
    }
    return this.lastResult;
  }

  private recalculate() {
    if (this.lastValue) {
      this.lastResult = this.formatTime(this.lastValue, this.timezone);
    }
  }

  // console.log("Alert Time (parsed):", alertTime.format()); // Check if parsing is correct
  // console.log("Current Time (now):", now.format());
  // console.log("Difference (hours):", moment.duration(now.diff(alertTime)).asHours());
  // console.log(userTimezone,'da')
  private formatTime(alertTimeStamp: string, userTimezone: string): string {
      const alertTime = moment.tz(`${alertTimeStamp}`, 'YYYY-MM-DD HH:mm:ss', userTimezone);
    const now = moment().tz(userTimezone);
    const duration = moment.duration(now.diff(alertTime));
    // console.log("Alert Time (parsed):", alertTime.format(),alertTimeStamp); // Check if parsing is correct
    // console.log("Current Time (now):", now.format());
    // console.log("Difference (hours):", moment.duration(now.diff(alertTime)).asHours());
    // console.log(userTimezone,'da')
    if (duration.asHours() >= 1) {
        return `${Math.floor(duration.asHours())}h ${duration.minutes()}m ago`;
    } else if (duration.asMinutes() >= 1) {
        return `${duration.minutes()}m ${duration.seconds()}s ago`;
    } else {
        return `${duration.seconds()}s ago`;
    }
}


  ngOnDestroy() {
    this.subs?.unsubscribe();
  }
}
