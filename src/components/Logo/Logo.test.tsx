import { render, screen } from "@testing-library/react";
import { Logo } from "./Logo";

describe("Logo", () => {
  it("renders the mark and the wordmark by default", () => {
    render(<Logo />);
    expect(screen.getByRole("img", { name: /vecindata/i })).toBeInTheDocument();
    expect(screen.getByText("VecinData")).toBeInTheDocument();
  });

  it("omits the wordmark when withWordmark is false", () => {
    render(<Logo withWordmark={false} />);
    expect(screen.getByRole("img", { name: /vecindata/i })).toBeInTheDocument();
    expect(screen.queryByText("VecinData")).not.toBeInTheDocument();
  });
});
