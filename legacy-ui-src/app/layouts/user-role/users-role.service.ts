import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment'
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsersRoleService {
  userRoleResourse: any = `${environment.url.BASE_URL}dash-view/role`
  userRole:any;
  mainUrl:any=environment.url.BASE_URL;

  constructor(private http: HttpClient) {}

  getUserRole(){
    this.userRole=sessionStorage.getItem('userlogin')
    let params = new HttpParams().set("role",this.userRole);
    return this.http.post(this.userRoleResourse , params);
  }
}

@Injectable({ providedIn: 'root' })
export class SharedService {
  private fleetId: number | null = null;

  setFleetId(id: number | null): void {
    this.fleetId = id;
  }

  getFleetId(): number | null {
    return this.fleetId;
  }
}


@Injectable({ providedIn: 'root' })
export class SidebarStateService {
  private collapsed = new BehaviorSubject<boolean>(false);
  isMenuCollapsed$ = this.collapsed.asObservable();

  toggleSidebar(): void {
    this.collapsed.next(!this.collapsed.value);
  }

  setCollapsed(value: boolean): void {
    this.collapsed.next(value);
  }

  get currentState(): boolean {
    return this.collapsed.value;
  }
}

@Injectable({ providedIn: 'root' })
export class TimezoneService {
  private timezoneKey = 'timezone';
  private timezoneSubject = new BehaviorSubject<string>(this.getSavedOrSystemTimezone());

  timezone$ = this.timezoneSubject.asObservable();

  private getSavedOrSystemTimezone(): string {
    const saved = localStorage.getItem(this.timezoneKey);
    return saved || Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  getTimezone(): string {
    return this.timezoneSubject.value;
  }

  setTimezone(tz: string): void {
    localStorage.setItem(this.timezoneKey, tz);
    this.timezoneSubject.next(tz);
  }
}
