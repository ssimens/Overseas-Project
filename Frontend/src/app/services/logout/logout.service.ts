import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})


// Usato per chiamate http
export class LogoutService {

  private apiUrl = 'http://localhost:3000/api/logout';

  constructor(private http: HttpClient) {}

  logout()
  {
    return this.http.post(this.apiUrl, {} );
  }
}