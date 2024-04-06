import * as fs from "fs";

function summarize(objects, maxCategoricalValues) {
  // First extract all values for every key, recursing
  let valuesPerKey = {};
  for (let obj of objects) {
    scrapeValues(valuesPerKey, "", obj);
  }

  // Then process each value batch
  for (let [fullPath, values] of Object.entries(valuesPerKey)) {
    let summary = summarizeValues(values, maxCategoricalValues);
    console.log({ fullPath, summary });
  }

  // TODO Make it more efficient by doing that value processing in a streaming way
}

function scrapeValues(valuesPerKey, path, obj) {
  for (let [key, value] of Object.entries(obj)) {
    let fullPath = path ? `${path}.${key}` : key;
    if (Array.isArray(value)) {
      for (let item of value) {
        scrapeValues(valuesPerKey, `${fullPath}.[]`, item);
      }
    } else if (typeof value == "object" && value != null) {
      scrapeValues(valuesPerKey, fullPath, value);
    } else {
      if (!valuesPerKey[fullPath]) {
        valuesPerKey[fullPath] = [];
      }
      valuesPerKey[fullPath].push(value);
    }
  }
}

function summarizeValues(values, maxCategoricalValues) {
  let counter = {};
  for (let value of values) {
    if (!counter[value]) {
      counter[value] = 0;
    }
    counter[value]++;
  }

  if (Object.keys(counter).length < maxCategoricalValues) {
    // Sort by frequency
    let sorted = Object.entries(counter);
    sorted.sort((a, b) => b[1] - a[1]);

    let result = new Map();
    for (let [value, count] of sorted) {
      result.set(value, count);
    }

    return { categorical: result };
  }

  if (typeof values[0] == "string") {
    return { strings: Object.keys(counter).length };
  }

  if (typeof values[0] == "number") {
    return {
      numeric: {
        min: Math.min(...values),
        max: Math.max(...values),
      },
    };
  }

  return { unknown: counter };
}

let gj = JSON.parse(
  fs.readFileSync(
    "/home/dabreegster/atip-scheme-data/all_schemes_output.geojson",
    //"/home/dabreegster/osm2streets/tests/src/neukolln/geometry.json"
    //"/home/dabreegster/Downloads/tobia/cycling_quality_index_epsg4326.geojson"
  ),
);
summarize(gj.features.map((f) => f.properties));
