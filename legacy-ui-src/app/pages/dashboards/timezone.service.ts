import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TimezoneService {
  private API_KEY = environment.googleMapApiKey;

  constructor(private http: HttpClient, private ngZone: NgZone) {}

  /**
   * Fetches the local time based on latitude, longitude, and UTC datetime.
   * @param lat - Latitude
   * @param lng - Longitude
   * @param utcDateTime - UTC time string (ISO format)
   * @returns Observable<string> - Formatted local time
   */
 private geocodeUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
  getLocalTimeFromUTC(lat: number, lng: number, utcDateTime: string): Observable<string> {
    // Return fallback if coordinates are invalid
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      console.warn('Invalid coordinates provided for timezone lookup');
      return of(utcDateTime); // Return original UTC time
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const url = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${timestamp}&key=${this.API_KEY}`;

    return this.http.get<any>(url).pipe(
      map((response) => {
        if (response.status === 'OK') {
          return this.convertToLocalTime(utcDateTime, response);
        } else {
          console.warn('Timezone API returned non-OK status:', response.status, response.errorMessage || 'No error message');
          // Return formatted UTC time as fallback
          return this.formatUTCFallback(utcDateTime);
        }
      }),
      catchError((error) => {
        console.warn('Error fetching timezone (returning UTC time):', error.message || error);
        // Return formatted UTC time as fallback instead of error message
        return of(this.formatUTCFallback(utcDateTime));
      })
    );
  }

  /**
   * Formats UTC datetime as a fallback when timezone lookup fails
   * @param utcDateTime - UTC time string (ISO format)
   * @returns string - Formatted UTC time
   */
  private formatUTCFallback(utcDateTime: string): string {
    try {
      const date = new Date(utcDateTime);
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC'
      };
      const formattedDate = date.toLocaleString('en-US', options);
      return `${formattedDate} (UTC)`;
    } catch (e) {
      return utcDateTime; // Return raw string if formatting fails
    }
  }


  /**
   * Converts UTC datetime to local time using timezone data.
   * @param utcDateTime - UTC time string (ISO format)
   * @param timezoneData - Timezone data from API
   * @returns string - Formatted local time: "Feb 11, 2025, 7:44 AM (PST)"
   */
  private convertToLocalTime(utcDateTime: string, timezoneData: any): string {
    const utcTimestamp = new Date(utcDateTime).getTime();
    const totalOffsetMs = (timezoneData.rawOffset + timezoneData.dstOffset) * 1000;
    const localTimestamp = utcTimestamp + totalOffsetMs;
    const localTime = new Date(localTimestamp);

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };

    // Format the date as "Feb 11, 2025, 7:44 AM"
    const formattedDate = localTime.toLocaleString('en-US', options);

    // Get the timezone abbreviation (e.g., PST)
    const timeZoneAbbreviation = this.getTimeZoneAbbreviation(timezoneData.timeZoneName);

    return `${formattedDate} (${timeZoneAbbreviation})`;
  }

  /**
   * Converts full timezone name to an abbreviation.
   * @param timezoneName - Timezone full name (e.g., "Pacific Standard Time")
   * @returns string - Abbreviation (e.g., "PST")
   */
  private getTimeZoneAbbreviation(timezoneName: string): string {
    const abbreviations: { [key: string]: string } = {
      'Pacific Standard Time': 'PST',
      'Pacific Daylight Time': 'PDT',
      'Eastern Standard Time': 'EST',
      'Eastern Daylight Time': 'EDT',
      'Central Standard Time': 'CST',
      'Central Daylight Time': 'CDT',
      'Mountain Standard Time': 'MST',
      'Mountain Daylight Time': 'MDT',
      'Greenwich Mean Time': 'GMT',
      'Indian Standard Time': 'IST',
      'Coordinated Universal Time': 'UTC'
    };

    return abbreviations[timezoneName] || timezoneName;
  }
 // 🔁 Reverse Geocoding: Lat/Lng → Address
 getAddressFromLatLng(lat: number, lng: number): Observable<string | null> {
  const url = `${this.geocodeUrl}?latlng=${lat},${lng} &key=${this.API_KEY}`;
  return this.http.get<any>(url).pipe(
    map(response => {
      if (response.status === 'OK' && response.results.length > 0) {
        return response.results[0].formatted_address;
      } else {
        return null;
      }
    })
  );
}

// 🔁 Forward Geocoding: Address → Lat/Lng
getLatLngFromAddress(address: string): Observable<{ lat: number, lng: number } | null> {
  const encodedAddress = encodeURIComponent(address);
  const url = `${this.geocodeUrl}?address=${encodedAddress}&key=${this.API_KEY}`;
  return this.http.get<any>(url).pipe(
    map(response => {
      if (response.status === 'OK' && response.results.length > 0) {
        const location = response.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng
        };
      } else {
        return null;
      }
    })
  );
}
}
