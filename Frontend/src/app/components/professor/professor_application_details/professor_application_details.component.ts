import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router} from '@angular/router';
import { ApplicationDetailsService, ApplicationDetails, ExamsMapping, Decision } from '../../../services/professor/professor_applications_details.service';
import { TimeLineComponent } from '../../common_files/time_line/time_line.component';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'application_details',
    standalone: true,
    imports: [FormsModule, TimeLineComponent],
    templateUrl: './professor_application_details.component.html',
    styleUrls: ['./professor_application_details.component.css']
})
export class ProfessorApplicationDetailComponent {
    private router = inject(Router);
    private idApplication: number = 0;

    // Flag locale per mostrare/nascondere la textarea di rifiuto
    isRejecting = false;
    refusalMotivation = '';

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
            console.error("Error during the loading of the application", err);
            }
        });
    }
    
    getApplicationExamsMapping(idApplication: number): void {
        this.applicationsDetailsService.getApplicationExamsMapping(idApplication).subscribe({
            next: (examsMapping: ExamsMapping[]) => {
                this.examsMapping.set(examsMapping);
                console.log(this.examsMapping());
            },
            error: (err) => {
            console.error("Error during the loading of the application", err);
            }
        });
    }
    
    uploadLearningAgreement(): void {
        if (!this.learningagreement) {
            return;
        }
        this.applicationsDetailsService.uploadLearningAgreement(this.idApplication, this.learningagreement).subscribe({
            next: () => { },
            error: (err) => {
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

    acceptLA(): void {

        this.applicationsDetailsService.updateLaStatus(this.idApplication, 'accept', this.refusalMotivation, this.applicationInfo()!.state).subscribe({
            next: () => {
            this.applicationInfo.update(prev => prev ? {
                ...prev,
                statusla: true,
                state: 'In attesa conferma pre-partenza'
            } : null);
            },
            error: (err) => console.error("Error during the acceptation of the LA", err)
        });
    }

    confirmRejectionLA(): void {
        if (!this.refusalMotivation.trim()) return;
        
        this.applicationsDetailsService.updateLaStatus(this.idApplication, 'reject', this.refusalMotivation, this.applicationInfo()!.state).subscribe({
            next: () => {
            this.applicationInfo.update(prev => prev ? {
                ...prev,
                statusla: false,
                refusalMotivation: this.refusalMotivation
            } : null);
            this.isRejecting = false;
            },
            error: (err) => console.error("Error during the refusal of the LA", err)
        });
    }

    submitDecisions(event: SubmitEvent): void {

        const form = event.target as HTMLFormElement;

        // Verifico se i controlli del form sono rispettati
        if (!form.checkValidity()) {
            event.preventDefault();
            alert("You must give a decision for every exam!");
            return;
        }

        // Estraggo elementi HTML di tipo "input" il cui nome inizia con "decision_"
        const selected = document.querySelectorAll<HTMLInputElement>(
        'input[name^="decision_"]:checked'
        );
        
        let data: Decision[] = [];

        selected.forEach(input => {
            const [_, caFoscariCourseCode, foreignCourseCode, idApplication] = input.name.split("_");

            data.push({
                caFoscariCourseCode: caFoscariCourseCode,
                foreignCourseCode: foreignCourseCode,
                decision: Number(input.value)
            });
        });

        this.applicationsDetailsService.sendDecisions(this.idApplication, data).subscribe({
            next: () => {
                
            },
            error: (err) => {
                console.error("Error during the sending of the evaluations decisions ", err);
            }

        });

    }

    goBackHome(): void {
        this.router.navigate(["/homeprofessor"],
            {
                queryParams: {}
            });
    }
}