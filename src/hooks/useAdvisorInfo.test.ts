import { renderHook, act } from "@testing-library/react";
import { useAdvisorInfo } from "./useAdvisorInfo";

const STORAGE_KEY = "vecindata_advisor_info";

describe("useAdvisorInfo", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("starts empty when nothing is stored", () => {
    const { result } = renderHook(() => useAdvisorInfo());
    const [info] = result.current;
    expect(info).toEqual({
      advisorName: "",
      advisorWhatsapp: "",
      advisorEmail: "",
      tagline: "",
    });
  });

  it("loads previously stored info on mount", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ advisorName: "Ana Torres", advisorWhatsapp: "", advisorEmail: "", tagline: "" })
    );
    const { result } = renderHook(() => useAdvisorInfo());
    expect(result.current[0].advisorName).toBe("Ana Torres");
  });

  it("persists updates to localStorage", () => {
    const { result } = renderHook(() => useAdvisorInfo());
    act(() => {
      result.current[1]({ advisorName: "Ana Torres" });
    });
    expect(result.current[0].advisorName).toBe("Ana Torres");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toMatchObject({
      advisorName: "Ana Torres",
    });
  });

  it("falls back to empty info when localStorage holds malformed JSON", () => {
    localStorage.setItem(STORAGE_KEY, "not json");
    const { result } = renderHook(() => useAdvisorInfo());
    expect(result.current[0]).toEqual({
      advisorName: "",
      advisorWhatsapp: "",
      advisorEmail: "",
      tagline: "",
    });
  });
});
