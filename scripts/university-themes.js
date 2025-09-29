
// University Theme System
// Maps university codes/names to their official brand colors

export const universityThemes = {
  'UZ': { 
    primary: '#003366', 
    accent: '#FFD700', 
    neutral: '#CCCCCC',
    name: 'University of Zimbabwe',
    logo: 'assets/universities/uz-logo.png'
  },
  'MSU': { 
    primary: '#FFD700', 
    accent: '#87CEEB', 
    neutral: '#333333',
    name: 'Midlands State University',
    logo: 'assets/universities/msu-logo.png'
  },
  'GZU': { 
    primary: '#800000', 
    accent: '#FFC0CB', 
    neutral: '#FFFFFF',
    name: 'Great Zimbabwe University',
    logo: 'assets/universities/gzu-logo.png'
  },
  'ZEGU': { 
    primary: '#4B0082', 
    accent: '#FFDAB9', 
    neutral: '#F5F5F5',
    name: 'Zimbabwe Ezekiel Guti University',
    logo: 'assets/universities/zegu-logo.png'
  },
  'AU': { 
    primary: '#006400', 
    accent: '#ADFF2F', 
    neutral: '#FFFFFF',
    name: 'Africa University',
    logo: 'assets/universities/au-logo.png'
  },
  'EM': { 
    primary: '#2F4F4F', 
    accent: '#FFA500', 
    neutral: '#E0E0E0',
    name: 'Eyaas Mthunzi University'
  },
  // Full university names for backwards compatibility
  'University of Zimbabwe': { 
    primary: '#003366', 
    accent: '#FFD700', 
    neutral: '#CCCCCC',
    name: 'University of Zimbabwe',
    logo: 'assets/universities/uz-logo.png'
  },
  'Midlands State University': { 
    primary: '#FFD700', 
    accent: '#87CEEB', 
    neutral: '#333333',
    name: 'Midlands State University',
    logo: 'assets/universities/msu-logo.png'
  },
  'Great Zimbabwe University': { 
    primary: '#800000', 
    accent: '#FFC0CB', 
    neutral: '#FFFFFF',
    name: 'Great Zimbabwe University',
    logo: 'assets/universities/gzu-logo.png'
  },
  'Zimbabwe Ezekiel Guti University': { 
    primary: '#4B0082', 
    accent: '#FFDAB9', 
    neutral: '#F5F5F5',
    name: 'Zimbabwe Ezekiel Guti University',
    logo: 'assets/universities/zegu-logo.png'
  },
  'Africa University': { 
    primary: '#006400', 
    accent: '#ADFF2F', 
    neutral: '#FFFFFF',
    name: 'Africa University',
    logo: 'assets/universities/au-logo.png'
  }
};

// Default theme for unknown universities
export const defaultTheme = {
  primary: '#555555',
  accent: '#eeeeee',
  neutral: '#000000',
  name: 'Unknown University'
};

// Get theme for a university
export function getUniversityTheme(university) {
  if (!university) return defaultTheme;
  
  // Try exact match first
  if (universityThemes[university]) {
    return universityThemes[university];
  }
  
  // Try partial match for flexibility
  const universityLower = university.toLowerCase();
  for (const [key, theme] of Object.entries(universityThemes)) {
    if (key.toLowerCase().includes(universityLower) || 
        universityLower.includes(key.toLowerCase())) {
      return theme;
    }
  }
  
  return defaultTheme;
}

// Apply theme to an element
export function applyUniversityTheme(element, university, isDarkMode = false) {
  const theme = getUniversityTheme(university);
  
  if (isDarkMode) {
    // Adjust colors for dark mode
    element.style.backgroundColor = theme.primary;
    element.style.color = theme.neutral;
    element.style.borderColor = theme.accent;
  } else {
    element.style.backgroundColor = theme.primary;
    element.style.color = theme.neutral;
    element.style.borderColor = theme.accent;
  }
  
  return theme;
}

// Create a university badge element
export function createUniversityBadge(university, isDarkMode = false, showLogo = true) {
  const badge = document.createElement('span');
  badge.className = 'university-badge';
  
  const theme = getUniversityTheme(university);
  
  // Create badge content
  if (showLogo && theme.logo) {
    const logoImg = document.createElement('img');
    logoImg.src = theme.logo;
    logoImg.alt = `${theme.name} logo`;
    logoImg.className = 'university-logo';
    logoImg.style.width = '16px';
    logoImg.style.height = '16px';
    logoImg.style.marginRight = '6px';
    logoImg.style.verticalAlign = 'middle';
    logoImg.style.borderRadius = '2px';
    
    badge.appendChild(logoImg);
    
    const textSpan = document.createElement('span');
    textSpan.textContent = university || theme.name;
    badge.appendChild(textSpan);
  } else {
    badge.textContent = university || theme.name;
  }
  
  // Apply theme colors
  badge.style.backgroundColor = theme.primary;
  badge.style.color = theme.neutral;
  badge.style.border = `1px solid ${theme.accent}`;
  badge.style.display = 'inline-flex';
  badge.style.alignItems = 'center';
  
  if (isDarkMode) {
    badge.style.boxShadow = `0 1px 3px rgba(255,255,255,0.1)`;
  } else {
    badge.style.boxShadow = `0 1px 3px rgba(0,0,0,0.1)`;
  }
  
  return badge;
}

// Create a logo-only university badge (for compact spaces)
export function createUniversityLogoBadge(university, size = '24px') {
  const theme = getUniversityTheme(university);
  
  if (!theme.logo) {
    // Fallback to text badge if no logo
    return createUniversityBadge(university, false, false);
  }
  
  const logoContainer = document.createElement('span');
  logoContainer.className = 'university-logo-badge';
  logoContainer.title = theme.name; // Tooltip
  
  const logoImg = document.createElement('img');
  logoImg.src = theme.logo;
  logoImg.alt = `${theme.name} logo`;
  logoImg.style.width = size;
  logoImg.style.height = size;
  logoImg.style.borderRadius = '4px';
  logoImg.style.border = `2px solid ${theme.accent}`;
  logoImg.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
  logoImg.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
  
  // Hover effects
  logoImg.addEventListener('mouseenter', () => {
    logoImg.style.transform = 'scale(1.1)';
    logoImg.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
  });
  
  logoImg.addEventListener('mouseleave', () => {
    logoImg.style.transform = 'scale(1)';
    logoImg.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
  });
  
  logoContainer.appendChild(logoImg);
  return logoContainer;
}
