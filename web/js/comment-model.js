// Comment model and utilities
export class Comment {
    constructor(data) {
        this.id = data.id;
        this.content = data.content; // Changed from 'text' to 'content'
        this.parentId = data.parent_id || null;
        this.createdAt = new Date(data.created_at);
        this.updatedAt = data.updated_at ? new Date(data.updated_at) : null;
        this.children = data.children || [];
        this.repliesCount = data.replies_count || 0;
    }

    // Format date for display
    getFormattedDate() {
        const now = new Date();
        const diff = now - this.createdAt;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'только что';
        if (minutes < 60) return `${minutes} мин. назад`;
        if (hours < 24) return `${hours} ч. назад`;
        if (days < 7) return `${days} дн. назад`;
        
        return this.createdAt.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            year: this.createdAt.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }

    // Check if comment has children
    hasChildren() {
        return this.children && this.children.length > 0;
    }

    // Get nested level (for visual indentation)
    getLevel() {
        return this.parentId ? 1 : 0; // Simplified - in real app you'd calculate actual depth
    }

    // Convert to API format
    toApiFormat() {
        return {
            content: this.content,
            parent_id: this.parentId
        };
    }
}

// Comment tree utilities
export class CommentTree {
    constructor(comments = []) {
        this.comments = comments.map(comment => new Comment(comment));
        this.tree = this.buildTree();
    }

    // Build hierarchical tree structure
    buildTree() {
        const commentMap = new Map();
        const rootComments = [];

        // Create comment objects and map them
        this.comments.forEach(commentData => {
            const comment = new Comment(commentData);
            commentMap.set(comment.id, comment);
        });

        // Build tree structure
        this.comments.forEach(commentData => {
            const comment = commentMap.get(commentData.id);
            
            if (comment.parentId) {
                const parent = commentMap.get(comment.parentId);
                if (parent) {
                    if (!parent.children) parent.children = [];
                    parent.children.push(comment);
                }
            } else {
                rootComments.push(comment);
            }
        });

        return rootComments;
    }

    // Get all comments as flat array
    getAllComments() {
        const result = [];
        
        const traverse = (comments) => {
            comments.forEach(comment => {
                result.push(comment);
                if (comment.children) {
                    traverse(comment.children);
                }
            });
        };

        traverse(this.tree);
        return result;
    }

    // Get comment by ID
    getCommentById(id) {
        const allComments = this.getAllComments();
        return allComments.find(comment => comment.id === id);
    }

    // Get comments count
    getCommentsCount() {
        return this.getAllComments().length;
    }

    // Add new comment to tree
    addComment(commentData) {
        const comment = new Comment(commentData);
        this.comments.push(comment);
        
        if (comment.parentId) {
            const parent = this.getCommentById(comment.parentId);
            if (parent) {
                if (!parent.children) parent.children = [];
                parent.children.push(comment);
            }
        } else {
            this.tree.push(comment);
        }
    }

    // Remove comment from tree
    removeComment(id) {
        const comment = this.getCommentById(id);
        if (!comment) return false;

        // Remove from comments array
        this.comments = this.comments.filter(c => c.id !== id);

        // Remove from tree structure
        if (comment.parentId) {
            const parent = this.getCommentById(comment.parentId);
            if (parent && parent.children) {
                parent.children = parent.children.filter(c => c.id !== id);
            }
        } else {
            this.tree = this.tree.filter(c => c.id !== id);
        }

        return true;
    }

    // Sort comments
    sortComments(sortBy = 'created_desc') {
        const sortFunction = (a, b) => {
            switch (sortBy) {
                case 'created_asc':
                    return a.createdAt - b.createdAt;
                case 'created_desc':
                    return b.createdAt - a.createdAt;
                case 'replies_asc':
                    return a.repliesCount - b.repliesCount;
                case 'replies_desc':
                    return b.repliesCount - a.repliesCount;
                default:
                    return b.createdAt - a.createdAt;
            }
        };

        const sortRecursive = (comments) => {
            comments.sort(sortFunction);
            comments.forEach(comment => {
                if (comment.children) {
                    sortRecursive(comment.children);
                }
            });
        };

        sortRecursive(this.tree);
    }
}
