import assert from "node:assert/strict";
import { copyFileSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const tmp = join(dir, `_ui_format_date_test_${process.pid}.mjs`);
copyFileSync(join(dir, "ui.js"), tmp);

const { formatDate } = await import(pathToFileURL(tmp).href);
unlinkSync(tmp);

const defaultOptions = { month: "short", day: "numeric", year: "numeric" };

test("formatDate: null → em dash", () => {
  assert.equal(formatDate(null), "—");
});

test("formatDate: undefined → em dash", () => {
  assert.equal(formatDate(undefined), "—");
});

test("formatDate: empty string → em dash", () => {
  assert.equal(formatDate(""), "—");
});

test("formatDate: date-only YYYY-MM-DD does not throw and formats", () => {
  const formatted = formatDate("2026-09-19");
  assert.notEqual(formatted, "—");
  assert.match(formatted, /2026/);
  assert.doesNotThrow(() => formatDate("2026-09-19"));
});

test("formatDate: ISO datetime does not throw and formats", () => {
  assert.doesNotThrow(() => formatDate("2026-09-19T11:04:51.000Z"));
  const formatted = formatDate("2026-09-19T11:04:51.000Z");
  assert.notEqual(formatted, "—");
  assert.match(formatted, /2026/);
  // Must not append T12:00:00 onto an ISO datetime (would throw Invalid time value).
  assert.notEqual(formatted, "Invalid Date");
});

test("formatDate: invalid date string → em dash without throw", () => {
  assert.doesNotThrow(() => formatDate("not-a-date"));
  assert.equal(formatDate("not-a-date"), "—");
  assert.equal(formatDate("2026-09-19T11:04:51.000ZT12:00:00"), "—");
});

test("formatDate: Date object formats without throw", () => {
  const date = new Date("2026-09-19T11:04:51.000Z");
  assert.doesNotThrow(() => formatDate(date));
  assert.match(formatDate(date), /2026/);
});

test("formatDate: preserves Intl options", () => {
  const formatted = formatDate("2026-09-19", { month: "short", day: "numeric" });
  assert.doesNotThrow(() =>
    formatDate("2026-09-19", { month: "short", day: "numeric" }),
  );
  assert.equal(
    formatted,
    new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(
      new Date("2026-09-19T12:00:00"),
    ),
  );
  // default options still used when omitted
  assert.equal(
    formatDate("2026-09-19"),
    new Intl.DateTimeFormat(undefined, defaultOptions).format(
      new Date("2026-09-19T12:00:00"),
    ),
  );
});
