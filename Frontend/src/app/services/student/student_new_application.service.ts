import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface NewApplicationFormData {
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

export interface CreateApplicationRequest {
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

export class NewApplicationService {
    private apiUrl = "http://localhost:3000/api/homestudent/newapplication";

  constructor(private http: HttpClient) {}

  getFormData(): Observable<NewApplicationFormData> {
    return this.http.get<NewApplicationFormData>(`${this.apiUrl}/formdata`);
  }

  createApplication(applicationData: CreateApplicationRequest): Observable<any> {
    return this.http.post<{ idpratica: number }>(`${this.apiUrl}/sendApplication`, applicationData);
  }
}