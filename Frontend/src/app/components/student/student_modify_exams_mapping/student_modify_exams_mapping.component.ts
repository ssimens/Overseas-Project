import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router} from '@angular/router';
import { ModifyExamsService, ExamsMapping, Course } from '../../../services/student/student_application_modify_exams.service';

@Component({
  selector: 'student_modify_exams',
  standalone: true,
  templateUrl: './student_modify_exams_mapping.component.html',
  styleUrls: ['./student_modify_exams_mapping.component.css'],
  imports: [ FormsModule ]
})

export class ApplicationModifyExams implements OnInit {

    idApplication: number = 0;
    examsMapping = signal<ExamsMapping[]>([]);
    caFoscariCourses = signal<Course[]>([]);
    foreignCourses = signal<Course[]>([]);
    learningagreement: File | null = null;
    modificationText: string = '';

    constructor
    (
        private modifyExamsService: ModifyExamsService,
        private route: ActivatedRoute,
        private router: Router
    ){}

    ngOnInit(): void {
        this.idApplication = Number(
        this.route.snapshot.queryParamMap.get('idapplication')); // Reperisco valori da url
        
        this.getApplicationExamsMapping();
        this.getCaFoscariCourses();
        this.getForeignCourses();
    }

    getApplicationExamsMapping(): void
    {
        this.modifyExamsService.getApplicationExamsMapping(this.idApplication).subscribe({
            next:(examsMapping: ExamsMapping[]) =>{
                this.examsMapping.set(examsMapping);
                console.log(this.examsMapping());
            },
            error: (err) => {
                if(err.status == 401)
                    this.router.navigate(["/unauthorized"]);                

                console.error("Error during the examsMapping extraction: ", err);
            }            
        });
    }

    getCaFoscariCourses(): void
    {
        this.modifyExamsService.getCaFoscariCourses(this.idApplication).subscribe({
            next: (caFoscariCourses: Course[]) => {
                this.caFoscariCourses.set(caFoscariCourses);
                console.log(this.caFoscariCourses);
            },
            error: (err) => {
                if(err.status == 401)
                    this.router.navigate(["/unauthorized"]);                
                
                console.error("Error during the extraction of the Ca' Foscari course: ", err);
            }
        });
    }

    getForeignCourses(): void
    {
        this.modifyExamsService.getForeignCourses(this.idApplication).subscribe({
            next: (foreignCourses: Course[]) => {
                this.foreignCourses.set(foreignCourses);
            },
            error: (err) => {
                if(err.status == 401)
                    this.router.navigate(["/unauthorized"]);                

                console.error("Error during the extraction of the foreign courses: ", err);
            }
        });
    }

    addMapping(): void
    {
        this.examsMapping.update(mappings => [
            ...mappings,
            {
                caFoscariCourseCode: '',
                caFoscariCourseTitle: '',
                caFoscariCourseCFU: 0,
                foreignCourseTitle: '',
                foreignCourseCFU: 0,
                foreignCourseCode: ''
            }
        ]);
        
        setTimeout(() => {
            this.updateOptions('caFoscariMappedCourses');
            this.updateOptions('foreignMappedCourses');
        });
    }

    removeMapping(mapping: ExamsMapping) {
        this.examsMapping.update(mappings =>
            mappings.filter(m => m !== mapping)
        );  
    }

    sendMapping(): void
    {
        const validMappings = this.examsMapping().filter(mappings =>
            mappings.caFoscariCourseCode !== '' && mappings.foreignCourseCode !== ''
        );

        this.modifyExamsService.sendExamsMapping(validMappings, this.idApplication).subscribe({
            next: () => {
                this.modifyExamsService.uploadUpdatedLearningAgreement(this.idApplication, this.learningagreement!).subscribe({
                    next: () => {
                        this.modifyExamsService.sendModificationText(this.idApplication, this.modificationText).subscribe({
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

                                console.error("Error during the update of the modification text ", err)
                            }
                        });
                    },
                    error: (err) => {
                        if(err.status == 401)
                            this.router.navigate(["/unauthorized"]);                

                        console.error("Error during the upload of learning agreement ", err)
                    }
                });
            },
            error: (err) => {
                if(err.status == 401)
                    this.router.navigate(["/unauthorized"]);                

                console.error("Error during the update of exams mapping ", err)
            }
        });
    }

    goBack(): void
    {
        this.router.navigate(["/studentapplicationdetails"],
        {
            queryParams: 
            {
                idapplication: this.idApplication
            }
        });
    }

    isCaFoscariCourseSelected(code: string, currentMapping: any): boolean 
    {
        // Controllo se la voce del menù è già presente da qualche parte
        return this.examsMapping().some(
            mapping =>
                mapping !== currentMapping &&
                mapping.caFoscariCourseCode === code
        );
    }

    isForeignCourseSelected(code: string, currentMapping: any): boolean 
    {
        // Controllo se la voce del menù è già presente da qualche parte
       return this.examsMapping().some(
            mapping =>
                mapping !== currentMapping &&
                mapping.foreignCourseCode === code
        );
    }

    // Serve per aggiornare il signal, altrimenti Angular non se ne accorge
    // e non aggiorna i menù successivi
    onCaFoscariCourseChange(mapping: any, event: Event) 
    {
        const select = event.target as HTMLSelectElement; // Elemento che ha generato l'evento

        // Estraggo corso in base a quello selezionato
        const corso = this.caFoscariCourses().find(
            corso => corso.code === select.value
        );

        if(corso)
        {
            mapping.caFoscariCourseCode = corso.code;
            mapping.caFoscariCourseTitle = corso.name;
            mapping.caFoscariCourseCFU = corso.cfu;
        }

        // Ricreo un array con gli stessi elementi e aggiorno examsMapping cosi Angular vede il cambiamento
        this.examsMapping.set([...this.examsMapping()]);
    }

    // Serve per aggiornare il signal, altrimenti Angular non se ne accorge
    // e non aggiorna i menù successivi
    onForeignCourseChange(mapping: any, event: Event) 
    {
        const select = event.target as HTMLSelectElement; // Elemento che ha generato l'evento

        // Estraggo corso in base a quello selezionato
        const corso = this.foreignCourses().find(
            corso => corso.code === select.value
        );

        if(corso)
        {
            mapping.foreignCourseCode = corso.code;
            mapping.foreignCourseTitle = corso.name;
            mapping.foreignCourseCFU = corso.cfu;
        }

        // Ricreo un array con gli stessi elementi e aggiorno examsMapping cosi Angular vede il cambiamento
        this.examsMapping.set([...this.examsMapping()]);
    }

    updateOptions(className: string)
    {
        const allMenus = document.querySelectorAll<HTMLSelectElement>(
            "." + className
        );

        // Array dei valori selezionati
        const selectedValue = Array.from(allMenus)
            .map(select => select.value)
            .filter(value => value !== "");

        allMenus.forEach(select => {
            // Studio elemento per elemento e controllo se già selezionato
            Array.from(select.options).forEach(option => {
                if (option.value === "") return;

                const alreadySelected =
                    selectedValue.includes(option.value) &&
                    select.value !== option.value;

                option.hidden = alreadySelected;
                option.disabled = alreadySelected;
            });
        });
    }

    // Controlla se ci sono corsi che non sono ancora stati mappati
    // e quindi possono venir aggiunti
    canAddMapping(): boolean {
        const usedForeignCourses = this.examsMapping()
            .map(mapping => mapping.foreignCourseCode)
            .filter(code => code !== '');

        const usedCaFoscariCourses = this.examsMapping()
            .map(mapping => mapping.caFoscariCourseCode)
            .filter(code => code !== '');

        const foreignAvailable =
            usedForeignCourses.length < this.foreignCourses().length;

        const caFoscariAvailable =
            usedCaFoscariCourses.length < this.caFoscariCourses().length;

        return foreignAvailable && caFoscariAvailable;
    }
}