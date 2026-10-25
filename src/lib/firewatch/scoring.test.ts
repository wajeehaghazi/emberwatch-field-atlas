import { describe, expect, it } from "vitest";
import { classify } from "./scoring";

describe("risk thresholds", () => {
  it("low below 0.35", () => { expect(classify(0.3499)).toBe("low"); expect(classify(0)).toBe("low"); });
  it("medium from 0.35 to below 0.55", () => { expect(classify(0.35)).toBe("medium"); expect(classify(0.5499)).toBe("medium"); });
  it("high from 0.55 to below 0.75", () => { expect(classify(0.55)).toBe("high"); expect(classify(0.7499)).toBe("high"); });
  it("critical from 0.75", () => { expect(classify(0.75)).toBe("critical"); expect(classify(1)).toBe("critical"); });
});
