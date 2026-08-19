export interface FakePlace {
  address: string;
  lat: number;
  lon: number;
}

export function dispatchPlaceSelection(element: HTMLElement, place: FakePlace) {
  const event = new Event("gmp-select") as Event & {
    placePrediction: { toPlace(): unknown };
  };
  event.placePrediction = {
    toPlace: () => ({
      formattedAddress: place.address,
      location: { lat: () => place.lat, lng: () => place.lon },
      fetchFields: () => Promise.resolve(),
    }),
  };
  element.dispatchEvent(event);
}
