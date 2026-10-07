import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  scheduledPeriod: string;
  learningagreement: string;
  transcriptsofrecords: string;
  refusalMotivation: string | null;
  confirmedMobility: Boolean;
  approvedmodifies: Boolean | null;
  statusla: Boolean;
  modifiedla:Boolean;
  arriveDate: Date | null;
  departureDate: Date | null;
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
  examDate: Date;
  idApplication: number;
  approved: boolean | null;
}

export interface Decision {
    caFoscariCourseCode: string;
    foreignCourseCode: string;
    decision: number;
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

  updateLaStatus(idApplication: number, action: 'accept' | 'reject', motivation: string = '', state: string): Observable<any> {
    console.log("sono qui:"+state);
    return this.http.put(`${this.apiUrl}/${idApplication}/la-decision`, {
      action,
      motivation,
      state
    });
  }

  downloadLearningAgreement(idApplication: number) {

    return this.http.get(
      `${this.apiUrl}/download/${idApplication}/learningagreement`,
      {
          responseType: 'blob'
      }
    )
  }

  downloadTranscpriptsOfRecords(idApplication: number) {

    return this.http.get(
      `${this.apiUrl}/download/${idApplication}/transcriptsofrecords`,
      {
          responseType: 'blob'
      }
    )
  }

  sendDecisions(idApplication: number, data: Decision[])
  {
    return this.http.post(`${this.apiUrl}/${idApplication}/evalutations/setdecisions`, {
        data
      });
  }
}