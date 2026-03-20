import { Component, inject, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  private readonly authService = inject(AuthService);

  closeSidebar = output<void>();

  navItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
    { label: 'Clientes', route: '/dashboard/clientes', icon: 'people' },
    { label: 'Sabores', route: '/dashboard/sabores', icon: 'local_pizza' },
    { label: 'Pedidos', route: '/dashboard/pedidos', icon: 'receipt_long' },
  ];

  logout() {
    this.authService.logout();
  }
}
