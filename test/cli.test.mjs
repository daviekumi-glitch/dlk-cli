import test from "node:test";
import assert from "node:assert/strict";
import { fetchFeed } from "../bin/dlk.mjs";

test("live feed returns stories and sources", async () => {
  const data = await fetchFeed({ timeout: 12000 });
  assert.ok(data.stories.length > 0);
  assert.ok(Number(data.sources) > 0);
  assert.equal(typeof data.stories[0].url, "string");
});
