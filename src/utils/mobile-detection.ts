export const mobileDetection = {
  isMobile: () => {
    if (typeof window !== 'undefined') {
      const isMobileSize = window.innerWidth <= 768;
      
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      return isMobileSize || (isMobileDevice && isTouchDevice);
    }
    
    return false;
  },

  getDeviceInfo: () => {
    if (typeof window !== 'undefined') {
      return {
        isMobile: mobileDetection.isMobile(),
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        userAgent: navigator.userAgent,
        touchSupport: 'ontouchstart' in window
      };
    }
    
    return { isMobile: false };
  },

  shouldUseCompactMode: () => {
    return mobileDetection.isMobile() && window.innerWidth < 480;
  },

  shouldUseMobileLayout: () => {
    return mobileDetection.isMobile();
  }
};