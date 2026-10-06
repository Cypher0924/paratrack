import type { ConfigContext, ExpoConfig } from "expo/config";

// Extends app.json. The Android Maps key comes from GOOGLE_MAPS_ANDROID_API_KEY (EAS environment variable or the root .env) and is never committed.
export default ({ config }: ConfigContext): ExpoConfig => {
  const key = process.env.GOOGLE_MAPS_ANDROID_API_KEY;
  return {
    ...(config as ExpoConfig),
    plugins: [...(config.plugins ?? []), ["react-native-maps", { androidGoogleMapsApiKey: key }]],
    // Lets the app show a placeholder instead of a blank map. Only a flag, not the key.
    extra: { ...config.extra, hasMapsKey: !!key },
  };
};
