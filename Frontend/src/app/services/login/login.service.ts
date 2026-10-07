import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Utente {
  id: number;
  name: string;
  surname: string;
  matr: number, 
  email: string;
  role: number;
  idprat: number;
  faculty: string;
}

export interface LoginResponse {
  token: string;
  user: Utente;
}

@Injectable({
  providedIn: 'root'
})

// Usato per chiamate http
export class LoginService {

  private apiUrl = 'http://localhost:3000/api/login';

  constructor(private http: HttpClient) {}

  checkLogin(email: string, password: string): Observable<LoginResponse>
  {
  return this.http.post<LoginResponse>(
    this.apiUrl,
    {
      email: email,
      password: password
    }
  );
}
}

