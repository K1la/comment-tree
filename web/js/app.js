// Main application class
import { ApiClient } from './api-client.js';
import { CommentTree } from './comment-model.js';
import { CommentRenderer } from './comment-renderer.js';
import { Modal, toast } from './modal.js';

export class CommentApp {
    constructor() {
        this.apiClient = new ApiClient();
        this.commentTree = new CommentTree();
        this.renderer = null;
        this.currentOffset = 0;
        this.pageSize = 10;
        this.currentSort = 'created_at_desc';
        this.currentSearch = '';
        this.isLoading = false;
        this.hasMore = true;
        
        // Modals
        this.addCommentModal = null;
        this.deleteModal = null;
        
        // Elements
        this.commentsContainer = null;
        this.searchInput = null;
        this.searchBtn = null;
        this.sortSelect = null;
        this.addCommentBtn = null;
        this.pagination = null;
        this.prevPageBtn = null;
        this.nextPageBtn = null;
        this.paginationInfo = null;
    }

    async init() {
        try {
            this.initializeElements();
            this.initializeModals();
            this.initializeEventListeners();
            this.initializeRenderer();
            
            // Load initial comments
            await this.loadComments();
            
            toast.success('Приложение загружено успешно!');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            toast.error('Ошибка инициализации приложения');
        }
    }

    initializeElements() {
        this.commentsContainer = document.getElementById('commentsContainer');
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.showAllBtn = document.getElementById('showAllBtn');
        this.sortSelect = document.getElementById('sortSelect');
        this.addCommentBtn = document.getElementById('addCommentBtn');
        this.pagination = document.getElementById('pagination');
        this.prevPageBtn = document.getElementById('prevPageBtn');
        this.nextPageBtn = document.getElementById('nextPageBtn');
        this.paginationInfo = document.getElementById('paginationInfo');
    }

    initializeModals() {
        this.addCommentModal = new Modal('addCommentModal');
        this.deleteModal = new Modal('deleteModal');
    }

    initializeEventListeners() {
        // Search
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });

        // Show all
        if (this.showAllBtn) {
            this.showAllBtn.addEventListener('click', () => this.handleShowAll());
        }

        // Sort
        this.sortSelect.addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.loadComments();
        });

        // Add comment
        this.addCommentBtn.addEventListener('click', () => this.openAddCommentModal());

        // Pagination
        this.prevPageBtn.addEventListener('click', () => this.previousPage());
        this.nextPageBtn.addEventListener('click', () => this.nextPage());

        // Comment form
        const commentForm = document.getElementById('commentForm');
        commentForm.addEventListener('submit', (e) => this.handleCommentSubmit(e));

        // Modal close buttons
        document.getElementById('closeModalBtn').addEventListener('click', () => this.addCommentModal.close());
        document.getElementById('cancelBtn').addEventListener('click', () => this.addCommentModal.close());
        document.getElementById('closeDeleteModalBtn').addEventListener('click', () => this.deleteModal.close());
        document.getElementById('cancelDeleteBtn').addEventListener('click', () => this.deleteModal.close());
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => this.handleDeleteConfirm());
    }

    initializeRenderer() {
        this.renderer = new CommentRenderer(this.commentsContainer);
        
        // Override event handlers
        this.renderer.onReplyClick = (commentId) => this.openAddCommentModal(commentId);
        this.renderer.onDeleteClick = (commentId) => this.openDeleteModal(commentId);
    }

    async loadComments() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.renderer.renderLoading();

        try {
            const params = {
                offset: this.currentOffset,
                limit: this.pageSize,
                sort: this.currentSort
            };

            if (this.currentSearch) {
                params.search = this.currentSearch;
            }

            const comments = await this.apiClient.getComments(params);
            
            if (comments && Array.isArray(comments)) {
                // For offset-based pagination, we need to handle loading more comments
                if (this.currentOffset === 0) {
                    // First load - replace all comments
                    this.commentTree = new CommentTree(comments);
                } else {
                    // Load more - append to existing tree
                    comments.forEach(comment => this.commentTree.addComment(comment));
                }
                
                this.hasMore = comments.length === this.pageSize;
                this.renderer.renderCommentTree(this.commentTree);
                this.renderer.updateCommentsCount(this.commentTree.getCommentsCount());
                this.updatePagination();
            } else {
                this.commentTree = new CommentTree();
                this.renderer.renderCommentTree(this.commentTree);
                this.renderer.updateCommentsCount(0);
                this.hasMore = false;
                this.hidePagination();
            }
        } catch (error) {
            console.error('Failed to load comments:', error);
            this.renderer.renderError('Не удалось загрузить комментарии. Проверьте подключение к серверу.');
            toast.error('Ошибка загрузки комментариев');
        } finally {
            this.isLoading = false;
        }
    }

    async handleSearch() {
        this.currentSearch = this.searchInput.value.trim();
        this.currentOffset = 0;
        await this.loadComments();
    }

    async handleShowAll() {
        this.currentSearch = '';
        if (this.searchInput) this.searchInput.value = '';
        this.currentOffset = 0;
        await this.loadComments();
    }

    async handleCommentSubmit(e) {
        e.preventDefault();
        
        const formData = this.addCommentModal.getFormData();
        const parentId = document.getElementById('parentId').value;
        
        const commentData = {
            content: formData.commentText,
            parent_id: parentId || null
        };

        try {
            const response = await this.apiClient.createComment(commentData);
            
            if (response) {
                this.commentTree.addComment(response);
                this.renderer.renderCommentTree(this.commentTree);
                this.renderer.updateCommentsCount(this.commentTree.getCommentsCount());
                
                this.addCommentModal.close();
                toast.success('Комментарий добавлен успешно!');
                
                // Scroll to new comment
                setTimeout(() => {
                    const newComment = document.querySelector(`[data-comment-id="${response.id}"]`);
                    if (newComment) {
                        newComment.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 100);
            }
        } catch (error) {
            console.error('Failed to create comment:', error);
            toast.error('Ошибка при создании комментария');
        }
    }

    async handleDeleteConfirm() {
        const commentId = this.deleteModal.modal.dataset.commentId;
        if (!commentId) return;

        try {
            await this.apiClient.deleteComment(commentId);
            
            this.commentTree.removeComment(commentId);
            this.renderer.removeCommentFromTree(commentId);
            this.renderer.updateCommentsCount(this.commentTree.getCommentsCount());
            
            this.deleteModal.close();
            toast.success('Комментарий удален успешно!');
        } catch (error) {
            console.error('Failed to delete comment:', error);
            toast.error('Ошибка при удалении комментария');
        }
    }

    openAddCommentModal(parentId = null) {
        this.addCommentModal.setTitle(parentId ? 'Ответить на комментарий' : 'Новый комментарий');
        document.getElementById('parentId').value = parentId || '';
        this.addCommentModal.open();
    }

    openDeleteModal(commentId) {
        this.deleteModal.modal.dataset.commentId = commentId;
        this.deleteModal.open();
    }

    previousPage() {
        if (this.currentOffset > 0) {
            this.currentOffset = Math.max(0, this.currentOffset - this.pageSize);
            this.loadComments();
        }
    }

    nextPage() {
        if (this.hasMore) {
            this.currentOffset += this.pageSize;
            this.loadComments();
        }
    }

    updatePagination() {
        this.pagination.style.display = 'flex';
        this.prevPageBtn.disabled = this.currentOffset === 0;
        this.nextPageBtn.disabled = !this.hasMore;
        
        const currentPage = Math.floor(this.currentOffset / this.pageSize) + 1;
        this.paginationInfo.textContent = 
            `Страница ${currentPage} (${this.commentTree.getCommentsCount()} комментариев)`;
    }

    hidePagination() {
        this.pagination.style.display = 'none';
    }
}
