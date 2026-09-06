export type AvailabilityWindow = {
  listingId: string;

  start: string;
  end: string;

  status:
    | "available"
    | "reserved"
    | "blocked";
};

export function isAvailable(
  windows: AvailabilityWindow[],
  start: Date,
  end: Date
): boolean {
  return !windows.some((window) => {
    if (window.status !== "reserved") {
      return false;
    }

    const existingStart = new Date(window.start);
    const existingEnd = new Date(window.end);

    return (
      start < existingEnd &&
      end > existingStart
    );
  });
}