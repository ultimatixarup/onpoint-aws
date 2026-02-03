import { Component, ElementRef, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss']
})
export class ConfigurationComponent implements OnInit {
  @ViewChild('iframeRef') iframeRef!: ElementRef<HTMLIFrameElement>;
  isSidebarHidden = false;
  url: any;
  token: string;

  constructor(
    public router: Router,
    public http: HttpClient,
    private handler: HttpBackend,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    const tokenData = sessionStorage.getItem('access-token');
    this.token = JSON.parse(tokenData);
    const timestamp = new Date().getTime()
    const rawUrl = `https://dashcam.fleettrack.ai/sso?access_token=${this.token}&redirect_path=configurations&_=${timestamp}`;
    this.url = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
  }

  ngAfterViewInit(): void {
    // Wait for iframe to load before posting message
    if (this.iframeRef?.nativeElement) {
      this.iframeRef.nativeElement.addEventListener('load', () => {
        const iframeWindow = this.iframeRef.nativeElement.contentWindow;
        if (iframeWindow) {
          iframeWindow.postMessage({
            eventType: 'toggleSidenav',
            show: false
          }, '*');
        }
      });
    }
  }

  toggleSidebar() {
    this.isSidebarHidden = !this.isSidebarHidden;
    setTimeout(() => {
      window.dispatchEvent(new Event("resize")); // Forces chart to adjust width
    },10);
    // this.updateDasboard()
  }
}
