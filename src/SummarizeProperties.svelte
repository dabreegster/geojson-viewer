<script lang="ts">
  import Legend from "./Legend.svelte";

  export let input;
  export let colorBy = "black";

  let chosenKey = null;
  let legendRows = [];

  // TODO Maybe https://www.npmjs.com/package/json-summary or similar?

  $: keys = summarize(input);

  $: if (chosenKey) {
    colorBy = makeExpression(chosenKey);
  } else {
    colorBy = "black";
    legendRows = [];
  }

  function summarize(input): Set<string> {
    let keys = new Set();
    for (let obj of input) {
      for (let [k, v] of Object.entries(obj)) {
        keys.add(k);
      }
    }
    return keys;
  }

  function makeExpression(key: string) {
    let values = new Set();
    for (let obj of input) {
      if (key in obj) {
        values.add(obj[key]);
      }
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

    let expr = ["case"];
    let i = 0;
    for (let value of values) {
      let color = colors[i++ % colors.length];
      legendRows.push([value, color]);

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
  {#each keys as key}
    {#if chosenKey == key}
      <li>
        {key}
        <button on:click={() => (chosenKey = null)}
          >Stop coloring by this</button
        >
      </li>
    {:else if chosenKey}
      <li>{key}</li>
    {:else}
      <li>
        {key} <button on:click={() => (chosenKey = key)}>Color by this</button>
      </li>
    {/if}
  {/each}
</ul>

{#if legendRows}
  <Legend rows={legendRows} />
{/if}
