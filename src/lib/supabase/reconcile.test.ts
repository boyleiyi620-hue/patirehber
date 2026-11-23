import { describe, expect, it } from "vitest";
import { idsToDelete } from "./reconcile";

describe("idsToDelete", () => {
  it("keeps every id present in the successful snapshot", () => {
    expect(idsToDelete(["a", "b", "c"], ["b", "c", "new"])).toEqual(["a"]);
  });

  it("treats an explicitly empty snapshot as a request to remove all remote ids", () => {
    expect(idsToDelete(["a", "b"], [])).toEqual(["a", "b"]);
  });

  it("does not produce duplicate delete ids", () => {
    expect(idsToDelete(["a", "a", "b"], ["b"])).toEqual(["a"]);
  });
});
