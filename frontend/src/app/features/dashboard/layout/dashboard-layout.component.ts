import { Component, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { inject } from '@angular/core';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/clientes': 'Clientes',
  '/dashboard/sabores': 'Sabores',
  '/dashboard/pedidos': 'Pedidos',
};

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterOutlet, SidebarComponent, NavbarComponent],
  templateUrl: './dashboard-layout.component.html',
})
export class DashboardLayoutComponent {
  private readonly router = inject(Router);

  sidebarOpen = signal(true);

  pageTitle = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => PAGE_TITLES[(e as NavigationEnd).urlAfterRedirects] ?? 'Dashboard')
    ),
    { initialValue: PAGE_TITLES[this.router.url] ?? 'Dashboard' }
  );

  toggleSidebar() {
    this.sidebarOpen.update((v) => !v);
  }
}
