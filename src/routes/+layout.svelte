<script lang="ts">
  import { base } from "$app/paths";
  import favicon from "$lib/assets/cpbl-favicon.svg";
  import {
    CollapseToBurger,
    Footer,
    Navbar,
    NavGH,
    NavItem,
  } from "@computational-biology-aachen/design";
  import "../app.css";

  let { children } = $props();
</script>

<svelte:head>
  <title>GreenSloth</title>
  <meta
    name="description"
    content="Photosynthesis models at your pace — browse, compare, and explore curated ODE models of photosynthesis."
  />
  <link
    rel="icon"
    href={favicon}
  />
</svelte:head>

<Navbar>
  {#snippet brand()}
    <a
      href="{base}/"
      class="brand"
    >
      <img
        src="{base}/img/greensloth_color_complete.svg"
        alt="GreenSloth"
        class="brand-logo"
      />
      <span>GreenSloth</span>
    </a>
  {/snippet}
  <CollapseToBurger collapseAt="768px">
    <NavItem href="{base}/">Home</NavItem>
    <NavItem href="{base}/models">Models</NavItem>
    <NavItem href="{base}/compare">Compare</NavItem>
    <NavItem href="{base}/#how-to-use">How To Use</NavItem>
    <NavItem href="{base}/about">About Us</NavItem>
    <NavItem href="{base}/impressum">Impressum</NavItem>
  </CollapseToBurger>
  <NavGH href="https://github.com/Computational-Biology-Aachen/greensloth" />
</Navbar>

{@render children()}

<Footer>
  <p>GreenSloth — Photosynthesis Models at your Pace</p>
  <p>
    Computational Life Science Group · RWTH Aachen ·
    <a
      href="{base}/impressum"
      style="color: inherit;">Impressum</a
    >
  </p>
</Footer>

<style>
  .brand {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--color-primary);
    font-weight: 600;
    text-decoration: none;
  }

  .brand-logo {
    width: auto;
    height: 1.8rem;
  }
</style>
