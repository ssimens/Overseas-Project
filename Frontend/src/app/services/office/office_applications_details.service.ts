import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { form } from '@angular/forms/signals';

export interface ApplicationDetails {
  id: number;
  year: Date;
  hostUni: string;
  hostUniCity: string;
  hostUniCountry: string;
  studentName: string;
  studentSurname: string;
  studentEmail: string;
  studentNotes: string;
  professorName: string;
  professorSurname: string;
  professorEmail: string;
  scheduledPeriod: string;
  learningagreement: string;
  transcriptsofrecords: string;
  refusalMotivation: string | null;
  confirmedMobility: Boolean;
  approvedmodifies: Boolean | null;
  statusla: Boolean;
  modifiedla:Boolean;
  arriveDate: Date;
  departureDate: Date
  state: 'Creata' | 'In attesa di approvazione del Learning Agreement' | 'In attesa conferma pre-partenza' | 'Pre-partenza completata' | 'Mobilità in corso' | 'In riconoscimento esami' | 'In attesa conferma Ufficio Overseas' | 'Chiusa';
}

export interface ExamsMapping {
  foreignCourseCode: string;
  foreignCourseTitle: string;
  foreignCourseCFU: number;
  caFoscariCourseCode: string;
  caFoscariCourseTitle: string;
  caFoscariCourseCFU: number;
  examVote: number;
  examDate: string;
  idApplication: number;
  approved: boolean | null;
}

@Injectable({
  providedIn: 'root'
})

export class ApplicationDetailsService {

  private apiUrl = 'http://localhost:3000/api/applications';

  constructor(private http: HttpClient) {}

  getApplicationInfo(idApplication: number): Observable<ApplicationDetails>
  {
    return this.http.get<ApplicationDetails>(`${this.apiUrl}/${idApplication}/basicinfo`);
  }

  getApplicationExamsMapping(idApplication: number): Observable<ExamsMapping[]>
  {
    return this.http.get<ExamsMapping[]>(`${this.apiUrl}/${idApplication}/mapping`);
  }

  uploadLearningAgreement(idApplication: number, learningagreement: File)
  {
    const formData = new FormData();
  
    formData.append('uploaded_file', learningagreement);

    return this.http.put(
      `${this.apiUrl}/${idApplication}/uploadlearningagreement`,
      formData
    );
  }

  updateApplicationStatusByOffice(idApplication: number, action: 'Pre-Departure phase completed' | 'Application closed'): Observable<any>
  {
    return this.http.put(`${this.apiUrl}/${idApplication}/confirm-phase`, {
      action,
    });
  }

  downloadTranscpriptsOfRecords(idApplication: number) {

    return this.http.get(
      `${this.apiUrl}/download/${idApplication}/transcriptsofrecords`,
      {
          responseType: 'blob'
      }
    )
  }

  downloadLearningAgreement(idApplication: number) {

    return this.http.get(
      `${this.apiUrl}/download/${idApplication}/learningagreement`,
      {
          responseType: 'blob'
      }
    )
  }
}