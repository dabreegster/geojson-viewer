<script lang="ts">
  import { summarize } from "./summarize";
  import Legend from "./Legend.svelte";

  export let input: any[];
  export let colorBy = "black";

  let chosenKey = null;
  let legendRows = [];

  $: summaries = summarize(input, 15);

  $: if (chosenKey) {
    colorBy = makeExpression(chosenKey);
  } else {
    colorBy = "black";
    legendRows = [];
  }

  // TODO Handle nested keys
  function makeExpression(key: string) {
    let categories = summaries.get(key).categorical;

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

    let expr = ["case"];
    let i = 0;
    for (let [value, count] of categories) {
      let color = colors[i++ % colors.length];
      legendRows.push([`${value} (${count})`, color]);

      expr.push(["==", ["get", key], value]);
      expr.push(color);
    }
    // Fallback
    expr.push("black");

    legendRows = legendRows;

    return expr;
  }
</script>

<p>{input.length.toLocaleString()} features</p>
<p>Properties:</p>
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
    {:else if summary.categorical && !key.includes("[]")}
      <li>
        {key} <button on:click={() => (chosenKey = key)}>Color by this</button>
      </li>
    {:else}
      <li>{key}</li>
    {/if}

    {#if chosenKey != key}
      <ul>
        {#if summary.categorical}
          {#each summary.categorical.entries() as [value, count]}
            <li>{value}: {count}</li>
          {/each}
        {:else if summary.strings}
          <li>{summary.strings} strings</li>
        {:else if summary.numeric}
          <li>Numbers {summary.numeric.min} to {summary.numeric.max}</li>
        {:else}
          <li>Other...</li>
        {/if}
      </ul>
    {/if}
  {/each}
</ul>
