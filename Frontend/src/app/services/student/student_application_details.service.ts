import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApplicationDetails {
  id: number;
  year: Date;
  idUni: number;
  hostUni: string;
  hostUniCity: string;
  hostUniCountry: string;
  professorName: string;
  professorSurname: string;
  professorEmail: string;
  studentNotes: string;
  scheduledPeriod: string;
  learningagreement: string;
  transcriptsofrecords: string;
  refusalMotivation: Boolean;
  confirmedMobility: Boolean;
  statusla: Boolean | null;
  modifiedla: Boolean | null;
  approvedmodifies: Boolean | null;
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
  approved: Boolean | null;
  examVote: number;
  examDate: string;
  idApplication: number;
}

// Usato per indicare il tipo di parametro
type ExamValue = {
  vote: number | null;
  decision: boolean | null;
  date: string | null;
};

// Usato per indicare il tipo di parametro
type ExamValues = {
  [exam: string]: ExamValue;
};

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

  uploadLearningAgreement(idApplication: number, learningagreement: File, alreadyUploaded: boolean)
  {
    const formData = new FormData();
    const applicationStatus = 'In attesa di approvazione del Learning Agreement';
  
    formData.append('uploaded_file', learningagreement);

    if(alreadyUploaded) 
    {
      formData.append('applicationStatus', applicationStatus);
      return this.http.put(`${this.apiUrl}/${idApplication}/uploadlearningagreement`, formData);
    }
    else
    {
      return this.http.post(`${this.apiUrl}/${idApplication}/uploadlearningagreement`,formData);
    }
  }

  uploadTranscriptsOfRecords(idApplication: number, transcriptsofrecords: File)
  {
    const formData = new FormData();
    formData.append('uploaded_file', transcriptsofrecords);

    return this.http.post(
      `${this.apiUrl}/${idApplication}/uploadtranscriptsofrecords`,
      formData
    );
  }

  downloadLearningAgreement(idApplication: number) 
  {
    return this.http.get(`${this.apiUrl}/download/${idApplication}/learningagreement`,
    {
          responseType: 'blob'
    });
  }
  
  downloadTranscpriptsOfRecords(idApplication: number) 
  {
    return this.http.get(`${this.apiUrl}/download/${idApplication}/transcriptsofrecords`,
    {
          responseType: 'blob'
    });
  }
  confirmMobilityPhase(idApplication: number)
  {
    
    return this.http.put(`${this.apiUrl}/${idApplication}/confirmmobilityphase`, {})
  }

  sendArriveDate(idApplication: number, arriveDate: string)
  {
    return this.http.put(`${this.apiUrl}/${idApplication}/uploadarrivedate`,
    {
      arriveDate: arriveDate
    });
  }

  sendDepartureDate(idApplication: number, departureDate: string)
  {
    return this.http.put(`${this.apiUrl}/${idApplication}/uploaddeparturedate`,
    {
      departureDate: departureDate
    });
  }

  sendExamValues(idApplication:number, examValues: ExamValues)
  {
    return this.http.put(`${this.apiUrl}/${idApplication}/setmapping/votes`,
    {
      examValues: examValues
    });
  }
}