import { Component, OnInit, signal} from '@angular/core';
import { Router, RouterLink} from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApplicationsService, Application, OfficeHomeSummary} from '../../../services/office/office_applications.service';
import { HeaderComponent } from '../../common_files/header/header.component';

@Component({
    selector: 'office-home',
    standalone: true,
    templateUrl: './office_home.component.html',
    styleUrls: ['./office_home.component.css', '../../common_files/common_css/style.css'],      
    imports: [CommonModule, HeaderComponent]
})

export class OfficeHomeComponent implements OnInit{

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

        // mi metto in attesa di risposte dal server per recuperare i dati che mi servono
        this.applicationsService.getOfficeHome().subscribe({
            next: (stateData: OfficeHomeSummary) => {
                
                this.totalsApplications.set(stateData.totalsApplications);
                this.inProgressApplications.set(stateData.inProgressApplications);
                this.actionRequiredApplications.set(stateData.actionRequiredApplications);
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
        this.applicationsService.getOfficeApplications().subscribe({
            next: (applicationsData: Application[]) => {
                console.log(applicationsData);
                this.applications.set(applicationsData);
            },
            error: (err) => {
                if(err.status == 401)
                    this.router.navigate(["/unauthorized"]);
                                
                console.error("Error during the loading of the applications", err);
                this.errorMessage = "Impossible to upload applications";
            }
        })
    }

    openApplicationDetails(idApplication: number): void {
        this.router.navigate(["/officeapplicationdetails"],
            {
                queryParams: {
                    idapplication: idApplication
                }
            });
    }

    getBadgeClass(state: string): string {
        const redStates = [
            'In attesa conferma pre-partenza',
            'In attesa conferma Ufficio Overseas'
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