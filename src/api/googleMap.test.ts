import { describe, it, expect, vi, beforeEach } from "vitest";
import { createDraggableMarkerMap } from "./googleMap";
import { loadPlacesLibrary } from "./googlePlaces";

vi.mock("./googlePlaces", () => ({
  loadPlacesLibrary: vi.fn(),
}));

class FakeAdvancedMarkerElement extends EventTarget {
  position: { lat: number; lng: number } | null;
  map: unknown;

  constructor(options: { map: unknown; position: { lat: number; lng: number } }) {
    super();
    this.map = options.map;
    this.position = options.position;
  }

  triggerDragTo(position: { lat: number; lng: number }) {
    this.position = position;
    this.dispatchEvent(new Event("dragend"));
  }
}

describe("createDraggableMarkerMap", () => {
  let lastMarker: FakeAdvancedMarkerElement;

  beforeEach(() => {
    vi.mocked(loadPlacesLibrary).mockResolvedValue(undefined);
    window.google = {
      maps: {
        places: {} as never,
        Map: vi.fn().mockImplementation(() => ({ setCenter: vi.fn() })),
        marker: {
          AdvancedMarkerElement: vi.fn().mockImplementation((options) => {
            lastMarker = new FakeAdvancedMarkerElement(options);
            return lastMarker;
          }),
        },
      },
    } as never;
  });

  it("calls onPositionChange with the new coordinates after a drag", async () => {
    const onPositionChange = vi.fn();
    const container = document.createElement("div");

    await createDraggableMarkerMap(container, { lat: 4.68, lon: -74.05 }, onPositionChange);
    lastMarker.triggerDragTo({ lat: 4.7, lng: -74.1 });

    expect(onPositionChange).toHaveBeenCalledWith({ lat: 4.7, lon: -74.1 });
  });

  it("stops listening for drags after destroy()", async () => {
    const onPositionChange = vi.fn();
    const container = document.createElement("div");

    const map = await createDraggableMarkerMap(
      container,
      { lat: 4.68, lon: -74.05 },
      onPositionChange
    );
    map.destroy();
    lastMarker.triggerDragTo({ lat: 4.7, lng: -74.1 });

    // A retained dragend closure per destroyed row map is a real leak at
    // 200-row scale.
    expect(onPositionChange).not.toHaveBeenCalled();
  });

  it("throws a clear error if the Map/marker classes never loaded", async () => {
    window.google = { maps: { places: {} } } as never;
    const container = document.createElement("div");

    await expect(
      createDraggableMarkerMap(container, { lat: 4.68, lon: -74.05 }, vi.fn())
    ).rejects.toThrow(/todavía no está listo/);
  });
});
