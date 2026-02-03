import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { AuthenticationService } from './services/auth.service';
import { AutocompleteOffDirective } from './directives/autocomplete-off.directive';

@NgModule({
  declarations: [

    AutocompleteOffDirective
  ],
  imports: [
    CommonModule,
    HttpClientModule
  ],
  exports:[],
  providers: [
    AuthenticationService,

  ],
})
export class CoreModule { }
