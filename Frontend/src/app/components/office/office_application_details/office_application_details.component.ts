import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink} from '@angular/router';
import { ApplicationDetailsService, ApplicationDetails, ExamsMapping } from '../../../services/office/office_applications_details.service';
import { TimeLineComponent } from '../../common_files/time_line/time_line.component';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'application_details',
    standalone: true,
    imports: [FormsModule, TimeLineComponent],
    templateUrl: './office_application_details.component.html',
    styleUrls: ['./office_application_details.component.css']
})
export class OfficeApplicationDetailComponent {
    private router = inject(Router);
    private idApplication: number = 0;
    // Flag locale per mostrare/nascondere la textarea di rifiuto
    isRejecting = false;
    motivazioneRifiuto = '';

    // Esempio con Signal (o classica variabile)
    applicationInfo = signal<ApplicationDetails | null>(null);
    examsMapping = signal<ExamsMapping[]>([]);
    learningagreement: File | null = null;

    constructor(
        private applicationsDetailsService: ApplicationDetailsService,
        private route: ActivatedRoute)
    {}

    ngOnInit(): void {
        this.idApplication = Number(
            this.route.snapshot.queryParamMap.get('idapplication') // Reperisco valori da url
        );
        this.getApplicationInfo(this.idApplication);
        this.getApplicationExamsMapping(this.idApplication);
    }
    
    getApplicationInfo(idApplication: number): void {
        this.applicationsDetailsService.getApplicationInfo(idApplication).subscribe({
            next: (applicationInfo: ApplicationDetails) => {
                this.applicationInfo.set(applicationInfo);
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
            },
            error: (err) => {
            if(err.status == 401)
                this.router.navigate(["/unauthorized"]);
                            
            console.error("Error during the loading of the application", err);
            }
        })
    }
    
    uploadLearningAgreement(): void {
        if (!this.learningagreement) {
            return;
        }
        this.applicationsDetailsService.uploadLearningAgreement(this.idApplication, this.learningagreement).subscribe({ next: () => {
            },
            error: (err) => {
            if(err.status == 401)
                this.router.navigate(["/unauthorized"]);
                            
            console.error('Error during the uploading of the LA', err);
            }
        });
    }

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

    confirmPreDeparture(): void {
        this.applicationsDetailsService.updateApplicationStatusByOffice(this.idApplication, 'Pre-Departure phase completed').subscribe({
            next: () => {
            this.applicationInfo.update(prev => prev ? {
                ...prev,
                state: 'Mobilità in corso'
            } : null);

            this.router.navigate(["/homeoffice"]);
            },
            error: (err) =>{ 
                if(err.status == 401)
                    this.router.navigate(["/unauthorized"]);
            
                console.error("Error during the confirmation of the pre-departure phase", err)
            }
        });
    }

    closeApplication(): void {
        this.applicationsDetailsService.updateApplicationStatusByOffice(this.idApplication, 'Application closed').subscribe({
        next: () => {
            this.applicationInfo.update(prev => prev ? {
                ...prev,
                state: 'Chiusa'
            } : null);        

            this.router.navigate(["/homeoffice"]);
            },
            error: (err) => { 
                if(err.status == 401)
                    this.router.navigate(["/unauthorized"]);
            
                console.error("Error during the closure of the application:", err)
            }
        });
    }

    goBackHome(): void {
        this.router.navigate(["/homeoffice"]);
    }
}