import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataserviceService } from '../services/data.service';
import { MatSnackBar } from '@angular/material/snack-bar';


@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  hidePassword: boolean = true;
  email: any;
  password: any;
  loginPrompt: string = '';

  constructor(
    private router: Router,
    private ds: DataserviceService,
    private snackbar: MatSnackBar
  ) { }

  ngOnInit(): void {
  }

  async login() {
    const userInfo = {
      email: this.email,
      password: this.password
    };

    await this.ds.sendApiRequest("login", userInfo).subscribe((res: any) => {
      if (res.payload == null) {
        this.snackbar.open("Incorrect Credentials", 'close', { duration: 1200 });
      } else {
        localStorage.setItem("email", res.payload.email);
        localStorage.setItem("user_id", res.payload.user_id);
        localStorage.setItem("username", res.payload.username); // Store user's name

        console.log("Username set in localStorage:", localStorage.getItem("username")); // Debug statement
        console.log("User_id set in localStorage:", localStorage.getItem("user_id")); // Debug statement
        console.log("Email set in localStorage:", localStorage.getItem("email")); // Debug statement
        this.snackbar.open("Welcome, " + localStorage.getItem("username") + "!", 'close', { duration: 3000 });
        this.router.navigate(["/profile"]);
      }
    });
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  onRegister(event: Event): void {
    event.preventDefault(); // Prevent default link behavior
    this.router.navigate(['/register']); // Navigate to the register route
  }
}
