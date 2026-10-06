// Platform-neutral fallback so tsc resolves. Bundlers pick push.web.ts or push.native.ts first.
export * from "./push.web";
