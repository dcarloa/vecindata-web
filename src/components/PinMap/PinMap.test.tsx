import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PinMap } from "./PinMap";
import { createDraggableMarkerMap } from "../../api/googleMap";

vi.mock("../../api/googleMap", () => ({
  createDraggableMarkerMap: vi.fn(),
}));

const mockedCreateDraggableMarkerMap = vi.mocked(createDraggableMarkerMap);

describe("PinMap", () => {
  beforeEach(() => {
    mockedCreateDraggableMarkerMap.mockReset();
    mockedCreateDraggableMarkerMap.mockResolvedValue({ setPosition: vi.fn(), destroy: vi.fn() });
  });

  it("does not mount a map until the operator asks to adjust the pin", async () => {
    render(
      <PinMap lat={4.68} lon={-74.05} onPositionChange={vi.fn()} adjustButtonLabel="Ajustar pin" />
    );

    expect(mockedCreateDraggableMarkerMap).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Ajustar pin" })).toBeInTheDocument();
  });

  it("mounts the map with the given position once the operator clicks the button", async () => {
    const user = userEvent.setup();
    render(
      <PinMap lat={4.68} lon={-74.05} onPositionChange={vi.fn()} adjustButtonLabel="Ajustar pin" />
    );

    await user.click(screen.getByRole("button", { name: "Ajustar pin" }));

    await vi.waitFor(() => expect(mockedCreateDraggableMarkerMap).toHaveBeenCalledOnce());
    expect(mockedCreateDraggableMarkerMap.mock.calls[0][1]).toEqual({ lat: 4.68, lon: -74.05 });
  });

  it("calls onPositionChange when the opened map reports a drag", async () => {
    let onPositionChange!: (position: { lat: number; lon: number }) => void;
    mockedCreateDraggableMarkerMap.mockImplementation(async (_el, _pos, callback) => {
      onPositionChange = callback;
      return { setPosition: vi.fn(), destroy: vi.fn() };
    });
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PinMap lat={4.68} lon={-74.05} onPositionChange={handleChange} adjustButtonLabel="Ajustar pin" />
    );

    await user.click(screen.getByRole("button", { name: "Ajustar pin" }));

    await vi.waitFor(() => expect(onPositionChange).toBeDefined());
    onPositionChange({ lat: 4.7, lon: -74.1 });

    expect(handleChange).toHaveBeenCalledWith({ lat: 4.7, lon: -74.1 });
  });

  it("shows a fallback message when the map fails to load", async () => {
    mockedCreateDraggableMarkerMap.mockRejectedValue(new Error("no map"));
    const user = userEvent.setup();
    render(
      <PinMap lat={4.68} lon={-74.05} onPositionChange={vi.fn()} adjustButtonLabel="Ajustar pin" />
    );

    await user.click(screen.getByRole("button", { name: "Ajustar pin" }));

    expect(await screen.findByText(/no se pudo cargar el mapa/i)).toBeInTheDocument();
  });
});
