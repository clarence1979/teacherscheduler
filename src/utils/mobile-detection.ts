// Mobile device detection and optimization utilities
export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  orientation: 'portrait' | 'landscape';
  platform: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';
}

export class MobileDetection {
  private static instance: MobileDetection;
  private deviceInfo: DeviceInfo;
  private listeners: Set<(deviceInfo: DeviceInfo) => void> = new Set();

  constructor() {
    this.deviceInfo = this.detectDevice();
    this.setupEventListeners();
  }

  static getInstance(): MobileDetection {
    if (!MobileDetection.instance) {
      MobileDetection.instance = new MobileDetection();
    }
    return MobileDetection.instance;
  }

  private detectDevice(): DeviceInfo {
    const userAgent = navigator.userAgent.toLowerCase();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Detect mobile devices
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) ||
                    screenWidth <= 768;

    // Detect tablets
    const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent) ||
                    (screenWidth > 768 && screenWidth <= 1024);

    // Detect touch capability
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Determine screen size
    let screenSize: DeviceInfo['screenSize'] = 'lg';
    if (screenWidth < 480) screenSize = 'xs';
    else if (screenWidth < 768) screenSize = 'sm';
    else if (screenWidth < 1024) screenSize = 'md';
    else if (screenWidth < 1280) screenSize = 'lg';
    else screenSize = 'xl';

    // Determine orientation
    const orientation: DeviceInfo['orientation'] = screenWidth > screenHeight ? 'landscape' : 'portrait';

    // Detect platform
    let platform: DeviceInfo['platform'] = 'unknown';
    if (/iphone|ipad|ipod/i.test(userAgent)) platform = 'ios';
    else if (/android/i.test(userAgent)) platform = 'android';
    else if (/windows/i.test(userAgent)) platform = 'windows';
    else if (/mac/i.test(userAgent)) platform = 'macos';
    else if (/linux/i.test(userAgent)) platform = 'linux';

    return {
      isMobile,
      isTablet,
      isDesktop: !isMobile && !isTablet,
      isTouchDevice,
      screenSize,
      orientation,
      platform
    };
  }

  private setupEventListeners(): void {
    // Listen for orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.updateDeviceInfo();
      }, 100);
    });

    // Listen for resize events
    window.addEventListener('resize', () => {
      this.updateDeviceInfo();
    });
  }

  private updateDeviceInfo(): void {
    const newDeviceInfo = this.detectDevice();
    const hasChanged = JSON.stringify(newDeviceInfo) !== JSON.stringify(this.deviceInfo);
    
    if (hasChanged) {
      this.deviceInfo = newDeviceInfo;
      this.notifyListeners();
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.deviceInfo));
  }

  // Public methods
  getDeviceInfo(): DeviceInfo {
    return { ...this.deviceInfo };
  }

  isMobile(): boolean {
    return this.deviceInfo.isMobile;
  }

  isTablet(): boolean {
    return this.deviceInfo.isTablet;
  }

  isDesktop(): boolean {
    return this.deviceInfo.isDesktop;
  }

  isTouchDevice(): boolean {
    return this.deviceInfo.isTouchDevice;
  }

  getScreenSize(): DeviceInfo['screenSize'] {
    return this.deviceInfo.screenSize;
  }

  getOrientation(): DeviceInfo['orientation'] {
    return this.deviceInfo.orientation;
  }

  getPlatform(): DeviceInfo['platform'] {
    return this.deviceInfo.platform;
  }

  // Subscribe to device changes
  onChange(callback: (deviceInfo: DeviceInfo) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Utility methods for responsive behavior
  shouldUseMobileLayout(): boolean {
    return this.deviceInfo.isMobile || this.deviceInfo.screenSize === 'xs' || this.deviceInfo.screenSize === 'sm';
  }

  shouldUseCompactMode(): boolean {
    return this.deviceInfo.isMobile && this.deviceInfo.orientation === 'portrait';
  }

  getOptimalModalSize(): 'sm' | 'md' | 'lg' | 'xl' | 'full' {
    if (this.deviceInfo.screenSize === 'xs') return 'full';
    if (this.deviceInfo.screenSize === 'sm') return 'lg';
    if (this.deviceInfo.screenSize === 'md') return 'xl';
    return 'xl';
  }

  getOptimalGridColumns(): number {
    switch (this.deviceInfo.screenSize) {
      case 'xs': return 1;
      case 'sm': return 1;
      case 'md': return 2;
      case 'lg': return 3;
      case 'xl': return 4;
      default: return 3;
    }
  }
}

export const mobileDetection = MobileDetection.getInstance();