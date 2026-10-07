import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Application {
  id: number;
  year: Date;
  hostUni: string;
  hostUniCity: string;
  hostUniCountry: string;
  professorName: string;
  professorSurname: string;
  professorEmail: string;
  state: 'Creata' | 'In attesa di approvazione del Learning Agreement ' | 'In attesa conferma pre-partenza' | 'Pre-partenza completata' | 'Mobilità in corso' | 'In riconoscimento esami' | 'In attesa conferma Ufficio Overseas' | 'Chiusa';
}

export interface StudentHomeSummary {
  totalsApplications: number;
  inProgressApplications: number;
  evaluationApplications: number;
  closedApplications: number;
}

@Injectable({
  providedIn: 'root'
})

export class ApplicationsService {
  private apiUrl = "http://localhost:3000/api/homestudent";

  constructor(private http: HttpClient) {}

  // Recupero i contatori dei 3 stati delle pratiche
  getStudentHome(): Observable<StudentHomeSummary> {
    return this.http.get<StudentHomeSummary>(`${this.apiUrl}/homesummary`);
  }

  // Recupero l'elenco pratiche specifico per quelo studente
  getStudentApplications(): Observable<Application[]> {
    return this.http.get<Application[]>(`${this.apiUrl}/applications`);
  }
}