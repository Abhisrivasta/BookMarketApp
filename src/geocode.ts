export const getHumanReadableLocation = async (
  lat: number,
  lng: number
): Promise<string> => {
  try {
    const res = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=91703225336c4917853f8d02e15b947f`
    );
    const data = await res.json();

    if (data?.results?.length > 0) {
      return data.results[0].formatted;
    } else {
      return "Unknown location";
    }
  } catch (err) {
    console.error("Geocoding failed:", err);
    return "Error fetching location";
  }
};
