<script lang="ts">
  import type { Feature, FeatureCollection } from "geojson";
  import { JsonView } from "@zerodevx/svelte-json-view";
  import type {
    Map,
    MapMouseEvent,
    DataDrivenPropertyValueSpecification,
  } from "maplibre-gl";
  import {
    FillLayer,
    GeoJSON,
    MapLibre,
    LineLayer,
    CircleLayer,
    hoverStateFilter,
  } from "svelte-maplibre";
  import Layout from "./Layout.svelte";
  import SummarizeProperties from "./SummarizeProperties.svelte";

  let empty = {
    type: "FeatureCollection" as const,
    features: [],
  };
  let gj: FeatureCollection = empty;

  let map: Map;
  let pinnedFeature: Feature | null = null;
  let colorBy: DataDrivenPropertyValueSpecification<string> = "black";

  $: if (map) {
    map.on("click", onClick);
  }

  function onClick(e: MapMouseEvent) {
    pinnedFeature = null;
    for (let rendered of map.queryRenderedFeatures(e.point, {
      layers: ["points", "lines", "polygons"],
    })) {
      // Find the original feature in the GJ, to avoid having to parse nested properties
      pinnedFeature = gj.features.find((f) => f.id == rendered.id)!;
      break;
    }
  }

  let fileInput: HTMLInputElement;
  async function loadFile(e: Event) {
    try {
      let text = await fileInput.files![0].text();
      let json = JSON.parse(text);

      // Overwrite feature IDs
      let id = 1;
      for (let f of json.features) {
        f.id = id++;
      }

      gj = json;
      pinnedFeature = null;
    } catch (err) {
      window.alert(`Bad input file: ${err}`);
    }
  }
</script>

<Layout>
  <div slot="left">
    <h1>GeoJSON Viewer</h1>

    <label>
      Load a .geojson file
      <input bind:this={fileInput} on:change={loadFile} type="file" />
    </label>

    <p>Note feature IDs are overwritten</p>

    {#if pinnedFeature}
      <JsonView json={pinnedFeature.properties} />
    {/if}

    <SummarizeProperties
      input={gj.features.map((f) => f.properties)}
      bind:colorBy
    />
  </div>
  <div slot="main" style="position:relative; width: 100%; height: 100vh;">
    <MapLibre
      style="https://api.maptiler.com/maps/dataviz/style.json?key=MZEJTanw3WpxRvt7qDfo"
      standardControls
      hash
      bind:map
    >
      <GeoJSON data={gj}>
        <FillLayer
          id="polygons"
          filter={["==", ["geometry-type"], "Polygon"]}
          manageHoverState
          eventsIfTopMost
          hoverCursor="pointer"
          paint={{
            "fill-color": colorBy,
            "fill-opacity": hoverStateFilter(0.5, 1.0),
          }}
        />

        <LineLayer
          id="lines"
          filter={["==", ["geometry-type"], "LineString"]}
          manageHoverState
          eventsIfTopMost
          hoverCursor="pointer"
          paint={{
            "line-width": 8,
            "line-color": colorBy,
            "line-opacity": hoverStateFilter(0.5, 1.0),
          }}
        />

        <CircleLayer
          id="points"
          filter={["==", ["geometry-type"], "Point"]}
          manageHoverState
          eventsIfTopMost
          hoverCursor="pointer"
          paint={{
            "circle-radius": 10,
            "circle-color": colorBy,
            "circle-opacity": hoverStateFilter(0.5, 1.0),
          }}
        />
      </GeoJSON>

      <GeoJSON data={pinnedFeature || empty}>
        <FillLayer
          filter={["==", ["geometry-type"], "Polygon"]}
          paint={{
            "fill-color": "red",
          }}
        />
        <LineLayer
          filter={["==", ["geometry-type"], "LineString"]}
          paint={{
            "line-width": 8,
            "line-color": "red",
          }}
        />
        <CircleLayer
          filter={["==", ["geometry-type"], "Point"]}
          paint={{
            "circle-radius": 10,
            "circle-color": "red",
          }}
        />
      </GeoJSON>
    </MapLibre>
  </div>
</Layout>
