<script lang="ts">
  import type {
    ExpressionSpecification,
    DataDrivenPropertyValueSpecification,
  } from "maplibre-gl";
  import { summarize } from "./summarize";
  import Legend from "./Legend.svelte";

  export let input: any[];
  export let colorBy: DataDrivenPropertyValueSpecification<string> = "black";

  let chosenKey: string | null = null;
  let legendRows: [string, string][] = [];

  $: summaries = summarize(input, 15);

  $: if (input) {
    chosenKey = null;
  }

  $: if (chosenKey) {
    colorBy = makeColorBy(chosenKey);
  } else {
    colorBy = "black";
    legendRows = [];
  }

  function makeGetter(path: string): ExpressionSpecification {
    let parts = path.split(".");
    if (parts.length == 1) {
      return ["get", path];
    } else {
      let key = parts.pop()!;
      return ["get", key, makeGetter(parts.join("."))];
    }
  }

  function makeColorBy(
    key: string,
  ): DataDrivenPropertyValueSpecification<string> {
    let summary = summaries.get(key)!;
    if (summary.kind != "categorical") {
      // Should be impossible
      return "black";
    }

    // Vivid from https://carto.com/carto-colors/
    let colors = [
      "#66C5CC",
      "#F6CF71",
      "#F89C74",
      "#DCB0F2",
      "#87C55F",
      "#9EB9F3",
      "#FE88B1",
      "#C9DB74",
      "#8BE0A4",
      "#B497E7",
      "#D3B484",
      "#B3B3B3",
    ];

    legendRows = [];

    // match would be nicer, but it can't handle a mix of null and non-null values
    let expr = ["case"];
    let getter = makeGetter(key);

    let i = 0;
    for (let [value, count] of summary.counts) {
      let color = colors[i++ % colors.length];
      legendRows.push([`${value} (${count})`, color]);

      // @ts-expect-error TODO
      expr.push(["==", getter, value]);
      expr.push(color);
    }
    // Fallback
    expr.push("black");

    legendRows = legendRows;

    // @ts-expect-error TODO
    return expr;
  }
</script>

<p>{input.length.toLocaleString()} features</p>
<details open>
  <summary>Properties</summary>
  <ul>
    {#each summaries.entries() as [key, summary]}
      {#if chosenKey == key}
        <li>
          {key}
          <button on:click={() => (chosenKey = null)}
            >Stop coloring by this</button
          >
        </li>
        <Legend rows={legendRows} />
      {:else if chosenKey}
        <li>{key}</li>
      {:else if summary.kind == "categorical" && !key.includes("[]")}
        <li>
          {key}
          <button on:click={() => (chosenKey = key)}>Color by this</button>
        </li>
      {:else}
        <li>{key}</li>
      {/if}

      {#if chosenKey != key}
        <ul>
          {#if summary.kind == "categorical"}
            {#each summary.counts.entries() as [value, count]}
              <li>{value}: {count}</li>
            {/each}
          {:else if summary.kind == "strings"}
            <li>{summary.count} strings</li>
          {:else if summary.kind == "numeric"}
            <li>Numbers {summary.min} to {summary.max}</li>
          {:else}
            <li>Other...</li>
          {/if}
        </ul>
      {/if}
    {/each}
  </ul>
</details>
