import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.edu.college.kalyani',
  appName: 'SPECTRA',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Keep the Firebase Auth / Google OAuth redirect flow INSIDE the app's
    // WebView so it returns to the app instead of leaking into an external
    // browser where https://localhost does not exist.
    allowNavigation: [
      'kalyani-e2179.firebaseapp.com',
      '*.firebaseapp.com',
      'accounts.google.com',
      '*.google.com',
      'myaccount.google.com',
      'ssl.gstatic.com',
      'www.gstatic.com'
    ]
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_launcher',
      iconColor: '#F43F5E',
    },
  },
};

export default config;
