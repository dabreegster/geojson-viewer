<script lang="ts">
  import { FillLayer, GeoJSON, MapLibre } from "svelte-maplibre";
  import Layout from "./Layout.svelte";
  import PropertiesTable from "./PropertiesTable.svelte";
</script>

<Layout>
  <div slot="left">
    <h1>GeoJSON Viewer</h1>
  </div>
  <div slot="main" style="position:relative; width: 100%; height: 100vh;">
    <MapLibre
      style="https://api.maptiler.com/maps/dataviz/style.json?key=MZEJTanw3WpxRvt7qDfo"
      standardControls
      hash
    ></MapLibre>
  </div>
</Layout>
