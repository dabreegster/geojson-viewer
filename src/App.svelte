<script lang="ts">
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

  let fileInput: HTMLInputElement;
  async function loadFile(e: Event) {
    try {
      let text = await fileInput.files![0].text();
      gj = JSON.parse(text);
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
  </div>
  <div slot="main" style="position:relative; width: 100%; height: 100vh;">
    <MapLibre
      style="https://api.maptiler.com/maps/dataviz/style.json?key=MZEJTanw3WpxRvt7qDfo"
      standardControls
      hash
    >
      <GeoJSON data={gj} generateId>
        <FillLayer
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
