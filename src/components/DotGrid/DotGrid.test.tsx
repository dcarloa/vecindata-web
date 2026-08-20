import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DotGrid } from "./DotGrid";

describe("DotGrid", () => {
  it("renders an aria-hidden canvas layer", () => {
    const { container } = render(<DotGrid />);
    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("canvas")).toBeInTheDocument();
  });
});
