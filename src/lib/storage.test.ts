import { describe, expect, it } from "vitest";
import { normalizeData } from "./storage";
import { guideChecklistEntryId } from "./utils";

describe("guide checklist persistence", () => {
  it("keeps completion entries and normalizes their stable identity", () => {
    const data = normalizeData({
      cats: [
        { id: "cat-a", name: "Mırmır" },
        { id: "cat-b", name: "Pamuk" },
      ],
      guideChecklistEntries: [
        {
          id: "stale-id",
          catId: "cat-a",
          date: "2026-11-23",
          sectionId: "nutrition-portion",
          itemId: "block-0-item-1",
        },
        {
          catId: "cat-b",
          date: "2026-11-23",
          sectionId: "nutrition-portion",
          itemId: "block-0-item-1",
        },
        {
          catId: "cat-a",
          date: "2026-11-22",
          sectionId: "nutrition-portion",
          itemId: "block-0-item-1",
        },
        {
          catId: "missing-cat",
          date: "2026-11-23",
          sectionId: "nutrition-portion",
          itemId: "block-0-item-1",
        },
      ],
    });

    expect(data?.guideChecklistEntries).toHaveLength(3);
    expect(data?.guideChecklistEntries[0]).toEqual({
      id: guideChecklistEntryId("cat-a", "2026-11-23", "nutrition-portion", "block-0-item-1"),
      catId: "cat-a",
      date: "2026-11-23",
      sectionId: "nutrition-portion",
      itemId: "block-0-item-1",
    });
    expect(data?.guideChecklistEntries[0].id).not.toBe(data?.guideChecklistEntries[1].id);
    expect(data?.guideChecklistEntries[0].id).not.toBe(data?.guideChecklistEntries[2].id);
  });

  it("defaults missing entries for older saved data and drops impossible dates", () => {
    const oldData = normalizeData({ cats: [{ id: "cat-a", name: "Mırmır" }] });
    const invalidDateData = normalizeData({
      cats: [{ id: "cat-a", name: "Mırmır" }],
      guideChecklistEntries: [
        {
          catId: "cat-a",
          date: "2026-02-31",
          sectionId: "care",
          itemId: "item-1",
        },
      ],
    });

    expect(oldData?.guideChecklistEntries).toEqual([]);
    expect(invalidDateData?.guideChecklistEntries).toEqual([]);
  });
});
