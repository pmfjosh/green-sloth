<script lang="ts">
  import { base } from "$app/paths";
  import { page } from "$app/stores";
  import { onMount, tick } from "svelte";
  import {
    ButtonTab,
    CompareCheckbox,
    H1,
    H3,
    Popover,
    Section,
    SectionHeader,
  } from "@computational-biology-aachen/design";
  import { models, modelNames, GH_RAW } from "$lib/models";
  import { parseCsv, parseGlossary, filterGlossaryByAbbr, filterGlossaryByPythonVar } from "$lib/utils";
  import type { CsvRow, GlossaryRow } from "$lib/types";

  type Tab = "Variables" | "Simulation" | "Information" | "Demonstrations" | "Schemes";
  const tabs: Tab[] = ["Variables", "Simulation", "Information", "Demonstrations", "Schemes"];

  let activeTab = $state<Tab>("Variables");
  let leftModel = $state<string>("");
  let rightModel = $state<string>("");

  // Left color: orange, right color: teal (matching chroma scale used in original)
  const leftColor = "#F19A3E";
  const rightColor = "#3DA480";
  const commonColor = "#8ABEA0";

  // Data state
  interface SideData {
    comps: CsvRow[];
    derivedComps: CsvRow[];
    params: CsvRow[];
    rates: CsvRow[];
    derivedCompsRaw: CsvRow[];
    demonstrations: Array<{ title: string; imgSrc: string | null; text: string }>;
    uniqueVars: string[];
    pythonVars: string[];
  }

  let leftData = $state<SideData | null>(null);
  let rightData = $state<SideData | null>(null);
  let glossary = $state<GlossaryRow[]>([]);
  let commonVars = $state<string[]>([]);
  let commonPythonVars = $state<string[]>([]);
  let loading = $state(false);

  // Information counts
  const infoKeys: Array<{ label: string; key: keyof Pick<SideData, "comps" | "derivedComps" | "params" | "derivedCompsRaw" | "rates"> }> = [
    { label: "ODEs", key: "comps" },
    { label: "Derived Compounds", key: "derivedComps" },
    { label: "Parameters", key: "params" },
    { label: "Derived Parameters", key: "derivedCompsRaw" },
    { label: "Rates", key: "rates" },
  ];

  // Simulation state
  let pfd = $state(500);
  let simVar = $state("");
  let compareWithPrevious = $state(false);
  let plotContainer: HTMLDivElement | undefined = $state();
  let Plotly: any = null;

  // Zoom popover
  let zoomSrc = $state<string | null>(null);
  let popoverEl = $state<HTMLDivElement | null | undefined>(null);

  function openZoom(src: string) {
    zoomSrc = src;
    popoverEl?.showPopover();
  }

  // Demonstration selections
  let leftDemoSelection = $state<string>("");
  let rightDemoSelection = $state<string>("");

  async function fetchSideData(name: string): Promise<SideData> {
    const [comps, params, rates, derivedComps, derivedCompsRaw] = await Promise.all([
      parseCsv(fetch, name, "comps"),
      parseCsv(fetch, name, "params"),
      parseCsv(fetch, name, "rates"),
      parseCsv(fetch, name, "derived_comps"),
      parseCsv(fetch, name, "derived_params"),
    ]);

    // Fetch README for demonstrations
    const res = await fetch(`${GH_RAW}/models/${name}/README.md`);
    const readme = await res.text();
    const demoSection = readme.match(/### Demonstrations(.*)/ms)?.[0] ?? "";
    const demoRegex = /<details>\s*<summary>(.*?)<\/summary>\s*([\s\S]*?)<\/details>/g;
    const demonstrations: SideData["demonstrations"] = [];
    let m: RegExpExecArray | null;
    while ((m = demoRegex.exec(demoSection)) !== null) {
      const title = m[1].trim();
      const content = m[2];
      const imgMatch = content.match(/<img[^>]+src=['"]([^'"]+)['"]/);
      demonstrations.push({
        title,
        imgSrc: imgMatch ? imgMatch[1] : null,
        text: content.replace(/<img[^>]*>/g, "").trim(),
      });
    }

    return { comps, params, rates, derivedComps, derivedCompsRaw: derivedCompsRaw, demonstrations, uniqueVars: [], pythonVars: [] };
  }

  function computeVariables(left: SideData, right: SideData, gloss: GlossaryRow[]) {
    const abbrMap = filterGlossaryByAbbr(gloss);
    const pythonMap = filterGlossaryByPythonVar(gloss);

    const leftKeys = [...left.comps.map(r => r["Glossary ID"]).filter(Boolean),
                      ...left.derivedComps.map(r => r["Glossary ID"]).filter(Boolean)];
    const rightKeys = [...right.comps.map(r => r["Glossary ID"]).filter(Boolean),
                       ...right.derivedComps.map(r => r["Glossary ID"]).filter(Boolean)];

    const common = leftKeys.filter(k => rightKeys.includes(k));
    const leftUnique = leftKeys.filter(k => !common.includes(k));
    const rightUnique = rightKeys.filter(k => !common.includes(k));

    left.uniqueVars = leftUnique.map(k => abbrMap[k] ?? k);
    right.uniqueVars = rightUnique.map(k => abbrMap[k] ?? k);
    commonVars = common.map(k => abbrMap[k] ?? k);
    commonPythonVars = common.map(k => pythonMap[k] ?? k);
  }

  async function onModelChange(side: "left" | "right") {
    loading = true;
    const name = side === "left" ? leftModel : rightModel;
    if (!name) {
      if (side === "left") leftData = null;
      else rightData = null;
      loading = false;
      return;
    }

    const data = await fetchSideData(name);

    if (side === "left") leftData = data;
    else rightData = data;

    if (glossary.length === 0) {
      glossary = await parseGlossary(fetch);
    }

    if (leftData && rightData) {
      computeVariables(leftData, rightData, glossary);
    }

    loading = false;
    if (activeTab === "Simulation") await updateChart();
  }

  // Simulation
  async function getSim(modelName: string, pfdVal: number): Promise<Record<string, Record<string, number>>> {
    const res = await fetch(`${base}/simulations/${modelName}/${pfdVal}.json`);
    return res.json();
  }

  async function updateChart() {
    if (!Plotly || !plotContainer) return;
    if (!simVar) { Plotly.react(plotContainer, [], {}); return; }

    const layout = {
      margin: { t: 15, b: 40, r: 10, l: 60 },
      xaxis: { title: { text: "Time [s]" }, showgrid: false, ticks: "outside", ticklen: 5 },
      yaxis: { title: { text: "Concentration" }, exponentformat: "e", showgrid: false, ticks: "outside", ticklen: 5 },
      legend: { orientation: "h", x: 0.5, xanchor: "center", y: 1.1, yanchor: "bottom" },
      shapes: [
        { type: "rect", xref: "x", yref: "paper", x0: "0", x1: "10", y0: 0, y1: 1, fillcolor: "#d3d3d3", opacity: 0.2, line: { width: 0 } },
        { type: "line", x0: 5, y0: 0.1, x1: 5, y1: 0.1, xref: "x", yref: "paper", line: { color: "black", width: 0 } },
      ],
      annotations: [{ x: 5, y: 0.1, text: "PPFD = 50", xref: "x", yref: "paper", showarrow: false, font: { size: 14 } }],
    };

    const traces: any[] = [];

    if (leftModel) {
      try {
        const sim = await getSim(leftModel, pfd);
        const varData = sim[simVar];
        if (varData) {
          traces.push({ x: Object.keys(varData), y: Object.values(varData), type: "scatter", mode: "lines", name: leftModel, line: { color: leftColor } });
        }
      } catch {}
    }
    if (rightModel) {
      try {
        const sim = await getSim(rightModel, pfd);
        const varData = sim[simVar];
        if (varData) {
          traces.push({ x: Object.keys(varData), y: Object.values(varData), type: "scatter", mode: "lines", name: rightModel, line: { color: rightColor } });
        }
      } catch {}
    }

    Plotly.react(plotContainer, traces, layout);
  }

  $effect(() => {
    if (activeTab === "Simulation" && Plotly) {
      updateChart();
    }
  });

  $effect(() => {
    // watch pfd and simVar for re-render
    void pfd;
    void simVar;
    if (Plotly && plotContainer && activeTab === "Simulation") updateChart();
  });

  onMount(async () => {
    // @ts-ignore — no types for plotly.js-dist
    Plotly = (await import("plotly.js-dist")).default;

    // Pre-select from ?select= URL param
    const select = $page.url.searchParams.get("select");
    if (select && models[select]) {
      leftModel = select;
      await onModelChange("left");
    }
  });
</script>

<SectionHeader>
  <H1 color="light">Model Comparison</H1>
</SectionHeader>

<Section variant="light">
  <div class="selectors">
    <select bind:value={leftModel} onchange={() => onModelChange("left")} class="model-select" style="border-color: {leftColor}">
      <option value="" disabled>Select left model</option>
      {#each modelNames as name}
        <option value={name}>{name}</option>
      {/each}
    </select>
    <select bind:value={rightModel} onchange={() => onModelChange("right")} class="model-select" style="border-color: {rightColor}">
      <option value="" disabled>Select right model</option>
      {#each modelNames as name}
        <option value={name}>{name}</option>
      {/each}
    </select>
  </div>

  {#if loading}
    <p class="hint">Loading…</p>
  {/if}

  <div class="tab-bar">
    {#each tabs as tab}
      <ButtonTab selected={activeTab === tab} onclick={() => (activeTab = tab)}>
        {tab}
      </ButtonTab>
    {/each}
  </div>

  <!-- VARIABLES TAB -->
  {#if activeTab === "Variables"}
    <div class="variables-layout">
      <div>
        <h3 class="compare-side-header" style="color:{leftColor}">{leftModel || "Left Model"}</h3>
        <div class="var-list">
          {#each leftData?.uniqueVars ?? [] as v}
            <span class="var-pill">{v}</span>
          {/each}
        </div>
      </div>
      <div class="venn-col">
        <img src="{base}/img/venn_diagramm.svg" alt="Venn diagram" class="venn-img" />
      </div>
      <div>
        <h3 class="compare-side-header" style="color:{rightColor}">{rightModel || "Right Model"}</h3>
        <div class="var-list">
          {#each rightData?.uniqueVars ?? [] as v}
            <span class="var-pill">{v}</span>
          {/each}
        </div>
      </div>
    </div>
    {#if commonVars.length > 0}
      <div class="common-vars">
        <p class="hint" style="text-align:center">Click an overlapping variable to plot it in the Simulation tab.</p>
        <div class="var-list" style="justify-content:center">
          {#each commonVars as v, i}
            <button
              class="var-pill clickable"
              style="color:{commonColor}"
              onclick={() => { simVar = commonPythonVars[i]; activeTab = "Simulation"; }}
            >
              {v}
            </button>
          {/each}
        </div>
      </div>
    {/if}
  {/if}

  <!-- SIMULATION TAB -->
  {#if activeTab === "Simulation"}
    <div class="sim-layout">
      <div class="sim-controls">
        <H3>Choose which variable to plot!</H3>
        <p class="hint">All simulations follow the initial conditions of the authors. The only aspect that varies is the PPFD, which you can choose below. The plots show the change of concentration over time starting from a dark-adapted state (PPFD = 50).</p>
        <select bind:value={simVar} onchange={updateChart} class="demo-select">
          <option value="">Select Variable</option>
          {#each commonPythonVars as v, i}
            <option value={v}>{commonVars[i] ?? v}</option>
          {/each}
        </select>
        <div class="slider-row">
          <span>PPFD: {pfd}</span>
          <input type="range" min="100" max="1400" step="100" bind:value={pfd} />
        </div>
        <CompareCheckbox bind:checked={compareWithPrevious} label="Compare with previous simulation" />
      </div>
      <div class="plot-area" bind:this={plotContainer}></div>
    </div>
  {/if}

  <!-- INFORMATION TAB -->
  {#if activeTab === "Information"}
    <div class="compare-grid">
      <div>
        <h3 class="compare-side-header" style="color:{leftColor}">{leftModel || "Left Model"}</h3>
        <div class="info-grid">
          {#each infoKeys as ik}
            <div class="info-stat">
              <span class="stat-label">{ik.label}</span>
              <span class="stat-value">{leftData?.[ik.key]?.length ?? "—"}</span>
            </div>
          {/each}
        </div>
      </div>
      <div>
        <h3 class="compare-side-header" style="color:{rightColor}">{rightModel || "Right Model"}</h3>
        <div class="info-grid">
          {#each infoKeys as ik}
            <div class="info-stat">
              <span class="stat-label">{ik.label}</span>
              <span class="stat-value">{rightData?.[ik.key]?.length ?? "—"}</span>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  <!-- DEMONSTRATIONS TAB -->
  {#if activeTab === "Demonstrations"}
    <div class="compare-grid">
      {#each (["left", "right"] as const) as side}
        {@const sideData = side === "left" ? leftData : rightData}
        {@const sideModel = side === "left" ? leftModel : rightModel}
        {@const sel = side === "left" ? leftDemoSelection : rightDemoSelection}
        <div>
          <h3 class="compare-side-header" style="color:{side === 'left' ? leftColor : rightColor}">{sideModel || (side === 'left' ? 'Left Model' : 'Right Model')}</h3>
          {#if sideData}
            <select
              class="demo-select"
              value={sel}
              onchange={(e) => {
                if (side === 'left') leftDemoSelection = (e.target as HTMLSelectElement).value;
                else rightDemoSelection = (e.target as HTMLSelectElement).value;
              }}
            >
              <option value="">Select Demonstration</option>
              {#each sideData.demonstrations as demo}
                <option value={demo.title}>{demo.title}</option>
              {/each}
            </select>
            {#each sideData.demonstrations as demo}
              {#if demo.title === sel}
                <div class="demo-box">
                  {#if demo.imgSrc}
                    <img
                      src="{GH_RAW}/models/{sideModel}/{demo.imgSrc}"
                      alt={demo.title}
                      class="figure-img"
                    />
                  {/if}
                  {@html demo.text}
                </div>
              {/if}
            {/each}
          {:else}
            <p class="hint">Select a model to see demonstrations.</p>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  <!-- SCHEMES TAB -->
  {#if activeTab === "Schemes"}
    <div class="compare-grid">
      {#each (["left", "right"] as const) as side}
        {@const sideModel = side === "left" ? leftModel : rightModel}
        <div>
          <h3 class="compare-side-header" style="color:{side === 'left' ? leftColor : rightColor}">{sideModel || (side === 'left' ? 'Left Model' : 'Right Model')}</h3>
          {#if sideModel}
            <button
              class="scheme-btn"
              onclick={() => openZoom(`${GH_RAW}/models/${sideModel}/${sideModel}_scheme.svg`)}
              aria-label="Zoom scheme"
            >
              <img
                src="{GH_RAW}/models/{sideModel}/{sideModel}_scheme.svg"
                alt="{sideModel} scheme"
                class="scheme-img"
              />
            </button>
          {:else}
            <p class="hint">Select a model to see its scheme.</p>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</Section>

<Popover size="lg" popovertarget="scheme-zoom" bind:el={popoverEl}>
  {#if zoomSrc}
    <img src={zoomSrc} alt="Zoomed scheme" style="max-width:100%;display:block;margin:auto;" />
  {/if}
</Popover>

<style>
  .compare-side-header {
    font-size: var(--text-xl);
    font-weight: 600;
    margin: 0 0 var(--space-2);
  }

  .selectors {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    width: 100%;
    max-width: 60rem;
  }

  .model-select {
    padding: 0.6rem 1rem;
    border: 2px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 1rem;
    font-family: inherit;
    background: var(--color-surface);
    color: var(--color-text);
    font-weight: 600;
    cursor: pointer;
    width: 100%;
  }

  .variables-layout {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 1.5rem;
    align-items: start;
    width: 100%;
  }

  @media (max-width: 768px) {
    .variables-layout {
      grid-template-columns: 1fr 1fr;
    }
    .venn-col { display: none; }
    .selectors { grid-template-columns: 1fr; }
  }

  .venn-img {
    width: 100%;
    max-width: 200px;
  }

  .var-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.5rem;
  }

  .var-pill {
    padding: 0.2rem 0.6rem;
    border-radius: 9999px;
    font-size: 0.8rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
  }

  .var-pill.clickable {
    cursor: pointer;
    transition: background 150ms;
    font-family: inherit;
  }

  .var-pill.clickable:hover {
    background: var(--color-border);
  }

  .common-vars {
    margin-top: 1.5rem;
    border-top: 1px solid var(--color-border);
    padding-top: 1rem;
  }

  .sim-layout {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 2rem;
    align-items: start;
  }

  @media (max-width: 900px) {
    .sim-layout { grid-template-columns: 1fr; }
  }

  .sim-controls {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .plot-area {
    min-height: 400px;
    width: 100%;
  }

  .slider-row {
    display: grid;
    grid-template-columns: 7rem 1fr;
    align-items: center;
    gap: 1rem;
  }

  .slider-row input[type="range"] {
    width: 100%;
    accent-color: var(--color-primary);
  }

  .compare-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    width: 100%;
  }

  @media (max-width: 768px) {
    .compare-grid { grid-template-columns: 1fr; }
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 0.75rem;
    margin-top: 0.75rem;
  }

  .info-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    text-align: center;
    gap: 0.25rem;
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .stat-value {
    font-size: 1.4rem;
    font-weight: var(--weight-bold);
    color: var(--color-primary);
  }

  .scheme-btn {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    width: 100%;
  }

  .scheme-img {
    width: 100%;
    border-radius: var(--radius-md);
    transition: opacity 150ms;
  }

  .scheme-btn:hover .scheme-img { opacity: 0.85; }

  .demo-box {
    margin-top: 1rem;
  }

  .figure-img {
    max-width: 100%;
    max-height: 20rem;
    display: block;
    margin: 0 auto 1rem;
  }

  .hint {
    color: var(--color-text-muted);
    font-size: 0.9rem;
  }

  .demo-select {
    width: 100%;
    padding: 0.4rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 0.95rem;
    background: var(--color-surface);
    color: var(--color-text);
    font-family: inherit;
  }
</style>
