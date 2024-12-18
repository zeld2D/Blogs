import { Component, OnInit } from '@angular/core';
import { DataserviceService } from '../services/data.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';

// Interface for post comments
interface Comment {
  comment_id: number;
  user_id: string;
  username: string;
  comment_text: string;
  post_id: number;
  isEditing?: boolean; 
}

// Interface for a post
interface Post {
  post_id: number;
  title: string;
  content: string;
  created_by: string;
  created_at: string;
  comments: Comment[];
  commentsCount: number;
  sanitizedContent: SafeHtml;
  sanitizedSummary: SafeHtml;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  posts: Post[] = [];
  filteredPosts: Post[] = [];
  error: string = '';
  expandedPostId: number | null = null;
  expandedCommentPostId: number | null = null;
  newComment: string = '';
  userId: string = ''; // Will be set dynamically
  searchTerm: string = ''; // Search term for filtering posts

  constructor(
    private router: Router,
    private ds: DataserviceService,
    private snackbar: MatSnackBar,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.userId = localStorage.getItem('user_id') || '';
    this.loadPosts();
  }

  loadPosts(): void {
    this.ds.receiveApiRequest('getPosts').subscribe({
      next: (response: any) => {
        this.posts = response.map((post: any) => ({
          ...post,
          sanitizedContent: this.sanitizeHtml(post.content),
          sanitizedSummary: this.sanitizeHtml(this.getSummary(post.content)),
          comments: [], // Initialize comments as an empty array
          commentsCount: 0 // Initialize comments count
        }));
        this.filteredPosts = [...this.posts]; // Initialize filtered posts
      },
      error: (err: HttpErrorResponse) => {
        this.handleError('Error fetching posts', err);
      }
    });
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
      this.expandedCommentPostId = null; // Collapse if already expanded
    } else {
      this.expandedCommentPostId = postId; // Expand the selected post
      this.fetchComments(postId); // Fetch comments for the selected post
    }
  }

  fetchComments(postId: number): void {
    this.ds.receiveApiRequest('getComments').subscribe({
      next: (response: any) => {
        console.log('Comments:', response); // Log all comments received
        const filteredComments = response.filter((comment: Comment) => comment.post_id === postId);
        const post = this.posts.find(p => p.post_id === postId);
        if (post) {
          post.comments = filteredComments; // Update the post's comments with filtered ones
          post.commentsCount = filteredComments.length; // Update comments count
        }
        console.log('Current User ID:', this.userId); // Log current user ID after fetching comments
      },
      error: (err: HttpErrorResponse) => {
        this.handleError('Error fetching comments', err);
      }
    });
  }

  searchPosts(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredPosts = this.posts.filter(post => 
      post.title.toLowerCase().includes(term) || 
      post.created_by.toLowerCase().includes(term)
    );
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
          // Remove the deleted comment from the post's comments list
          const post = this.posts.find(p => p.post_id === comment.post_id);
          if (post) {
            post.comments = post.comments.filter(c => c.comment_id !== comment.comment_id);
            post.commentsCount = post.comments.length;
          }
          this.snackbar.open('Comment deleted successfully', 'Close', { duration: 3000 });
          this.searchPosts(); // Reapply search filter
        } else {
          this.snackbar.open('Error deleting comment: ' + (response?.message || 'Unknown error'), 'Close', { duration: 3000 });
        }
      },
      error: (err: HttpErrorResponse) => {
        this.handleError('Error deleting comment', err);
      }
    });
  }

  deletePost(postId: number): void {
    this.ds.sendApiRequest('deletePost', { post_id: postId }).subscribe({
      next: (response: { code?: number; message?: string } | null) => {
        if (response?.code === 200) {
          this.posts = this.posts.filter(post => post.post_id !== postId);
          this.filteredPosts = this.filteredPosts.filter(post => post.post_id !== postId);
          this.snackbar.open('Post deleted successfully', 'Close', { duration: 3000 });
          this.searchPosts(); // Reapply search filter
        } else {
          this.snackbar.open('Error deleting post: ' + (response?.message || 'Unknown error'), 'Close', { duration: 3000 });
        }
      },
      error: (err: HttpErrorResponse) => {
        this.handleError('Error deleting post', err);
      }
    });
  }

  private handleError(message: string, error: any): void {
    console.error(message, error);
    this.error = message;
    this.snackbar.open(message, 'Close', { duration: 3000 });
  }
}