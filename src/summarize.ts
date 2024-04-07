export type Summary =
  | {
      kind: "categorical";
      counts: Map<string, number>;
    }
  | {
      kind: "strings";
      count: number;
    }
  | {
      kind: "numeric";
      min: number;
      max: number;
    }
  | {
      kind: "other";
      counts: { [key: string]: number };
    };

export function summarize(
  objects: any[],
  maxCategoricalValues: number,
): Map<string, Summary> {
  // First extract all values for every key, recursing
  let valuesPerKey: { [key: string]: any[] } = {};
  for (let obj of objects) {
    scrapeValues(valuesPerKey, "", obj);
  }

  // Then process each value batch
  let result = new Map();
  for (let [fullPath, values] of Object.entries(valuesPerKey)) {
    let summary = summarizeValues(values, maxCategoricalValues);
    result.set(fullPath, summary);
  }

  // TODO Make it more efficient by doing that value processing in a streaming way
  return result;
}

function scrapeValues(
  valuesPerKey: { [key: string]: any[] },
  path: string,
  obj: any,
) {
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

function summarizeValues(values: any[], maxCategoricalValues: number): Summary {
  let counter: { [key: string]: number } = {};
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

    let counts = new Map();
    for (let [value, count] of sorted) {
      counts.set(value, count);
    }

    return { kind: "categorical", counts };
  }

  if (typeof values[0] == "string") {
    return { kind: "strings", count: Object.keys(counter).length };
  }

  if (typeof values[0] == "number") {
    return {
      kind: "numeric",
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }

  return { kind: "other", counts: counter };
}
