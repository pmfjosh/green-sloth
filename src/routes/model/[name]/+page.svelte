<script lang="ts">
  import { base } from "$app/paths";
  import { onMount } from "svelte";
  import {
    Accordion,
    Button,
    H1,
    H2,
    H3,
    NavGH,
    Popover,
    Section,
    SectionHeader,
    Sidebar,
    Text,
  } from "@computational-biology-aachen/design";
  import type { PageData } from "./$types";
  import { GH_RAW } from "$lib/models";

  let { data }: { data: PageData } = $props();

  const sections = [
    { id: "summary", label: "Summary" },
    { id: "ode", label: "ODE System" },
    { id: "derived-comps", label: "Derived Quantities" },
    { id: "params", label: "Parameters" },
    { id: "derived-params", label: "Derived Parameters" },
    { id: "rates", label: "Rates" },
    { id: "figures", label: "Figures" },
    { id: "demonstrations", label: "Demonstrations" },
  ];

  let activeSection = $state("summary");
  let zoomSrc = $state<string | null>(null);
  let popoverEl = $state<HTMLDivElement | null | undefined>(null);

  function openZoom(src: string) {
    zoomSrc = src;
    popoverEl?.showPopover();
  }

  onMount(() => {
    // Re-typeset math after dynamic content renders
    if (typeof window !== "undefined" && (window as any).MathJax?.typeset) {
      (window as any).MathJax.typeset();
    }

    // Intersection observer for sidebar active section
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            activeSection = entry.target.id;
          }
        }
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );

    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  });

  const tableSections = $derived([
    { key: "compsData" as const, id: "ode", label: "ODE System", math: data.ode.math },
    { key: "derivedCompsData" as const, id: "derived-comps", label: "Derived Quantities", math: data.derivedComps.math },
    { key: "paramsData" as const, id: "params", label: "Parameters", math: null },
    { key: "derivedParamsData" as const, id: "derived-params", label: "Derived Parameters", math: data.derivedParams.math },
    { key: "ratesData" as const, id: "rates", label: "Rates", math: data.rates.math },
  ]);
</script>

<SectionHeader>
  <div class="model-header">
    <H1 color="light">{data.name}</H1>
    <a href={data.doi} target="_blank" class="doi-link">{data.doi}</a>
    <div class="header-actions">
      <NavGH href="https://github.com/ElouenCorvest/GreenSloth/tree/main/models/{data.name}" />
      <Button href="{base}/compare?select={data.name}" variant="secondary">Compare</Button>
    </div>
  </div>
</SectionHeader>

<div class="page-layout">
  <Sidebar>
    <a href="#summary" class:active={activeSection === "summary"}>Back to Top</a>
    <a href="{base}/compare?select={data.name}">Compare</a>
    {#each sections as s}
      <a href="#{s.id}" class:active={activeSection === s.id}>{s.label}</a>
    {/each}
  </Sidebar>

  <main class="model-content">
    <!-- Summary -->
    <section id="summary" class="model-section">
      <H2>Summary</H2>
      <div class="summary-grid">
        <button
          class="scheme-btn"
          onclick={() => openZoom(`${GH_RAW}/models/${data.name}/${data.name}_scheme.svg`)}
          aria-label="Zoom scheme"
        >
          <img
            src="{GH_RAW}/models/{data.name}/{data.name}_scheme.svg"
            alt="{data.name} scheme"
            class="scheme-img"
          />
        </button>
        <div class="summary-text">
          {@html data.summary}
        </div>
      </div>
    </section>

    <!-- Table sections (ODE, DerivedComps, Params, DerivedParams, Rates) -->
    {#each tableSections as ts}
      <section id={ts.id} class="model-section">
        <H2>{ts.label}</H2>
        {#if ts.math}
          <div class="math-block">
            {@html `\\[${ts.math}\\]`}
          </div>
        {/if}
        {#if data[ts.key].length > 0}
          <div class="model-table-wrap">
            <table class="model-table">
              <thead>
                <tr>
                  {#each Object.keys(data[ts.key][0]) as col}
                    <th>{col}</th>
                  {/each}
                </tr>
              </thead>
              <tbody>
                {#each data[ts.key] as row}
                  <tr>
                    {#each Object.values(row) as cell}
                      <td>
                        {#if String(cell).startsWith("https://")}
                          <a href={String(cell)} target="_blank">link</a>
                        {:else}
                          {cell}
                        {/if}
                      </td>
                    {/each}
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </section>
    {/each}

    <!-- Figures -->
    <section id="figures" class="model-section">
      <H2>Figures</H2>
      {#each data.figures as fig}
        <Accordion title={fig.title}>
          {#if fig.imgSrc}
            <img
              src="{GH_RAW}/models/{data.name}/{fig.imgSrc}"
              alt={fig.title}
              class="figure-img"
            />
          {/if}
          {@html fig.text}
        </Accordion>
      {/each}
    </section>

    <!-- Demonstrations -->
    <section id="demonstrations" class="model-section">
      <H2>Demonstrations</H2>
      {#each data.demonstrations as demo}
        <Accordion title={demo.title}>
          {#if demo.imgSrc}
            <img
              src="{GH_RAW}/models/{data.name}/{demo.imgSrc}"
              alt={demo.title}
              class="figure-img"
            />
          {/if}
          {@html demo.text}
        </Accordion>
      {/each}
    </section>
  </main>
</div>

<!-- Zoom popover -->
<Popover size="lg" popovertarget="scheme-zoom" bind:el={popoverEl}>
  {#if zoomSrc}
    <img src={zoomSrc} alt="Zoomed scheme" style="max-width:100%; display:block; margin:auto;" />
  {/if}
</Popover>

<style>
  .model-header {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .doi-link {
    color: rgba(255, 255, 255, 0.75);
    font-size: 0.85rem;
    word-break: break-all;
  }

  .header-actions {
    display: flex;
    gap: var(--space-3);
    align-items: center;
    flex-wrap: wrap;
  }

  .page-layout {
    display: flex;
    min-height: calc(100vh - var(--nav-height, 60px));
  }

  .model-content {
    flex: 1;
    min-width: 0;
    padding: var(--space-8) var(--space-6);
    overflow-y: auto;
  }

  .model-section {
    margin-bottom: var(--space-12);
    scroll-margin-top: 80px;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: var(--space-6);
    align-items: start;
  }

  @media (max-width: 768px) {
    .summary-grid {
      grid-template-columns: 1fr;
    }
  }

  .scheme-btn {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .scheme-img {
    width: 100%;
    display: block;
    transition: opacity 150ms;
  }

  .scheme-btn:hover .scheme-img {
    opacity: 0.85;
  }

  .math-block {
    overflow-x: auto;
    padding: 0.5rem 0;
  }
</style>
