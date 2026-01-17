import { describe, it, expect } from "vitest";
import {
  dateToLocalDateTime,
  localDateTimeToISO,
  formatDateTime,
  formatTime,
  createDateWithTime,
} from "./date";

describe("dateToLocalDateTime", () => {
  it("converts a Date to datetime-local format", () => {
    const date = new Date(2026, 5, 15, 14, 30); // June 15, 2026 at 14:30
    const result = dateToLocalDateTime(date);
    expect(result).toBe("2026-06-15T14:30");
  });

  it("pads single-digit months, days, hours, and minutes with zeros", () => {
    const date = new Date(2026, 0, 5, 9, 5); // January 5, 2026 at 09:05
    const result = dateToLocalDateTime(date);
    expect(result).toBe("2026-01-05T09:05");
  });
});

describe("localDateTimeToISO", () => {
  it("converts a datetime-local string to ISO format", () => {
    const dateTimeString = "2026-06-15T14:30";
    const result = localDateTimeToISO(dateTimeString);
    // The result should be a valid ISO string
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    // Verify the date components are preserved (accounting for timezone)
    const parsedDate = new Date(result);
    expect(parsedDate.getFullYear()).toBe(2026);
    expect(parsedDate.getMonth()).toBe(5); // June (0-indexed)
    expect(parsedDate.getDate()).toBe(15);
  });
});

describe("formatDateTime", () => {
  it("formats a date with full weekday, date, and time", () => {
    const date = new Date(2026, 5, 15, 14, 30); // June 15, 2026 at 14:30 (Monday)
    const result = formatDateTime(date);
    // Should contain weekday, month name, day, year, and time
    expect(result).toMatch(/Monday/);
    expect(result).toMatch(/June/);
    expect(result).toMatch(/15/);
    expect(result).toMatch(/2026/);
    expect(result).toMatch(/2:30/);
  });
});

describe("formatTime", () => {
  it("formats just the time portion of a date", () => {
    const date = new Date(2026, 5, 15, 14, 30); // 2:30 PM
    const result = formatTime(date);
    // Should match time format like "2:30 PM"
    expect(result).toMatch(/2:30\s*PM/i);
  });
});

describe("createDateWithTime", () => {
  it("creates a Date with specific hours and minutes on a given date", () => {
    const baseDate = new Date(2026, 5, 15, 10, 0); // June 15, 2026
    const result = createDateWithTime(baseDate, 14, 30);

    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(5); // June
    expect(result.getDate()).toBe(15);
    expect(result.getHours()).toBe(14);
    expect(result.getMinutes()).toBe(30);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  it("defaults minutes to 0 when not provided", () => {
    const baseDate = new Date(2026, 5, 15, 10, 45);
    const result = createDateWithTime(baseDate, 9);

    expect(result.getHours()).toBe(9);
    expect(result.getMinutes()).toBe(0);
  });
});
