import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataserviceService {

  constructor(private http: HttpClient) { }

  apiUrl = "http://localhost/Blogs/api-blogs/";

  // Unicode-safe Base64 encoding
  b64EncodeUnicode(str: string): string {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));
  }

  sendApiRequest(method: any, data: any): Observable<any> {
    const encodedData = this.b64EncodeUnicode(JSON.stringify(data));
    return this.http.post(this.apiUrl + method, encodedData);
  }

  receiveApiRequest(method: any): Observable<any> {
    return this.http.get(this.apiUrl + method);
  }

  sendEditPostRequest(data: any): Observable<any> {
    console.log('Sending request to editPost endpoint:', data);
    return this.http.post(this.apiUrl + 'editPost', data);
  }

  logout(): void {
    localStorage.removeItem("user_id"); // Clear stored session information
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    // You can clear other session data if needed
  }
}
