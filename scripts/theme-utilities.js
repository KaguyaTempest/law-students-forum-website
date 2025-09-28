
// Theme Utilities
// Helper functions to apply university themes to various elements across the site

import { getUniversityTheme, createUniversityBadge, createUniversityLogoBadge } from './university-themes.js';

// Apply university theme to any element with university data
export function applyThemeToElement(element, university, options = {}) {
  const {
    applyBackground = true,
    applyText = true,
    applyBorder = false,
    prefix = '',
    suffix = ''
  } = options;
  
  const theme = getUniversityTheme(university);
  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (applyBackground) {
    element.style.backgroundColor = theme.primary;
  }
  
  if (applyText) {
    element.style.color = theme.neutral;
  }
  
  if (applyBorder) {
    element.style.borderColor = theme.accent;
  }
  
  // Add university name if element is empty
  if (!element.textContent.trim() && university) {
    element.textContent = `${prefix}${university}${suffix}`;
  }
  
  return theme;
}

// Add university badge to any container
export function addUniversityBadgeToContainer(container, university) {
  if (!university || !container) return null;
  
  // Check if badge already exists
  const existingBadge = container.querySelector('.university-badge');
  if (existingBadge) {
    existingBadge.remove();
  }
  
  const badge = createUniversityBadge(university);
  container.appendChild(badge);
  
  return badge;
}

// Initialize theme system for dynamic content
export function initializeThemeSystem() {
  // Listen for dynamic content changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Auto-apply themes to elements with data-university attribute
          const elementsWithUniversity = node.querySelectorAll ? 
            node.querySelectorAll('[data-university]') : [];
          
          elementsWithUniversity.forEach((element) => {
            const university = element.getAttribute('data-university');
            if (university && !element.querySelector('.university-badge')) {
              addUniversityBadgeToContainer(element, university);
            }
          });
          
          // Also check the node itself
          if (node.hasAttribute && node.hasAttribute('data-university')) {
            const university = node.getAttribute('data-university');
            if (university && !node.querySelector('.university-badge')) {
              addUniversityBadgeToContainer(node, university);
            }
          }
        }
      });
    });
  });
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  return observer;
}

// Apply themes to existing content on page load
export function applyThemesToExistingContent() {
  // Find all elements with university data
  const elementsWithUniversity = document.querySelectorAll('[data-university]');
  
  elementsWithUniversity.forEach((element) => {
    const university = element.getAttribute('data-university');
    if (university) {
      // Add badge if it doesn't exist
      if (!element.querySelector('.university-badge')) {
        addUniversityBadgeToContainer(element, university);
      }
      
      // Apply theme to specific element types
      if (element.classList.contains('poem-card') || 
          element.classList.contains('article-card') ||
          element.classList.contains('comment-card')) {
        const theme = getUniversityTheme(university);
        // Subtle theme application - just accent border
        element.style.borderLeft = `4px solid ${theme.accent}`;
      }
    }
  });
}

// Theme-aware user profile badge
export function createThemedUserBadge(user, options = {}) {
  const { useLogoBadge = false, logoSize = '24px' } = options;
  
  const container = document.createElement('div');
  container.className = 'user-badges';
  
  // Role badge
  if (user.role) {
    const roleBadge = document.createElement('span');
    roleBadge.className = `user-badge role-${user.role}`;
    roleBadge.textContent = user.role === 'student' ? 'Law Student' : 
                           user.role === 'lawyer' ? 'Legal Practitioner' : 
                           user.role === 'observer' ? 'Observer' : 'Member';
    container.appendChild(roleBadge);
  }
  
  // University badge
  if (user.university) {
    const universityBadge = useLogoBadge ? 
      createUniversityLogoBadge(user.university, logoSize) :
      createUniversityBadge(user.university);
    container.appendChild(universityBadge);
  }
  
  return container;
}

// Add logo badge to any container with logo option
export function addUniversityLogoBadgeToContainer(container, university, size = '24px') {
  if (!university || !container) return null;
  
  // Check if badge already exists
  const existingBadge = container.querySelector('.university-logo-badge');
  if (existingBadge) {
    existingBadge.remove();
  }
  
  const badge = createUniversityLogoBadge(university, size);
  container.appendChild(badge);
  
  return badge;
}
