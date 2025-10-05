// UI Components for rendering comments
export class CommentRenderer {
    constructor(container) {
        this.container = container;
    }

    // Render comment tree
    renderCommentTree(commentTree) {
        this.container.innerHTML = '';
        
        if (!commentTree.tree || commentTree.tree.length === 0) {
            this.renderEmptyState();
            return;
        }

        const treeElement = document.createElement('ul');
        treeElement.className = 'comment-tree';
        
        commentTree.tree.forEach(comment => {
            const commentElement = this.renderComment(comment, 0);
            treeElement.appendChild(commentElement);
        });

        this.container.appendChild(treeElement);
    }

    // Render single comment with children
    renderComment(comment, level = 0) {
        const li = document.createElement('li');
        li.className = 'comment-item';
        li.dataset.commentId = comment.id;

        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment';
        
        // Comment header
        const header = document.createElement('div');
        header.className = 'comment-header';
        
        const date = document.createElement('span');
        date.className = 'comment-date';
        date.textContent = comment.getFormattedDate();
        
        header.appendChild(date);
        
        // Comment content
        const content = document.createElement('div');
        content.className = 'comment-content';
        content.textContent = comment.content;
        
        // Comment actions
        const actions = document.createElement('div');
        actions.className = 'comment-actions';
        
        const replyBtn = document.createElement('button');
        replyBtn.className = 'comment-action reply';
        replyBtn.innerHTML = '<i class="fas fa-reply"></i> Ответить';
        replyBtn.addEventListener('click', () => this.onReplyClick(comment.id));
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'comment-action delete';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Удалить';
        deleteBtn.addEventListener('click', () => this.onDeleteClick(comment.id));
        
        actions.appendChild(replyBtn);
        actions.appendChild(deleteBtn);
        
        commentDiv.appendChild(header);
        commentDiv.appendChild(content);
        commentDiv.appendChild(actions);
        
        li.appendChild(commentDiv);
        
        // Render children if they exist
        if (comment.children && comment.children.length > 0) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'comment-children';
            
            comment.children.forEach(child => {
                const childElement = this.renderComment(child, level + 1);
                childrenContainer.appendChild(childElement);
            });
            
            li.appendChild(childrenContainer);
        }
        
        return li;
    }

    // Render empty state
    renderEmptyState() {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <i class="fas fa-comments"></i>
            <h3>Пока нет комментариев</h3>
            <p>Будьте первым, кто оставит комментарий!</p>
        `;
        this.container.appendChild(emptyState);
    }

    // Render loading state
    renderLoading() {
        this.container.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                Загрузка комментариев...
            </div>
        `;
    }

    // Render error state
    renderError(message) {
        this.container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Ошибка загрузки</h3>
                <p>${message}</p>
            </div>
        `;
    }

    // Add new comment to tree
    addCommentToTree(comment) {
        const commentElement = this.renderComment(comment);
        const treeElement = this.container.querySelector('.comment-tree');
        
        if (treeElement) {
            treeElement.appendChild(commentElement);
        } else {
            // If no tree exists, create one
            this.renderCommentTree({ tree: [comment] });
        }
    }

    // Remove comment from tree
    removeCommentFromTree(commentId) {
        const commentElement = this.container.querySelector(`[data-comment-id="${commentId}"]`);
        if (commentElement) {
            commentElement.remove();
        }
    }

    // Update comment count
    updateCommentsCount(count) {
        const countElement = document.getElementById('commentsCount');
        if (countElement) {
            countElement.textContent = `${count} комментари${this.getPluralForm(count)}`;
        }
    }

    // Get correct plural form for Russian
    getPluralForm(count) {
        if (count % 10 === 1 && count % 100 !== 11) {
            return 'й';
        } else if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
            return 'я';
        } else {
            return 'ев';
        }
    }

    // Event handlers (to be overridden by parent component)
    onReplyClick(commentId) {
        // Override in parent component
    }

    onDeleteClick(commentId) {
        // Override in parent component
    }
}
