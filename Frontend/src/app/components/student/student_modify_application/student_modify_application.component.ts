import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ModifyApplicationService, ModifyApplicationFormData } from '../../../services/student/student_modify_application.service';

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
  imports: [CommonModule, FormsModule],
  templateUrl: './student_modify_application.component.html',
  styleUrls: ['./student_modify_application.component.css']
})

export class ModifyApplicationComponent implements OnInit {
    
  idApplication: number = 0;
  accademicYear: string = '';
  expectedPeriod: string = '';
  idUni: number | null = null;
  idProfessor: number | null = null;
  studentNotes: string = '';

  uni = signal<ModifyApplicationFormData['university']>([]);
  professor = signal<ModifyApplicationFormData['professors']>([]);
  foreignCourses = signal<ModifyApplicationFormData['foreignCourses']>([]);
  caFoscariCourses = signal<ModifyApplicationFormData['caFoscariCourses']>([]);
  mapping = signal<ExamsMapping[]>([]);
  learningagreement: File | null = null;

  selectedForeignCourseCode: string = '';
  selectedCaFoscariCourseCode: string = '';

  constructor(
    private ModifyApplicationService: ModifyApplicationService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.idApplication = Number(this.route.snapshot.queryParamMap.get('idapplication'));
    this.loadFormData();
    this.loadApplicationData(this.idApplication);
  }

  loadApplicationData(id: number): void {
    this.ModifyApplicationService.getApplicationDetails(id).subscribe({
      next: (data) => {
        this.accademicYear = data.accademicYear;
        this.expectedPeriod = data.expectedPeriod;
        this.idUni = data.iduni;
        this.idProfessor = data.iddoc;
        this.studentNotes = data.studentNotes;
        
        // Se la pratica ha già dei corsi mappati, popola il signal
        if (data.mapping) 
        {
          this.mapping.set(data.mapping);
        }
      },
      error: (err) => {
        if (err.status == 401) 
            this.router.navigate(["/unauthorized"]);

        console.error("Error during the loading of the application data", err);
      }
    });
  }

  loadFormData(): void {
    this.ModifyApplicationService.getFormData().subscribe({
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
    };

    const updatedMapping = this.mapping();

    console.log("Dati inviati in modifica:", data);

    if(!data.iduni || !data.accademicYear || !data.expectedPeriod || !data.iddoc || updatedMapping.length == 0 || !this.learningagreement) 
    {
        console.log("Validazione fallita. Mancano:", {
          uni: !data.iduni,
          year: !data.accademicYear,
          period: !data.expectedPeriod,
          doc: !data.iddoc,
          mapping: updatedMapping.length == 0,
          learningagreement: !this.learningagreement
        });
        alert("You must enter something in all the fields and upload the Learning Agreement!!");
        return;
    }

    this.ModifyApplicationService.updateGeneralDetails(this.idApplication, data).subscribe({
      next: () => {
        // 2. Seconda chiamata per il mapping (eseguita solo quando la prima è finita)
        this.ModifyApplicationService.setMapping(this.idApplication, updatedMapping).subscribe({
          next: () => {
            this.ModifyApplicationService.uploadUpdatedLearningAgreement(this.idApplication, this.learningagreement!).subscribe({
              next: () => {
                this.router.navigate(["/studentapplicationdetails"],
                {
                    queryParams: 
                    {
                        idapplication: this.idApplication
                    }
                });
              },
              error: (err) => {
                if(err.status == 401)
                  this.router.navigate(["/unauthorized"]);                

                console.error("Error during the send of the learning agreement of the updated application", err)
              }
            });
          },
          error: (err) => {
            if(err.status == 401)
              this.router.navigate(["/unauthorized"]);                

            console.error("Error during the sending of the mapping of the updated application", err)
          }
        });
      },
      error: (err) => {
        if(err.status == 401)
          this.router.navigate(["/unauthorized"]);                

        console.error("Error during the sending of the generics data of the application", err)
      }
    });
  }

  goBack(): void {
    this.router.navigate(["/studentapplicationdetails"],
    {
        queryParams: 
        {
            idapplication: this.idApplication
        }
    });
  }
}