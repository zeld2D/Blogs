import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { QuillEditorComponent } from 'ngx-quill';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DataserviceService } from '../services/data.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-edit-post',
  templateUrl: './edit-post.component.html',
  styleUrls: ['./edit-post.component.scss']
})
export class EditPostComponent implements OnInit {
  @ViewChild('editor') editor!: QuillEditorComponent;

  postId!: number;
  postTitle: string = '';
  postCreator: string = '';
  postContent: string = ''; 
  postStatus: string = 'published';


  editorModules = {
    toolbar: [
      ['bold', 'italic', 'underline'], // Formatting options
      [{ 'list': 'ordered' }] // List options
    ]
  };
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ds: DataserviceService,
    private snackbar: MatSnackBar,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.postId = +params.get('id')!;
      if (this.postId) {
        this.loadPost();
      }
    });
  }

  loadPost(): void {
    this.ds.receiveApiRequest(`getPost/${this.postId}`).subscribe(
      (response: any) => {
        if (response) {
          this.postTitle = response.title;
          this.postCreator = response.created_by;
          this.postContent = response.content; // Assign raw HTML content directly
          this.postStatus = response.status;
        } else {
          this.snackbar.open('Error loading post', 'Close', {
            duration: 3000
          });
        }
      },
      (error: HttpErrorResponse) => {
        this.snackbar.open('An error occurred while loading the post', 'Close', {
          duration: 3000
        });
      }
    );
  }
  
  saveChanges(): void {
    const postData = {
      post_id: this.postId,
      title: this.postTitle,
      created_by: this.postCreator,
      content: this.editor.quillEditor.root.innerHTML,
      status: this.postStatus,
     
    };
  
    console.log('Sending post data:', postData); 
  
    this.ds.sendEditPostRequest(postData).subscribe(
      (response: any) => {
        console.log('Response from server:', response); 
        if (response && response.code === 200) {
          this.snackbar.open('Post updated successfully!', 'Close', {
            duration: 3000
          });
          this.router.navigate(['/profile']);
        } else {
          this.snackbar.open('Error updating post', 'Close', {
            duration: 3000
          });
        }
      },
      (error: HttpErrorResponse) => {
        console.error('Error occurred:', error); 
        this.snackbar.open('An error occurred while updating the post', 'Close', {
          duration: 3000
        });
      }
    );
  }

  cancelPost(): void {
    this.router.navigate(['/profile']);
  }

  

  logout(): void {
    console.log('Logout clicked');
   this.router.navigate(['/login']);
  }
}