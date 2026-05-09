<script lang="ts">
  import osmtogeojson from "osmtogeojson";
  import bbox from "@turf/bbox";
  import type { Feature, FeatureCollection } from "geojson";
  import { JsonView } from "@zerodevx/svelte-json-view";
  import type {
    Map,
    MapMouseEvent,
    DataDrivenPropertyValueSpecification,
    FilterSpecification,
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
  import { downloadGeneratedFile } from "svelte-utils";

  let empty = {
    type: "FeatureCollection" as const,
    features: [],
  };
  let gj: FeatureCollection = JSON.parse(JSON.stringify(empty));

  let map: Map;
  let pinnedFeature: Feature | null = null;
  let colorBy: DataDrivenPropertyValueSpecification<string> = "black";
  let filter: FilterSpecification = true;

  async function loadFromURL() {
    let params = new URLSearchParams(window.location.search);
    if (params.has("load_url")) {
      let resp = await fetch(params.get("load_url"));
      let json = await resp.json();

      if (json.type == "FeatureCollecton") {
        // Overwrite feature IDs
        let id = 1;
        for (let f of json.features) {
          f.id = id++;
        }
        gj = json;
      } else if (json.type == "Feature") {
        json.id = 1;
        gj = JSON.parse(JSON.stringify(empty));
        gj.features.push(json);
        gj = gj;
      }
      zoomFit();
    }
  }
  loadFromURL();

  $: if (map) {
    map.on("click", onClick);
  }

  // Reset pinnedFeature when filter changes
  $: if (filter) {
    pinnedFeature = null;
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
      gj.features = [];

      // Read multiple files and merge features
      for (let file of fileInput.files!) {
        let text = await file.text();
        let json = file.name.endsWith(".osm.xml")
          ? osmtogeojson(
              new DOMParser().parseFromString(text, "application/xml"),
            )
          : JSON.parse(text);
        if (json.type == "FeatureCollection") {
          gj.features = gj.features.concat(json.features);
        } else if (json.type == "Feature") {
          gj.features.push(json);
        }
      }

      // Overwrite feature IDs
      let id = 1;
      for (let f of gj.features) {
        f.id = id++;
      }

      gj = gj;
      pinnedFeature = null;
      zoomFit();
    } catch (err) {
      window.alert(`Bad input file: ${err}`);
    }
  }

  function zoomFit() {
    map?.fitBounds(bbox(gj) as [number, number, number, number], {
      animate: false,
      padding: 10,
    });
  }

  function downloadPinned() {
    if (pinnedFeature) {
      downloadGeneratedFile(
        "feature.geojson",
        JSON.stringify({
          type: "FeatureCollection",
          features: [pinnedFeature],
        }),
      );
    }
  }

  // You can paste a URL from OSM or other map apps that put the camera viewport in the hash. This
  // will warp to that location for debugging convenience.
  function onPaste(ev: ClipboardEvent) {
    let tag = (ev.target as HTMLElement).tagName;
    if (tag == "INPUT" || tag == "TEXTAREA") {
      return;
    }

    // @ts-expect-error MDN example works
    let paste = (ev.clipboardData || window.clipboardData).getData("text");
    let hash = "";
    if (paste.includes("#map=")) {
      hash = paste.split("#map=")[1];
    } else if (paste.includes("#")) {
      hash = paste.split("#")[1];
    }

    let parts = hash.split("/").map(parseFloat);
    if (parts.length == 3 && !parts.some(isNaN)) {
      map.flyTo({
        center: [parts[2], parts[1]],
        zoom: parts[0],
        duration: 100,
      });
    }
  }
</script>

<svelte:window on:paste={onPaste} />

<Layout>
  <div slot="left">
    <h1>GeoJSON Viewer</h1>

    <label>
      Load a .geojson or .osm.xml file
      <input bind:this={fileInput} on:change={loadFile} type="file" multiple />
    </label>

    <div><button on:click={zoomFit}>Zoom to fit</button></div>
    <hr />

    {#if pinnedFeature}
      <JsonView json={pinnedFeature.properties ?? {}} />
      <button on:click={downloadPinned}>Download just this feature</button>
    {/if}

    <SummarizeProperties
      input={gj.features.map((f) => f.properties ?? {})}
      bind:colorBy
      bind:filter
    />
  </div>
  <div slot="main" style="position:relative; width: 100%; height: 100vh;">
    <MapLibre
      style="https://api.maptiler.com/maps/dataviz/style.json?key=MZEJTanw3WpxRvt7qDfo"
      standardControls
      hash
      bind:map
      on:error={(e) => {
        // @ts-ignore ErrorEvent isn't exported
        console.log(e.detail.error);
      }}
    >
      <GeoJSON data={gj}>
        <FillLayer
          id="polygons"
          filter={["all", ["==", ["geometry-type"], "Polygon"], filter]}
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
          filter={["all", ["==", ["geometry-type"], "LineString"], filter]}
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
          filter={["all", ["==", ["geometry-type"], "Point"], filter]}
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
