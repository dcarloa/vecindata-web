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
    id: "0",
    address: "Calle 100, Bogotá",
    formattedAddress: "Calle 100 #15-20, Bogotá, Colombia",
    lat: 4.68,
    lon: -74.05,
    geocoded: true,
    confirmed: true,
    excluded: false,
    ...overrides,
  };
}

describe("BatchReviewTable", () => {
  beforeEach(() => {
    mockedCreateDraggableMarkerMap.mockReset();
    mockedCreateDraggableMarkerMap.mockResolvedValue({ setPosition: vi.fn(), destroy: vi.fn() });
  });

  it("does not mount a map until the operator asks to adjust that row's pin", async () => {
    const user = userEvent.setup();
    render(<BatchReviewTable rows={[makeRow()]} onRowChange={vi.fn()} />);

    expect(mockedCreateDraggableMarkerMap).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /ajustar pin/i }));

    await vi.waitFor(() => expect(mockedCreateDraggableMarkerMap).toHaveBeenCalledOnce());
  });

  it("mounts one map per row the operator opens, not one per row rendered", async () => {
    const user = userEvent.setup();
    const rows = [
      makeRow({ id: "0" }),
      makeRow({ id: "1" }),
      makeRow({ id: "2" }),
    ];
    render(<BatchReviewTable rows={rows} onRowChange={vi.fn()} />);

    expect(screen.getAllByRole("button", { name: /ajustar pin/i })).toHaveLength(3);
    expect(mockedCreateDraggableMarkerMap).not.toHaveBeenCalled();

    await user.click(screen.getAllByRole("button", { name: /ajustar pin/i })[1]);

    await vi.waitFor(() => expect(mockedCreateDraggableMarkerMap).toHaveBeenCalledOnce());
  });

  it("calls onRowChange with new coordinates when the opened map reports a drag", async () => {
    let onPositionChange!: (position: { lat: number; lon: number }) => void;
    mockedCreateDraggableMarkerMap.mockImplementation(async (_el, _pos, callback) => {
      onPositionChange = callback;
      return { setPosition: vi.fn(), destroy: vi.fn() };
    });
    const onRowChange = vi.fn();
    const user = userEvent.setup();
    render(<BatchReviewTable rows={[makeRow({ id: "7" })]} onRowChange={onRowChange} />);

    await user.click(screen.getByRole("button", { name: /ajustar pin/i }));

    await vi.waitFor(() => expect(onPositionChange).toBeDefined());
    onPositionChange({ lat: 4.7, lon: -74.1 });

    expect(onRowChange).toHaveBeenCalledWith("7", { lat: 4.7, lon: -74.1 });
  });

  it("shows a fallback message when the map fails to load", async () => {
    mockedCreateDraggableMarkerMap.mockRejectedValue(
      new Error("El mapa de Google todavía no está listo.")
    );
    const user = userEvent.setup();
    render(<BatchReviewTable rows={[makeRow()]} onRowChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /ajustar pin/i }));

    expect(await screen.findByText(/no se pudo cargar el mapa/i)).toBeInTheDocument();
  });

  it("shows a manual-review warning for rows without a geocoding match", () => {
    render(
      <BatchReviewTable
        rows={[makeRow({ geocoded: false, confirmed: false, formattedAddress: "" })]}
        onRowChange={vi.fn()}
      />
    );

    expect(screen.getByText(/ajusta el pin manualmente/i)).toBeInTheDocument();
    expect(screen.getByText("Calle 100, Bogotá")).toBeInTheDocument();
  });

  it("replaces the warning with a confirmation once a failed row's pin was adjusted", () => {
    render(
      <BatchReviewTable
        rows={[makeRow({ geocoded: false, confirmed: true, formattedAddress: "" })]}
        onRowChange={vi.fn()}
      />
    );

    expect(screen.queryByText(/ajusta el pin manualmente/i)).not.toBeInTheDocument();
    expect(screen.getByText(/pin ajustado manualmente/i)).toBeInTheDocument();
  });

  it("toggles the excluded flag via the checkbox", async () => {
    const onRowChange = vi.fn();
    const user = userEvent.setup();
    render(<BatchReviewTable rows={[makeRow({ id: "3" })]} onRowChange={onRowChange} />);

    await user.click(screen.getByLabelText(/excluir/i));

    expect(onRowChange).toHaveBeenCalledWith("3", { excluded: true });
  });

  it("keeps duplicate addresses independently targetable", async () => {
    const onRowChange = vi.fn();
    const user = userEvent.setup();
    const rows = [
      makeRow({ id: "0", address: "Calle 100", formattedAddress: "Calle 100, Bogotá" }),
      makeRow({ id: "1", address: "Calle 100", formattedAddress: "Calle 100, Bogotá" }),
    ];
    render(<BatchReviewTable rows={rows} onRowChange={onRowChange} />);

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(2);
    await user.click(checkboxes[1]);

    expect(onRowChange).toHaveBeenCalledOnce();
    expect(onRowChange).toHaveBeenCalledWith("1", { excluded: true });
  });
});
