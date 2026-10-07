import { Component, OnInit, signal} from '@angular/core';
import { Router, RouterLink} from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApplicationsService, Application, ProfessorHomeSummary} from '../../../services/professor/professor_applications.service';
import { HeaderComponent } from '../../common_files/header/header.component';

@Component({
    selector: 'professor-home',
    standalone: true,
    templateUrl: './professor_home.component.html',
    styleUrls: ['./professor_home.component.css', '../../common_files/common_css/style.css'],      
    imports: [CommonModule, HeaderComponent]
})

export class ProfessorHomeComponent implements OnInit{

    // Dati del login
    user: any = null; 

    // Counter pratiche
    totalsApplications = signal<number>(0);
    inProgressApplications = signal<number>(0);
    actionRequiredApplications = signal<number>(0);
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

        this.applicationsService.getProfessorHome().subscribe({
            next: (stateData: ProfessorHomeSummary) => {
                this.totalsApplications.set(stateData.totalsApplications);
                this.inProgressApplications.set(stateData.inProgressApplications);
                this.actionRequiredApplications.set(stateData.actionRequiredApplications);
                this.closedApplications.set(stateData.closedApplications);
            },
            error: (err) => {
                console.error("Error during the loading of the applications status counters", err);
            }
        })
    }

    loadApplications(): void {
        this.applicationsService.getProfessorApplications().subscribe({
            next: (applicationsData: Application[]) => {
                console.log(applicationsData);
                this.applications.set(applicationsData);
            },
            error: (err) => {
                console.error("Error during the loading of the applications", err);
                this.errorMessage = "Impossible to upload applications";
            }
        })
    }

    openApplicationDetails(idApplication: number): void {
        this.router.navigate(["/professorapplicationdetails"],
            {
                queryParams: {
                    idapplication: idApplication
                }
            });
    }

    getBadgeClass(state: string): string {
        const redStates = [
            'In attesa di approvazione del Learning Agreement',
            'In riconoscimento esami'
        ];

        if (state === 'Chiusa') 
        {
            return 'green-state';
        }
        else if (redStates.includes(state)) 
        {
            return 'red-state';
        }
        return 'yellow-state';
    }
}