import { Component, ElementRef, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-template-portal',
  templateUrl: './template-portal.component.html',
  styleUrls: ['./template-portal.component.scss']
})
export class TemplatePortalComponent implements OnInit, AfterViewInit {
  @ViewChild('iframeRef') iframeRef!: ElementRef<HTMLIFrameElement>;
  isSidebarHidden = false;
  url: any;
  token: string;
  tripId: any;

  constructor(
    public router: Router,
    public http: HttpClient,
    private handler: HttpBackend,
    private sanitizer: DomSanitizer,
    private activatedRoute:ActivatedRoute
  ) {
    this.getParams()
  }

  ngOnInit(): void {

  }

  getParams() {
    this.activatedRoute.queryParams.subscribe((param:any)=>{
        if(param.tripId) {
        this.tripId = param.tripId
        }
      this.getUrl()
    })
  }


  getUrl() {
    const tokenData = sessionStorage.getItem('access-token');
    this.token = JSON.parse(tokenData);
    const timestamp = new Date().getTime()
    let rawUrl:any;
    if(this.tripId) {
      rawUrl  = `https://dashcam.fleettrack.ai/sso?access_token=${this.token}&redirect_path=request-video?tripId=${this.tripId}`;
    } else {
       rawUrl = `https://dashcam.fleettrack.ai/sso?access_token=${this.token}&redirect_path=video-requests&_=${timestamp}`;
    }

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
