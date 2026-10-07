import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LogoutService } from '../../../services/logout/logout.service';
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styles: [`
    :host {
      display: block;
      width: 100%;
      margin: 0;
      padding: 0;
    }
    .header-box {
      background-color: #473378;
      color: white;
      padding: 16px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      box-sizing: border-box;
      min-height: 60px;
    }
    .header-titolo {
      font-weight: 700;
      font-size: 1.2rem;
    }
    .header-profilo {
      position: relative;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .testo-utente {
      color: rgba(255, 255, 255, 0.95);
      font-size: 15px;
      font-weight: 500;
    }
    .btn-avatar {
      background: transparent;
      border: 2px solid rgba(255, 255, 255, 0.5);
      border-radius: 50%;
      width: 38px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: white;
    }
    .dropdown-menu {
      position: absolute;
      top: 48px;
      right: 0;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
      min-width: 120px;
      z-index: 1000;
      overflow: hidden;
    }
    .item-logout {
      display: block;
      padding: 10px 16px;
      color: #ef4444;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
    }
    .item-logout:hover {
      background-color: #f3f4f6;
    }
  `]
})

export class HeaderComponent implements OnInit {

  user: any = null;
  dropdownOpen: boolean = false;

  constructor(private router: Router, private logoutService: LogoutService) {}

  ngOnInit(): void {
    this.user = JSON.parse(sessionStorage.getItem("user") || "{}");
  }

  // Apre / chiude il menu a tendina dell'utente
  menuDropDown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  // Gestisce il logout dell'utente
  logout(): void {
    this.logoutService.logout().subscribe({
      next: () => {
        this.router.navigate(["/login"]);
      },
      error: () => {

      }
    })
    
  }
}