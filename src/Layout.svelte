<div class="left">
  <slot name="left" />
</div>
<div class="main">
  <slot name="main" />
</div>

<style>
  :global(body) {
    margin: 0;
  }

  div {
    float: left;
    box-sizing: border-box;
  }

  .left {
    width: 25%;
    height: 100vh;
    overflow: scroll;
    padding: 8px;
  }
  .main {
    width: 75%;
  }
</style>
