module.exports = {
  reactStrictMode: true,
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
    "@rn-primitives/slot",
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
