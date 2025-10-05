// API Client for CommentTree service
export class ApiClient {
    constructor(baseUrl = 'http://localhost:8080') {
        this.baseUrl = baseUrl;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            // Handle empty responses
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return null;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Create a new comment
    async createComment(commentData) {
        const response = await this.request('/api/comments', {
            method: 'POST',
            body: JSON.stringify(commentData)
        });
        return response.result; // Extract result from wrapper
    }

    // Get comments with optional parent filter and pagination
    async getComments(params = {}) {
        const queryParams = new URLSearchParams();
        
        if (params.parent !== undefined && params.parent !== null) {
            queryParams.append('parent', params.parent);
        }
        if (params.limit) {
            queryParams.append('limit', params.limit);
        }
        if (params.offset !== undefined) {
            queryParams.append('offset', params.offset);
        }
        if (params.sort) {
            queryParams.append('sort', params.sort);
        }
        if (params.search) {
            queryParams.append('search', params.search);
        }

        const endpoint = queryParams.toString() ? `/api/comments?${queryParams}` : '/api/comments';
        const response = await this.request(endpoint);
        return response.result; // Extract result from wrapper
    }

    // Get comments by parent ID (for specific comment thread)
    async getCommentsByParentId(parentId) {
        const response = await this.request(`/api/comments/${parentId}`);
        return response.result; // Extract result from wrapper
    }

    // Delete a comment by ID
    async deleteComment(id) {
        const response = await this.request(`/api/comments/${id}`, {
            method: 'DELETE'
        });
        return response.result; // Extract result from wrapper
    }

    // Search comments
    async searchComments(query, params = {}) {
        return this.getComments({
            search: query,
            ...params
        });
    }
}
