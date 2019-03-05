import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatboxComponent } from './chatbox/chatbox.component';

// importing route module
import { RouterModule, Routes } from '@angular/router';
import { ToastrModule } from 'ng6-toastr-notifications';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SharedModule } from '../shared/shared.module';
import { UserDetailsComponent } from '../shared/user-details/user-details.component';
import { RemoveSpecialCharPipe } from './../shared/pipe/removed-special-char.pipe';
import { ChatRouteGuardService } from './chat-route-guard.service';


@NgModule({
  imports: [
    CommonModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot(),
    RouterModule.forChild([
      { path:'chat', component: ChatboxComponent,canActivate:[ChatRouteGuardService]}
    ]),
    SharedModule
  ],
  declarations: [ChatboxComponent, RemoveSpecialCharPipe],
  providers:[ChatRouteGuardService]
})
export class ChatModule { }
