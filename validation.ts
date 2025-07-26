import { FilterTimelineEntry, ValidationError } from "./types";

export function validateEntry(
  candidate: FilterTimelineEntry,
  allEntries: FilterTimelineEntry[],
  videoDuration: number
): ValidationError[] {
  const errs: ValidationError[] = [];

  const { startTime, endTime, id } = candidate;

  if (startTime < 0) {
    errs.push("START_NEGATIVE");
  }
  if (endTime > videoDuration) {
    errs.push("END_EXCEEDS_DURATION");
  }
  if (startTime >= endTime) {
    errs.push("START_NOT_LESS_THAN_END");
  }

  // overlap check: any existing entry (other than this one) that intersects?
  const overlap = allEntries.some(e =>
    e.id !== id &&
    !(endTime <= e.startTime || startTime >= e.endTime)
  );
  if (overlap) {
    errs.push("OVERLAPPING");
  }

  return errs;
}
