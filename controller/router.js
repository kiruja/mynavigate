// Client-side router
class Router {
    constructor(routes) {
        this.routes = routes;
        this.contentDiv = document.getElementById('content');
        
        // Handle browser back/forward buttons
        window.addEventListener('popstate', () => this.handleRoute(window.location.pathname));
        
        // Handle initial route
        this.handleRoute(window.location.pathname);
        
        // Add click event listeners to all nav links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.getAttribute('href').startsWith('/')) {
                e.preventDefault();
                this.navigateTo(link.getAttribute('href'));
            }
        });
    }

    async loadContent(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const content = await response.text();
            
            // Create a temporary container
            const temp = document.createElement('div');
            temp.innerHTML = content;
            
            // Extract the main content
            const mainContent = temp.querySelector('main.main-content');
            return mainContent ? mainContent.innerHTML : 'Content not found';
        } catch (error) {
            console.error('Error loading content:', error);
            return 'Error loading content';
        }
    }

    async handleRoute(pathname) {
        // Default to home if pathname is root
        if (pathname === '/') {
            this.contentDiv.innerHTML = '<h2>Welcome to Navigate</h2><p>Select an option from the menu to get started.</p>';
            return;
        }

        const route = this.routes[pathname];
        if (route) {
            const content = await this.loadContent(route);
            this.contentDiv.innerHTML = content;
        } else {
            this.contentDiv.innerHTML = '<h2>404 - Page Not Found</h2>';
        }
    }

    navigateTo(pathname) {
        window.history.pushState({}, '', pathname);
        this.handleRoute(pathname);
    }
}