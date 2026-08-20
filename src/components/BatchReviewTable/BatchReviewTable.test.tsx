import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BatchReviewTable, type ReviewRow } from "./BatchReviewTable";
import { createDraggableMarkerMap } from "../../api/googleMap";

vi.mock("../../api/googleMap", () => ({
  createDraggableMarkerMap: vi.fn(),
}));

const mockedCreateDraggableMarkerMap = vi.mocked(createDraggableMarkerMap);

function makeRow(overrides: Partial<ReviewRow> = {}): ReviewRow {
  return {
    id: "Calle 100, Bogotá",
    formattedAddress: "Calle 100 #15-20, Bogotá, Colombia",
    lat: 4.68,
    lon: -74.05,
    geocoded: true,
    excluded: false,
    ...overrides,
  };
}

describe("BatchReviewTable", () => {
  beforeEach(() => {
    mockedCreateDraggableMarkerMap.mockReset();
    mockedCreateDraggableMarkerMap.mockResolvedValue({ setPosition: vi.fn(), destroy: vi.fn() });
  });

  it("calls onRowChange with new coordinates when the map reports a drag", async () => {
    let onPositionChange!: (position: { lat: number; lon: number }) => void;
    mockedCreateDraggableMarkerMap.mockImplementation(async (_el, _pos, callback) => {
      onPositionChange = callback;
      return { setPosition: vi.fn(), destroy: vi.fn() };
    });
    const onRowChange = vi.fn();
    render(<BatchReviewTable rows={[makeRow()]} onRowChange={onRowChange} />);

    await vi.waitFor(() => expect(onPositionChange).toBeDefined());
    onPositionChange({ lat: 4.7, lon: -74.1 });

    expect(onRowChange).toHaveBeenCalledWith("Calle 100, Bogotá", { lat: 4.7, lon: -74.1 });
  });

  it("shows a manual-review warning for rows without a geocoding match", () => {
    render(
      <BatchReviewTable
        rows={[makeRow({ geocoded: false, formattedAddress: "" })]}
        onRowChange={vi.fn()}
      />
    );

    expect(screen.getByText(/ajusta el pin manualmente/i)).toBeInTheDocument();
  });

  it("toggles the excluded flag via the checkbox", async () => {
    const onRowChange = vi.fn();
    const user = userEvent.setup();
    render(<BatchReviewTable rows={[makeRow()]} onRowChange={onRowChange} />);

    await user.click(screen.getByLabelText(/excluir/i));

    expect(onRowChange).toHaveBeenCalledWith("Calle 100, Bogotá", { excluded: true });
  });
});
