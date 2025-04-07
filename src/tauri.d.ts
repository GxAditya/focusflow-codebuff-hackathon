// Type declarations for Tauri
interface Window {
  __TAURI__?: {
    // Add any specific Tauri properties you need
    [key: string]: any;
  };
} 