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
  studentName: string;
  studentSurname: string;
  studentEmail: string;
  state: 'Creata' | 'In attesa di approvazione del Learning Agreement ' | 'In attesa conferma pre-partenza' | 'Pre-partenza completata' | 'Mobilità in corso' | 'In riconoscimento esami' | 'In attesa conferma Ufficio Overseas' | 'Chiusa';
}

export interface OfficeHomeSummary {
  totalsApplications: number;
  inProgressApplications: number;
  actionRequiredApplications: number;
  closedApplications: number;
}

@Injectable({
  providedIn: 'root'
})

export class ApplicationsService {
    private apiUrl = "http://localhost:3000/api/homeoffice";

    constructor(private http: HttpClient) {}

// Recupero i contatori dei 3 stati delle pratiche
getOfficeHome(): Observable<OfficeHomeSummary> {
    return this.http.get<OfficeHomeSummary>(`${this.apiUrl}/homesummary`);
  }

// Recupero l'elenco pratiche specifico per cui quello specifico docente e referente
getOfficeApplications(): Observable<Application[]> {
    return this.http.get<Application[]>(`${this.apiUrl}/applications`);
  }
}