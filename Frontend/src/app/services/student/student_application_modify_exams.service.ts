import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ExamsMapping {
  foreignCourseCode: string;
  foreignCourseTitle: string;
  foreignCourseCFU: number;
  caFoscariCourseCode: string;
  caFoscariCourseTitle: string;
  caFoscariCourseCFU: number;
}

export interface Course {
  code: string;
  name: string;
  cfu: number;
}

@Injectable({
  providedIn: 'root'
})

export class ModifyExamsService{

  private apiUrl = 'http://localhost:3000/api/applications';

  constructor(private http: HttpClient) {}

  getApplicationExamsMapping(idApplication: number): Observable<ExamsMapping[]>
  {
    return this.http.get<ExamsMapping[]>(`${this.apiUrl}/${idApplication}/mapping`);
  }

  getForeignCourses(idApplication: number): Observable<Course[]>
  {
    return this.http.get<Course[]>(`${this.apiUrl}/${idApplication}/foreigncourses`);
  }

  getCaFoscariCourses(idApplication: number): Observable<Course[]>
  {
    return this.http.get<Course[]>(`${this.apiUrl}/${idApplication}/cafoscaricourses`);
  }

  sendExamsMapping(examsMapping: ExamsMapping[], idApplication: number)
  {
    return this.http.put(`${this.apiUrl}/${idApplication}/setmapping`,
    { 
        examsMapping: examsMapping
    });
  }

  uploadUpdatedLearningAgreement(idApplication: number, learningagreement: File)
  {
    const formDataLa = new FormData();
    const applicationStatus = 'Mobilità in corso';
  
    formDataLa.append('uploaded_file', learningagreement);
    formDataLa.append('applicationStatus', applicationStatus);

    return this.http.put(`${this.apiUrl}/${idApplication}/uploadlearningagreement`, formDataLa);
  }

  sendModificationText(idApplication: number, modificationText: string)
  {
    return this.http.put(`${this.apiUrl}/${idApplication}/modificationmotivation`,
    { 
        modificationText: modificationText
    });
  }
}