<script lang="ts">
  import type { MapMouseEvent } from "maplibre-gl";
  import {
    FillLayer,
    GeoJSON,
    MapLibre,
    LineLayer,
    CircleLayer,
    hoverStateFilter,
    Popup,
  } from "svelte-maplibre";
  import Layout from "./Layout.svelte";
  import PropertiesTable from "./PropertiesTable.svelte";

  let gj = {
    type: "FeatureCollection" as const,
    features: [],
  };

  let map;
  let pinnedFeature = null;

  $: if (map) {
    map.on("click", onClick);
  }

  function onClick(e: MapMouseEvent) {
    pinnedFeature = null;
    for (let rendered of map.queryRenderedFeatures(e.point, {
      layers: ["points", "lines", "polygons"],
    })) {
      // Find the original feature in the GJ, to avoid having to parse nested properties
      pinnedFeature = gj.features.find((f) => f.id == rendered.id);
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
      <PropertiesTable properties={pinnedFeature.properties} />
    {/if}
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
          paint={{
            "fill-color": "red",
            "fill-opacity": hoverStateFilter(0.5, 1.0),
          }}
        >
          <Popup openOn="hover" let:data>
            <PropertiesTable properties={data.properties} />
          </Popup>
        </FillLayer>

        <LineLayer
          id="lines"
          filter={["==", ["geometry-type"], "LineString"]}
          manageHoverState
          paint={{
            "line-width": 8,
            "line-color": "black",
            "line-opacity": hoverStateFilter(0.5, 1.0),
          }}
        >
          <Popup openOn="hover" let:data>
            <PropertiesTable properties={data.properties} />
          </Popup>
        </LineLayer>

        <CircleLayer
          id="points"
          filter={["==", ["geometry-type"], "Point"]}
          manageHoverState
          paint={{
            "circle-radius": 10,
            "circle-color": "black",
            "circle-opacity": hoverStateFilter(0.5, 1.0),
          }}
        >
          <Popup openOn="hover" let:data>
            <PropertiesTable properties={data.properties} />
          </Popup>
        </CircleLayer>
      </GeoJSON>
    </MapLibre>
  </div>
</Layout>
