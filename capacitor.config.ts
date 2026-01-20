import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.waketube.app',
  appName: 'WakeTube',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;