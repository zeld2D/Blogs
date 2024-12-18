import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataserviceService } from '../services/data.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';

interface Comment {
  comment_id: number;
  user_id: string;
  username: string;
  comment_text: string;
  post_id: number;
  isEditing?: boolean; 
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',  // Update the path to the correct HTML file
  styleUrls: ['./profile.component.scss']
  
})
export class ProfileComponent implements OnInit {
  posts: any[] = [];
  error: string | null = null;
  expandedPostId: number | null = null; // Track expanded post ID
  expandedCommentPostId: number | null = null; // Track expanded comments post ID
  newComment: string = '';
  userId: number | null = null;
  comments: Comment[] = [];

  constructor(
    private router: Router,
    private ds: DataserviceService,
    private snackbar: MatSnackBar,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.userId = this.getUserId(); // Fetch user ID from storage

    if (!this.userId) {
      console.error('User ID not found.');
      this.error = 'User ID not found.';
      return;
    }

    this.ds.receiveApiRequest('getPosts').subscribe(
      (response: any) => {
        this.posts = response
          .filter((post: any) => post.user_id === this.userId)
          .map((post: any) => ({
            ...post,
            sanitizedContent: this.sanitizeHtml(post.content),
            sanitizedSummary: this.sanitizeHtml(this.getSummary(post.content)),
            comments: post.comments || [],
            commentsCount: post.commentsCount || 0
          }));
      },
      (error) => {
        console.error('Error fetching posts:', error);
        this.error = error.message || 'Failed to fetch posts';
      }
    );
  }

  sanitizeHtml(content: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }

  getSummary(content: string): string {
    return content.length > 200 ? content.substring(0, 200) + '...' : content;
  }

  toggleExpand(postId: number): void {
    this.expandedPostId = this.expandedPostId === postId ? null : postId;
  }

  toggleComments(postId: number): void {
    if (this.expandedCommentPostId === postId) {
      this.expandedCommentPostId = null;
    } else {
      this.expandedCommentPostId = postId;
      this.fetchComments(postId); // Fetch comments for the selected post
    }
  }

  editPost(postId: number): void {
    this.router.navigate(['/edit-post', postId]);
  }

  deletePost(postId: number): void {
    console.log('Deleting post with ID:', postId);
    this.ds.sendApiRequest('deletePost', { post_id: postId }).subscribe(
      (response: any) => {
        if (response.code === 200) {
          this.loadPosts(); // Refresh the post list
        } else {
          this.snackbar.open(response.message || 'Error deleting post', 'Close', { duration: 2000 });
        }
      },
      (error: any) => {
        this.handleError('Error deleting post', error);
      }
    );
  }

  getUserId(): number | null {
    const userId = localStorage.getItem('user_id');
    return userId ? parseInt(userId, 10) : null;
  }

  logout(): void {
    console.log('Logout clicked');
    this.router.navigate(['/login']);
  }

  addComment(postId: number): void {
    const trimmedComment = this.newComment.trim();

    if (trimmedComment.length === 0) {
      this.snackbar.open('Cannot add an empty comment.', 'Close', { duration: 3000 });
      return;
    }

    if (trimmedComment.length > 150) {
      this.snackbar.open('Comment exceeds maximum limit of 150 characters.', 'Close', { duration: 3000 });
      return;
    }

    if (!this.userId) {
      this.snackbar.open('User ID not found.', 'Close', { duration: 3000 });
      return;
    }

    const commentData: Comment = {
      comment_id: 0,
      user_id: this.userId.toString(),
      username: localStorage.getItem('username') || 'Anonymous',
      post_id: postId,
      comment_text: trimmedComment
    };

    this.ds.sendApiRequest('addComment', commentData).subscribe({
      next: (response: { code?: number; comment_id?: number; message?: string } | null) => {
        if (response?.code === 200) {
          commentData.comment_id = response.comment_id || 0;
          const post = this.posts.find(p => p.post_id === postId);
          if (post) {
            post.comments.push(commentData);
            post.commentsCount += 1;
            this.newComment = '';
            this.snackbar.open('Comment added successfully', 'Close', { duration: 3000 });
            this.fetchComments(postId); // Refresh comments after adding a new one
          }
        } else {
          this.snackbar.open('Error adding comment: ' + (response?.message || 'Unknown error'), 'Close', { duration: 3000 });
        }
      },
      error: (err: any) => {
        this.handleError('Error adding comment', err);
      }
    });
  }

  fetchComments(postId: number): void {
    this.ds.receiveApiRequest('getComments').subscribe(
      (response: any) => {
        console.log('Comments:', response);
        const filteredComments = response.filter((comment: Comment) => comment.post_id === postId);
        const post = this.posts.find(p => p.post_id === postId);
        if (post) {
          post.comments = filteredComments;
          post.commentsCount = filteredComments.length;
        }
        console.log('Current User ID:', this.userId);
      },
      (error: any) => {
        console.error('Error fetching comments:', error);
      }
    );
  }

  editComment(comment: Comment): void {
    comment.isEditing = true; // Set the comment to editing mode
  }

  saveComment(comment: Comment): void {
    const trimmedComment = comment.comment_text.trim();

    if (trimmedComment.length === 0) {
      this.snackbar.open('Cannot save an empty comment.', 'Close', { duration: 3000 });
      return;
    }

    if (trimmedComment.length > 150) {
      this.snackbar.open('Comment exceeds maximum limit of 150 characters.', 'Close', { duration: 3000 });
      return;
    }

    this.ds.sendApiRequest('editComment', comment).subscribe({
      next: (response: { code?: number; message?: string } | null) => {
        if (response?.code === 200) {
          comment.isEditing = false; // Exit editing mode
          this.snackbar.open('Comment updated successfully!', 'Close', { duration: 3000 });
        } else {
          this.snackbar.open('Error updating comment: ' + (response?.message || 'Unknown error'), 'Close', { duration: 3000 });
        }
      },
      error: (err: HttpErrorResponse) => {
        this.handleError('Error updating comment', err);
      }
    });
  }

  cancelEdit(comment: Comment): void {
    comment.isEditing = false; // Exit editing mode without saving
    this.fetchComments(comment.post_id); // Refresh comments to reset any changes
  }

  deleteComment(comment: Comment): void {
    this.ds.sendApiRequest('deleteComment', { comment_id: comment.comment_id }).subscribe({
      next: (response: { code?: number; message?: string } | null) => {
        if (response?.code === 200) {
          const post = this.posts.find(p => p.post_id === comment.post_id);
          if (post) {
            post.comments = post.comments.filter((c: { comment_id: number; }) => c.comment_id !== comment.comment_id);
            post.commentsCount -= 1;
            this.snackbar.open('Comment deleted successfully', 'Close', { duration: 3000 });
          }
        } else {
          this.snackbar.open('Error deleting comment: ' + (response?.message || 'Unknown error'), 'Close', { duration: 3000 });
        }
      },
      error: (err: any) => {
        this.handleError('Error deleting comment', err);
      }
    });
  }

  handleError(message: string, error: any): void {
    console.error(message, error);
    this.snackbar.open(`${message}: ${error?.message || 'Unknown error'}`, 'Close', { duration: 3000 });
  }
}