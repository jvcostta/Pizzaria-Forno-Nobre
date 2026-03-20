import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  pageTitle = input.required<string>();
  toggleSidebar = output<void>();
}
