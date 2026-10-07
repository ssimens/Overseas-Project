import { Component, OnInit, signal} from '@angular/core';
import { Router, RouterLink} from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApplicationsService, Application, StudentHomeSummary} from '../../../services/student/student_applications.service';
import { HeaderComponent } from '../../common_files/header/header.component';

@Component({
    selector: 'student-home',
    standalone: true,
    templateUrl: './student_home.component.html',
    styleUrls: ['./student_home.component.css', '../../common_files/common_css/style.css'],      
    imports: [CommonModule, RouterLink, HeaderComponent]
})

export class StudentHomeComponent implements OnInit {

    // Dati del login
    user: any = null; 

    // Counter pratiche
    totalsApplications = signal<number>(0);
    inProgressApplications = signal<number>(0);
    evaluationApplications = signal<number>(0);
    closedApplications = signal<number>(0);

    // Array per salvare pratiche dello studente
    applications = signal<Application[]>([]);
    errorMessage: string = '';

    constructor(
        private applicationsService: ApplicationsService,
        private router: Router
    ) {}

    ngOnInit(): void {
        
        this.user = JSON.parse(sessionStorage.getItem("user") || "{}");
        this.loadData();
        this.loadApplications();
    }

    loadData(): void {
        this.applicationsService.getStudentHome().subscribe({
            next: (stateData: StudentHomeSummary) => {
                this.totalsApplications.set(stateData.totalsApplications);
                this.inProgressApplications.set(stateData.inProgressApplications);
                this.evaluationApplications.set(stateData.evaluationApplications);
                this.closedApplications.set(stateData.closedApplications);
            },
            error: (err) => {
                if(err.status == 401)
                    this.router.navigate(["/unauthorized"]);                
                
                console.error("Error during the loading of the applications status counters", err);
            }
        })
    }

    loadApplications(): void {
        this.applicationsService.getStudentApplications().subscribe({
            next: (applicationsData: Application[]) => {
                console.log(applicationsData);
                this.applications.set(applicationsData);
            },
            error: (err) => {
                if(err.status == 401)
                    this.router.navigate(["/unauthorized"]);

                console.error("Error during the loading of the application", err);
                this.errorMessage = "Impossible to upload applications";
            }
        })
    }

    openApplicationDetails(idApplication: number): void {
        this.router.navigate(["/studentapplicationdetails"],
            {
                queryParams: {
                    idapplication: idApplication
                }
            });
    }

    getBadgeClass(state: string): string {
        const redStates = [
            'In attesa di approvazione del Learning Agreement',
            'In attesa conferma pre-partenza',
            'In riconoscimento esami',
            'In attesa conferma Ufficio Overseas'
        ];

        if (state === 'Chiusa') 
            return 'green-state';
        else if (redStates.includes(state)) 
            return 'red-state';

        return 'yellow-state';
    }
}