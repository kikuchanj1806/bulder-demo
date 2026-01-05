import {DEFAULT_CURRENCY_CODE, LOCALE_ID, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppComponent} from "./app.component";
import {HttpClientModule} from "@angular/common/http";
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {AppRouting} from './app.routing';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRouting
  ],
  providers: [
    {provide: LOCALE_ID, useValue: 'vi-VN'},
    {provide: DEFAULT_CURRENCY_CODE, useValue: 'VND'},
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
