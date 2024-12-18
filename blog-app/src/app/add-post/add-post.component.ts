import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DataserviceService } from '../services/data.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { QuillEditorComponent } from 'ngx-quill';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import DOMPurify from 'dompurify';

@Component({
  selector: 'app-add-post',
  templateUrl: './add-post.component.html',
  styleUrls: ['./add-post.component.scss']
})
export class AddPostComponent {
  @ViewChild('editor') editor!: QuillEditorComponent;

  postTitle: string = '';
  postCreator: string = '';
  postContent: SafeHtml = ''; // For display purposes only
  postStatus: string = 'published';

  cards: any[] = []; // Define the cards property if it's used in the template
  selectedCardIndex: number | null = null; // Define selectedCardIndex property if used in the template
  viewMore: boolean = false; // Define viewMore property if used in the template

  editorModules = {
    toolbar: [
      [{ 'font': [] }], // Font family options
      [{ 'size': [] }], // Font size options
      ['bold', 'italic', 'underline'], // Formatting options
      [{ 'align': [] }], // Text alignment options
      [{ 'list': 'ordered' }, { 'list': 'bullet' }], // List options
      ['link', 'image'] // Add a link and image button
    ],
    handlers: {
      image: this.imageHandler.bind(this) // Bind context correctly
    }
  };

  constructor(
    private router: Router,
    private ds: DataserviceService,
    private snackbar: MatSnackBar,
    private sanitizer: DomSanitizer
  ) { }

  // Custom image handler function
  imageHandler() {
    const fileInput = document.createElement('input');
    fileInput.setAttribute('type', 'file');
    fileInput.setAttribute('accept', 'image/*');
    fileInput.click();

    fileInput.onchange = () => {
      const file = fileInput.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const range = this.editor.quillEditor.getSelection();
          if (range) {
            const imageUrl = reader.result as string;
            this.editor.quillEditor.insertEmbed(range.index, 'image', imageUrl);

            // Optional: Remove any custom styling or classes if previously added
            const img = this.editor.quillEditor.root.querySelector('img:last-of-type') as HTMLImageElement;
            if (img) {
              img.style.width = ''; // Reset width
              img.style.maxWidth = ''; // Reset max-width
              img.classList.remove('custom-image'); // Remove custom class if it was added
            }
          }
        };
        reader.readAsDataURL(file);
      }
    };
  }

  // Method to handle form submission and post addition
  addPost(): void {
    if (!this.postTitle || !this.postCreator || !this.postContent) {
      this.snackbar.open('Please fill in all required fields.', 'Close', {
        duration: 3000
      });
      return;
    }

    const editor = this.editor.quillEditor;
    const postContentHtml = editor.root.innerHTML; // Get raw HTML content

    const sanitizedContent = DOMPurify.sanitize(postContentHtml, {
      ALLOWED_TAGS: ['p', 'strong', 'em', 'ul', 'li', 'ol', 'a', 'img', 'u'],
      ALLOWED_ATTR: ['href', 'src', 'alt']
    });

    const postData = {
      user_id: localStorage.getItem("user_id"),
      title: this.postTitle,
      createdBy: this.postCreator,
      content: sanitizedContent,
      status: this.postStatus,
    };

    console.log('Post Data:', postData);

    this.ds.sendApiRequest('addpost', postData).subscribe({
      next: (res: any) => {
        console.log('Server Response:', res);
        if (res && res.code === 200) {
          this.snackbar.open('Post added successfully!', 'Close', {
            duration: 3000
          });
          this.router.navigate(['/profile']);
        } else {
          this.snackbar.open('Error adding post: ' + (res?.message || 'Unknown error'), 'Close', {
            duration: 3000
          });
        }
      },
      error: (err: any) => {
        console.error('API Error:', err);
        this.snackbar.open('An error occurred while adding the post: ' + (err?.message || 'Unknown error'), 'Close', {
          duration: 3000
        });
      }
    });
  }

  // Method to handle post cancellation
  cancelPost(): void {
    this.router.navigate(['/profile']);
  }

  // Method to handle logout
  logout(): void {
    console.log('Logout clicked');
    // Implement logout logic here if needed
    this.router.navigate(['/login']);
  }
}