import { Component , OnInit, HostListener } from '@angular/core';
import { AuthenticationService } from './core/services/auth.service';
import { environment } from '../environments/environment';
import { SessionTimeoutService } from './core/services/session-timeout-service.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit  {

  constructor(private auth:AuthenticationService, private SessionTimeoutService: SessionTimeoutService){
    // if (environment.production) {
    //   this.disableInspectFeatures();
    // }
    // console.log(environment.production)
  }
  // disableInspectFeatures() {
  //   document.addEventListener('contextmenu', function(event) {
  //     event.preventDefault();
  //   });

  //   window.addEventListener('keydown', function(event) {
  //     if (event.key === 'F12' || (event.ctrlKey && event.shiftKey && event.key === 'I')) {
  //       event.preventDefault();
  //     }
  //   });
  // }
  ngOnInit() {
    if (environment.disableSourcesTab) {
      // Implement any custom logic or warnings
      console.warn('Source maps are disabled. Code visibility is restricted.');
    }
    // document.addEventListener('contextmenu', function(event) {
    //   console.log('Right-click detected');
    //   event.preventDefault();
    // });

    // window.addEventListener('keydown', function(event) {
    //   console.log('Key pressed:', event.key);
    //   if (event.key === 'F12' || (event.ctrlKey && event.shiftKey && event.key === 'I')) {
    //     event.preventDefault();
    //   }
    // });
  }
}
