// Basic hardening. No full CSP: Google Maps, Supabase and Reanimated need inline styles and several origins.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=(), payment=()" },
];

module.exports = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  compiler: {
    // RN libraries read the global __DEV__
    define: { __DEV__: "process.env.NODE_ENV !== 'production'" },
  },
  transpilePackages: [
    "@repo/ui",
    "nativewind",
    "react-native-css-interop",
    "react-native-reanimated",
    "react-native-worklets",
    "react-native-svg",
    "phosphor-react-native",
  ],
  turbopack: {
    resolveAlias: {
      "react-native": "react-native-web",
      // nativewind try/requires this; its native entry breaks the web build
      "react-native-safe-area-context": "./stubs/empty.js",
    },
    resolveExtensions: [
      ".web.js",
      ".web.jsx",
      ".web.ts",
      ".web.tsx",
      ".js",
      ".jsx",
      ".ts",
      ".tsx",
      ".json",
    ],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // Transform all direct `react-native` imports to `react-native-web`
      "react-native$": "react-native-web",
      "react-native-safe-area-context$": require("path").resolve(__dirname, "stubs/empty.js"),
    };
    config.resolve.extensions = [
      ".web.js",
      ".web.jsx",
      ".web.ts",
      ".web.tsx",
      ...config.resolve.extensions,
    ];
    return config;
  },
};
