// Modal component for forms and confirmations
export class Modal {
    constructor(modalId) {
        this.modal = document.getElementById(modalId);
        this.isOpen = false;
        this.init();
    }

    init() {
        if (!this.modal) return;

        // Close modal handlers
        const closeBtn = this.modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Close on backdrop click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    open() {
        if (!this.modal) return;
        
        this.modal.classList.add('active');
        this.isOpen = true;
        document.body.style.overflow = 'hidden';
        
        // Focus first input
        const firstInput = this.modal.querySelector('input, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }

    close() {
        if (!this.modal) return;
        
        this.modal.classList.remove('active');
        this.isOpen = false;
        document.body.style.overflow = '';
        
        // Clear form if it exists
        const form = this.modal.querySelector('form');
        if (form) {
            form.reset();
        }
    }

    // Set modal title
    setTitle(title) {
        const titleElement = this.modal.querySelector('.modal-header h3');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }

    // Get form data
    getFormData() {
        const form = this.modal.querySelector('form');
        if (!form) return null;

        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }

    // Set form data
    setFormData(data) {
        const form = this.modal.querySelector('form');
        if (!form) return;

        Object.keys(data).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                input.value = data[key];
            }
        });
    }
}

// Toast notification component
export class Toast {
    constructor(containerId = 'toastContainer') {
        this.container = document.getElementById(containerId);
        this.toasts = new Map();
    }

    show(message, type = 'info', title = '', duration = 5000) {
        const toastId = Date.now().toString();
        const toast = this.createToast(toastId, message, type, title);
        
        this.container.appendChild(toast);
        this.toasts.set(toastId, toast);
        
        // Show animation
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Auto remove
        setTimeout(() => this.remove(toastId), duration);
        
        return toastId;
    }

    createToast(id, message, type, title) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.dataset.toastId = id;
        
        const iconMap = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="toast-icon ${iconMap[type] || iconMap.info}"></i>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="toast.remove('${id}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        return toast;
    }

    remove(toastId) {
        const toast = this.toasts.get(toastId);
        if (!toast) return;
        
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            this.toasts.delete(toastId);
        }, 300);
    }

    success(message, title = 'Успешно') {
        return this.show(message, 'success', title);
    }

    error(message, title = 'Ошибка') {
        return this.show(message, 'error', title);
    }

    warning(message, title = 'Предупреждение') {
        return this.show(message, 'warning', title);
    }

    info(message, title = 'Информация') {
        return this.show(message, 'info', title);
    }
}

// Global toast instance
export const toast = new Toast();
