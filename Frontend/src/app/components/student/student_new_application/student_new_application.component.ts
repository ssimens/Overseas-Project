import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NewApplicationService, NewApplicationFormData } from '../../../services/student/student_new_application.service';

interface ExamsMapping {
  foreignCourseCode: string;
  foreignCourseTitle: string;
  foreignCourseCFU: number;
  caFoscariCourseCode: string;
  caFoscariCourseTitle: string;
  caFoscariCourseCFU: number;
}

@Component({
  selector: 'new-application',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './student_new_application.component.html',
  styleUrls: ['./student_new_application.component.css', '../../common_files/common_css/style.css']
})

export class NewApplicationComponent implements OnInit {
    
  accademicYear: string = '';
  expectedPeriod: string = '';
  idUni: number | null = null;
  idProfessor: number | null = null;
  studentNotes: string = '';

  uni = signal<NewApplicationFormData['university']>([]);
  professor = signal<NewApplicationFormData['professors']>([]);
  foreignCourses = signal<NewApplicationFormData['foreignCourses']>([]);
  caFoscariCourses = signal<NewApplicationFormData['caFoscariCourses']>([]);
  mapping = signal<ExamsMapping[]>([]);

  selectedForeignCourseCode: string = '';
  selectedCaFoscariCourseCode: string = '';

  constructor(
    private newAppService: NewApplicationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFormData();
  }

  loadFormData(): void {
    this.newAppService.getFormData().subscribe({
      next: (data) => {
        this.uni.set(data.university);
        this.professor.set(data.professors);
        this.foreignCourses.set(data.foreignCourses);
        this.caFoscariCourses.set(data.caFoscariCourses);
      },
      error: (err) => { 
        if(err.status == 401)
            this.router.navigate(["/unauthorized"]);                


        console.error("Error during the loading of the form data", err)
      }
    });
  }

  addCourseToMapping(): void {
    if (!this.selectedForeignCourseCode || !this.selectedCaFoscariCourseCode) return;

    const foreignCourse = this.foreignCourses().find(course => course.code === this.selectedForeignCourseCode);
    const caFoscariCourse = this.caFoscariCourses().find(course => course.code === this.selectedCaFoscariCourseCode);

    if (foreignCourse && caFoscariCourse) {
      const currentMapping = this.mapping();
      this.mapping.set([
        ...currentMapping,
        {
          foreignCourseCode: foreignCourse.code,
          foreignCourseTitle: foreignCourse.name,
          foreignCourseCFU: foreignCourse.cfu,
          caFoscariCourseCode: caFoscariCourse.code,
          caFoscariCourseTitle: caFoscariCourse.name,
          caFoscariCourseCFU: caFoscariCourse.cfu
        }
      ]);
      this.selectedForeignCourseCode = '';
      this.selectedCaFoscariCourseCode = '';
    }
  }

  removeCourse(index: number): void {
    const currentMapping = [...this.mapping()];
    currentMapping.splice(index, 1);
    this.mapping.set(currentMapping);
  }

  sendApplication(): void {
    const data = 
    {
      accademicYear: this.accademicYear,
      expectedPeriod: this.expectedPeriod,
      iduni: this.idUni,
      iddoc: this.idProfessor,
      studentNotes: this.studentNotes,
      mapping: this.mapping()
    };

    if(!data.iduni || !data.accademicYear || !data.expectedPeriod 
      || !data.iddoc || data.mapping.length == 0) {
        alert("You must enter something in all the fields!");
        return;
      }

    this.newAppService.createApplication(data).subscribe({
      next: () => this.router.navigate(['/homestudent']),
      error: (err) => {
        if(err.status == 401)
            this.router.navigate(["/unauthorized"]);                

        console.error("Error during the sending of the application", err)
      }
    });
  }
}