import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApplicationDetailsService, ApplicationDetails, ExamsMapping } from '../../../services/student/student_application_details.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TimeLineComponent } from '../../common_files/time_line/time_line.component';

@Component({
  selector: 'application_details',
  standalone: true,
  templateUrl: './student_application_details.component.html',
  styleUrls: ['./student_application_details.component.css'],
  imports: [FormsModule, TimeLineComponent]
})

export class ApplicationDetailComponent implements OnInit {

  erroreFile: boolean = false;
  private idApplication: number = 0;
  applicationInfo = signal<ApplicationDetails | null>(null);
  
  examsMapping = signal<ExamsMapping[]>([]);

  learningagreement: File | null = null;
  transcriptsofrecords: File | null = null;

  arriveDate: string | null = null;
  departureDate: string | null = null;

  // Flag usato per indicare se sono in fase di inserimento/modifica voti
  modifyVotesMode: boolean = false;

  // Flag usato per indicare se ho confermato la fase di mobilità e quindi devo inserire i voti
  confirmedMobility: boolean = false;

  examValues: {
    [exam: string]: {
      vote: number | null;
      decision: boolean | null;
      date: string | null;
    }
  } = {};

  constructor(
    private applicationsDetailsService: ApplicationDetailsService,
    private route: ActivatedRoute,
    private router: Router)
  {}

  ngOnInit(): void {
      this.idApplication = Number(
      this.route.snapshot.queryParamMap.get('idapplication') // Reperisco valori da url
    );

    this.getApplicationInfo(this.idApplication);
    this.getApplicationExamsMapping(this.idApplication);
}

  // -- GET

  getApplicationInfo(idApplication: number): void {
    this.applicationsDetailsService.getApplicationInfo(idApplication).subscribe({
      next: (applicationInfo: ApplicationDetails) => {
          this.applicationInfo.set(applicationInfo);
          console.log('arriveDate:', applicationInfo.arriveDate);
          console.log('departureDate:', applicationInfo.departureDate);
          if (applicationInfo.arriveDate) {
            this.arriveDate = applicationInfo.arriveDate.toString().split('T')[0];
          }

          if (applicationInfo.departureDate) {
            this.departureDate = applicationInfo.departureDate.toString().split('T')[0];
          }
      },
      error: (err) => {
      if(err.status == 401)
        this.router.navigate(["/unauthorized"]);

      console.error("Error during the loading of the application", err);
      }
    });
  }

  getApplicationExamsMapping(idApplication: number): void {
    this.applicationsDetailsService.getApplicationExamsMapping(idApplication).subscribe({
      next: (examsMapping: ExamsMapping[]) => {
          this.examsMapping.set(examsMapping);
          
          // Inizializzo examValues
          for (const mapping of this.examsMapping()) {

            const key =
              mapping.foreignCourseCode + '_' +
              mapping.caFoscariCourseCode + '_' +
              mapping.idApplication;

            if (!this.examValues[key]) {
              this.examValues[key] = {
                vote: mapping.examVote,
                decision: mapping.examVote !== null,
                date: mapping.examDate
              };
            }
          }
      },
      error: (err) => {
        if(err.status == 401)
          this.router.navigate(["/unauthorized"]);

        console.error("Error during the loading of the application", err);
      }
    })
  }

  // -- UPLOAD

  uploadLearningAgreement(): void {
  if (!this.learningagreement) {
    return;
  }

  const alreadyUploaded = this.applicationInfo()?.statusla != null;

    this.applicationsDetailsService.uploadLearningAgreement(this.idApplication, this.learningagreement, alreadyUploaded)
      .subscribe({
        error: (err) => {
          if(err.status == 401)
            this.router.navigate(["/unauthorized"]);

          console.error('Error during the uploading of the LA', err);
        }
    });
  }

  uploadTranscriptsOfRecords(): void {
  if (!this.transcriptsofrecords) {
    return;
  }
  this.applicationsDetailsService.uploadTranscriptsOfRecords(this.idApplication, this.transcriptsofrecords)
    .subscribe({
      next: () => {
        this.getApplicationInfo(this.idApplication);
      },
      error: (err) => {
        if(err.status == 401)
          this.router.navigate(["/unauthorized"]);

        console.error('Error during the uploading of the TOR', err);
      }
    });
  }

  // -- DOWNLOAD

  downloadLearningAgreement(): void {
  
    this.applicationsDetailsService.downloadLearningAgreement(this.idApplication)
      .subscribe(blob => {

      // Creo elemento html <a></a> che è scaricabile quando viene cliccato
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = "LearningAgreement.pdf";

      // Simulo il click
      a.click(); 
    });
  }

  downloadTranscriptsOfRecords(): void {
  
    this.applicationsDetailsService.downloadTranscpriptsOfRecords(this.idApplication)
      .subscribe(blob => {

        // Creo elemento html <a></a> che è scaricabile quando viene cliccato
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = "TranscriptsOfRecords.pdf";

        // Simulo il click
        a.click(); 
    });
  }

  // -- SEND

  sendExamsModifies(): void
  {
    // Object.entries(this.examValues) genera un array di due elementi per una coppia "chiave valore"
    for (const [exam, values] of Object.entries(this.examValues)) {

      const elements = exam.split("_");

      if (values.vote !== null && !values.date)
      {
        alert("There is an exam that doesn't have a date selected, exam course: "+elements[0]);
        return;
      }

      if (values.vote && values.vote > 31)
      {
        alert("There is an exam that have an invalid vote (over 31), exam course: "+elements[0]);
        return;
      }
    }
    
    if(!this.transcriptsofrecords)
    {
      alert("You must insert the transcripts of records file!");
      return;
    }

    this.applicationsDetailsService.sendExamValues(this.idApplication, this.examValues)
      .subscribe({
        next: () => {
          this.getApplicationExamsMapping(this.idApplication);

          this.modifyVotesMode = false;
        },
        error: (err) => {
          if(err.status == 401)
            this.router.navigate(["/unauthorized"]);
          else if(err.status == 400)
          {
            if(err.error.code === 'P0001')
              alert("You must insert departure date and arrive date!");
            else if(err.error.code === 'P0002')
              alert("You inserted a date that is before the arrive date!");
            else if(err.error.code === 'P0003')
              alert("You inserted a date that is after the departure date!");
          }
          console.error('Error during the sending of the exam values', err);
        }
      });
  }

  // -- LOGICA APPLICATIVA

  openApplicationExamsMapping(iduni: number): void
  {
      this.router.navigate(["/modifyexamsmapping"],
                      {
                        queryParams: {
                            idapplication: this.idApplication,
                        }
                      });
  }

  modifyExamsVotes(): void
  {
      this.modifyVotesMode = !this.modifyVotesMode;
  }

  confirmMobilityPhase(): void
  {
    
    if(!this.arriveDate && this.departureDate){
      alert("There must also the be arrive date!");
      console.error("There must also be the arrive date!");
      return;
    }

    if(this.arriveDate && this.departureDate && this.departureDate <= this.arriveDate){
      alert("The departure date must be after the arrive date!");
      console.error("The departure date must be after the arrive date!");
      return;
    }

    if(!this.arriveDate || !this.departureDate){
      alert("You must insert the arrive date and departure date!");
      console.error("There must also be the arrive date!");
      return;
    }

    let arriveDateString: string = '';
    let departureDateString: string = '';

    if(this.arriveDate)
      arriveDateString = this.arriveDate.toString().split('T')[0];

    this.applicationsDetailsService.sendArriveDate(this.idApplication, arriveDateString)
      .subscribe({
        error: (err) => {
          if(err.status == 401)
            this.router.navigate(["/unauthorized"]);

          console.error('Error during the sending of the arrive date', err);
        }
      });

  if(this.departureDate)
    departureDateString = this.departureDate.toString().split('T')[0];
  
  this.applicationsDetailsService.sendDepartureDate(this.idApplication, departureDateString)
    .subscribe({
      error: (err) => {
        if(err.status == 401)
          this.router.navigate(["/unauthorized"]);
        
        console.error('Error during the sending of the departure date', err);
      }
    });

    this.applicationsDetailsService.confirmMobilityPhase(this.idApplication).subscribe({
      next: () => {
          this.getApplicationInfo(this.idApplication);
      },
      error: (err) => {
      if(err.status == 401)
        this.router.navigate(["/unauthorized"]);

        console.error("Error during the loading of the application", err);
      }
    });

    this.getApplicationInfo(this.idApplication);
  }

  notCarried(mapping: any) {
    const key =
      mapping.foreignCourseCode + '_' +
      mapping.caFoscariCourseCode + '_' +
      mapping.idApplication;

    const exam = this.examValues[key];
    exam.decision = false;
    exam.vote = null;
  }

  insertedVote(mapping: ExamsMapping) {
    const key =
      mapping.foreignCourseCode + '_' +
      mapping.caFoscariCourseCode + '_' +
      mapping.idApplication;

    const exam = this.examValues[key];

    if (exam.vote !== null && exam.vote !== undefined) {
      exam.decision = true;
    }
  }

  modifyApplication(): void {
    this.router.navigate(["/modifyapplication"],
    {
        queryParams: {
          idapplication: this.idApplication,
        }
    });
  }

  goBackHome(): void {
    this.router.navigate(["/homestudent"],
    {
        queryParams: {}
    });
  }
}