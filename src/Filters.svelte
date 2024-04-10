<script lang="ts">
  import type { FilterSpecification } from "maplibre-gl";
  import { type Summary, makeGetter } from "./summarize";

  export let summaries: Map<string, Summary>;

  export let filter: FilterSpecification;

  let anyOrAll: "any" | "all" = "any";
  // TODO Multiple values per key
  let expressions: [string, string | number | boolean | null][] = [];

  $: if (summaries) {
    expressions = [];
  }

  $: if (anyOrAll) {
    filter = makeFilter(anyOrAll, expressions);
  }

  function makeFilter(_a: any, _b: any): FilterSpecification {
    if (expressions.length == 0) {
      return true;
    }

    let expr = [anyOrAll];
    for (let [key, value] of expressions) {
      expr.push(["==", makeGetter(key), value]);
    }

    // @ts-expect-error
    return expr;
  }

  function clear() {
    expressions = [];
  }

  function remove(key: string, value: string) {
    expressions = expressions.filter(([k, v]) => k != key || v != value);
  }

  // TODO Could be separate component, even
  let newKey = "";
  let newValue = "";
  function addExpr() {
    expressions = [...expressions, [newKey, newValue]];
  }

  export function addFilter(key: string, value: string) {
    expressions = [...expressions, [key, value]];
  }
</script>

<details open>
  <summary>Filters</summary>

  <pre>{JSON.stringify(filter)}</pre>

  <div><button on:click={clear}>Clear all filters</button></div>

  <label>
    <input type="radio" bind:group={anyOrAll} value="any" />Any
  </label>
  <label>
    <input type="radio" bind:group={anyOrAll} value="all" />All
  </label>

  <ul>
    {#each expressions as [key, value]}
      <li>
        {key} = {value} <button on:click={() => remove(key, value)}>X</button>
      </li>
    {/each}
  </ul>

  <label>
    Add expression:
    <select bind:value={newKey}>
      {#each summaries.entries() as [key, summary]}
        {#if summary.kind == "categorical"}
          <option value={key}>{key}</option>
        {/if}
      {/each}
    </select>
  </label>
  {#if newKey}
    <label>
      Equals value:
      <select bind:value={newValue}>
        {#each summaries.get(newKey).counts.keys() as value}
          <option {value}>{value}</option>
        {/each}
      </select>
    </label>
    {#if newValue}
      <button on:click={addExpr}>Add</button>
    {/if}
  {/if}
</details>
