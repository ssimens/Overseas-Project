import { LoginComponent } from "./components/login/login.component";
import { StudentHomeComponent } from "./components/student/student_home/student_home.component";
import { ApplicationDetailComponent } from "./components/student/student_application_details/student_application_details.component";
import { ProfessorHomeComponent } from "./components/professor/professor_home/professor_home.component";
import { ProfessorApplicationDetailComponent } from "./components/professor/professor_application_details/professor_application_details.component";
import { OfficeHomeComponent } from "./components/office/office_home/office_home.component";
import { OfficeApplicationDetailComponent } from "./components/office/office_application_details/office_application_details.component";
import { Routes } from "@angular/router";
import { ApplicationModifyExams } from "./components/student/student_modify_exams_mapping/student_modify_exams_mapping.component";
import { NewApplicationComponent } from './components/student/student_new_application/student_new_application.component'
import { Unauthorized } from "./components/unauthorized/unauthorized.component";
import { ModifyApplicationComponent } from "./components/student/student_modify_application/student_modify_application.component";

export const routes: Routes = [
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'unauthorized',
        component: Unauthorized
    },

    /* STUDENTE */ 

    {
        path: 'homestudent',
        component: StudentHomeComponent
    },
    {
        path: "studentapplicationdetails",
        component: ApplicationDetailComponent
    },
    {
        path:'modifyexamsmapping',
        component: ApplicationModifyExams
    },
    {
        path:'newapplication',
        component: NewApplicationComponent
    },
    {
        path:'modifyapplication',
        component: ModifyApplicationComponent
    },

    /* PROFESSORE */

    {
        path: 'homeprofessor',
        component: ProfessorHomeComponent
    },
    {
        path: 'professorapplicationdetails',
        component: ProfessorApplicationDetailComponent

    },

    /* UFFICIO OVERSEAS */

    {
        path: 'homeoffice',
        component: OfficeHomeComponent
    },
    {
        path: 'officeapplicationdetails',
        component: OfficeApplicationDetailComponent

    },
];
