import { describe, expect, it } from "vitest";
import { parsePhMobile } from "./phone";

describe("parsePhMobile", () => {
  it.each(["0917 482 1093", "917-482-1093", "+63 917 482 1093", "639174821093"])("normalizes %s", (s) =>
    expect(parsePhMobile(s)).toBe("+639174821093"),
  );
  it.each(["0817 482 1093", "0917 482 109", "hello", ""])("rejects %j", (s) => expect(parsePhMobile(s)).toBeNull());
});
