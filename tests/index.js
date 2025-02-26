import fs from "node:fs";
import tape from "tape";

import adiffParser from "@osmcha/osm-adiff-parser";
import changetags from "../src/changetags.js";

const isAdiffFile = (filename) => /^.*\.adiff$/.test(filename);
const stripExtension = (filename) => filename.split(".")[0];

const filenames = fs
  .readdirSync("tests/data", { encoding: "utf-8" })
  .filter(isAdiffFile)
  .map(stripExtension);

for (const filename of filenames) {
  tape(`testing file: ${filename}`, async function (t) {
    const xml = fs.readFileSync(`tests/data/${filename}.adiff`, { encoding: "utf-8" });
    const rawExpected = JSON.parse(fs.readFileSync(`tests/data/${filename}.expected.json`));

    // Rehydrate expected from JSON into a Map where values are Sets
    // (since the changetags() function returns data in this form)
    const expected = new Map(Object.entries(rawExpected).map(([k, v]) => [k, new Set(v)]));

    const adiff = await adiffParser(xml);
    const actual = changetags(adiff);

    t.deepEqual(actual, expected);
    t.end();
  });
}
