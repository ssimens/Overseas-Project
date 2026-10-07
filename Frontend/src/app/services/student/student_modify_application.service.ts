import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ModifyApplicationFormData {
  university: { iduni: number; name: string }[];
  professors: { idutente: number; name: string; surname: string }[];
  foreignCourses: { code: string; name: string; cfu: number }[];
  caFoscariCourses: { code: string; name: string; cfu: number }[];
}

interface ExamsMapping {
  foreignCourseCode: string;
  foreignCourseTitle: string;
  foreignCourseCFU: number;
  caFoscariCourseCode: string;
  caFoscariCourseTitle: string;
  caFoscariCourseCFU: number;
}

export interface ModifyApplicationRequest {
  accademicYear: string;
  expectedPeriod: string;
  iduni: number | null;
  iddoc: number | null;
  studentNotes: string;
  mapping: ExamsMapping[];
}

@Injectable({
  providedIn: 'root'
})

export class ModifyApplicationService {
  private apiUrl = "http://localhost:3000/api/applications";
  private apisUrl = "http://localhost:3000/api/applications";
  private apiformUrl = "http://localhost:3000/api/homestudent/newapplication";

  constructor(private http: HttpClient) {}

  getFormData(): Observable<ModifyApplicationFormData> {
    return this.http.get<ModifyApplicationFormData>(`${this.apiformUrl}/formdata`);
  }

  getApplicationDetails(idApplication: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${idApplication}/previousdetails`);
  }   

  updateGeneralDetails(idApplication: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${idApplication}/modifyApplication`, data);
  }

  setMapping(idApplication: number, examsMapping: any[]): Observable<any> {
    return this.http.put(`${this.apisUrl}/${idApplication}/setmapping`, 
    { 
      examsMapping: examsMapping
    });
  }

  uploadUpdatedLearningAgreement(idApplication: number, learningagreement: File)
  {
    const formDataLa = new FormData();
    const applicationStatus = 'In attesa di approvazione del Learning Agreement';
  
    formDataLa.append('uploaded_file', learningagreement);
    formDataLa.append('applicationStatus', applicationStatus);

    return this.http.put(`${this.apisUrl}/${idApplication}/uploadlearningagreement`, formDataLa);
  }
}