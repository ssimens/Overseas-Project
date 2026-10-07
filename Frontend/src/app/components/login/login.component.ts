import { Component } from '@angular/core';
import { LoginService } from '../../services/login/login.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'login-form',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css', '../common_files/common_css/style.css'],  
  imports: [ReactiveFormsModule]
})
export class LoginComponent{

  loginForm: FormGroup;
  loginError: boolean = false;

  constructor(private fb: FormBuilder, private loginService: LoginService, private router: Router)
  {
      this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit()
  {
    this.loginError = false;
    
    if(!this.loginForm.valid)
    {
      this.loginError = true;
      return;
    }
    else
    {
      const email = this.loginForm.get("email")?.value;
      const password = this.loginForm.get("password")?.value;
      
      this.loginService.checkLogin(email!, password!)
        .subscribe({
        next: (res) => {          
          
          if(res.user.role == 1)
            this.router.navigate(["homestudent"]);
          else if(res.user.role == 2 )
            this.router.navigate(["/homeprofessor"]);
          else if(res.user.role == 3 )
            this.router.navigate(["/homeoffice"]);
        },
        error: () => {
          this.loginError = true;
        }});
    }
  }
}