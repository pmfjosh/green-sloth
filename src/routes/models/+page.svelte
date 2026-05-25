<script lang="ts">
  import { base } from "$app/paths";
  import { page } from "$app/stores";
  import { CardModel, H1, Section, SectionHeader } from "@computational-biology-aachen/design";
  import { models } from "$lib/models";
  import { GH_RAW } from "$lib/models";

  // Collect all tag categories and their tags
  const allCategories: Record<string, Set<string>> = {};
  for (const info of Object.values(models)) {
    for (const [cat, tags] of Object.entries(info.tags)) {
      if (!allCategories[cat]) allCategories[cat] = new Set();
      for (const t of tags) allCategories[cat].add(t);
    }
  }

  // Active tags: category → Set of active tag strings
  let activeTags = $state<Record<string, Set<string>>>({});
  let searchQuery = $state("");

  // Pre-select from ?apparatus= URL param
  $effect(() => {
    const apparatus = $page.url.searchParams.get("apparatus");
    if (apparatus) {
      const cat = "Part of Photosynthesis";
      activeTags = { [cat]: new Set([apparatus]) };
    }
  });

  function toggleTag(cat: string, tag: string) {
    const current = activeTags[cat] ? new Set(activeTags[cat]) : new Set<string>();
    if (current.has(tag)) {
      current.delete(tag);
    } else {
      current.add(tag);
    }
    activeTags = { ...activeTags, [cat]: current };
  }

  function isTagActive(cat: string, tag: string): boolean {
    return activeTags[cat]?.has(tag) ?? false;
  }

  function hasActiveFilters(): boolean {
    return Object.values(activeTags).some((s) => s.size > 0);
  }

  // Filtered model names
  const filteredModels = $derived(
    Object.entries(models).filter(([name, info]) => {
      const matchesSearch =
        !searchQuery || name.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (!hasActiveFilters()) return true;

      // AND logic across categories: model must match at least one active tag per category
      for (const [cat, activeCatTags] of Object.entries(activeTags)) {
        if (activeCatTags.size === 0) continue;
        const modelTags = info.tags[cat] ?? [];
        const hasAny = [...activeCatTags].some((t) => modelTags.includes(t));
        if (!hasAny) return false;
      }
      return true;
    })
  );
</script>

<SectionHeader>
  <H1 color="light">Models</H1>
</SectionHeader>

<Section variant="light" width="narrow">
  <div class="search-row">
    <input
      type="text"
      placeholder="Search models…"
      bind:value={searchQuery}
      class="search-input"
    />
  </div>

  {#each Object.entries(allCategories) as [cat, tags]}
    <div class="tag-category">
      <p class="tag-cat-label">{cat}</p>
      <div class="tag-row">
        {#each [...tags] as tag}
          <button
            class="tag-pill"
            class:active={isTagActive(cat, tag)}
            onclick={() => toggleTag(cat, tag)}
          >
            {tag}
          </button>
        {/each}
      </div>
    </div>
  {/each}

  <p class="hint">As GreenSloth is still in its infancy, many more models shall be added soon!</p>
</Section>

<Section variant="surface">
  <div class="model-card-grid">
    {#each filteredModels as [name]}
      <CardModel
        {name}
        href="{base}/model/{name}"
        image="{GH_RAW}/models/{name}/{name}_scheme.svg"
      />
    {/each}
    {#if filteredModels.length === 0}
      <p class="no-results">No models match the current filters.</p>
    {/if}
  </div>
</Section>

<style>
  .search-row {
    width: 100%;
  }

  .search-input {
    width: 100%;
    box-sizing: border-box;
    padding: 0.6rem 1rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    font-size: 1rem;
    font-family: inherit;
    background: var(--color-surface);
    color: var(--color-text);
  }

  .search-input:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .tag-category {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .tag-cat-label {
    margin: 0;
    font-weight: var(--weight-semibold);
    font-size: 0.85rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .tag-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .tag-pill {
    padding: 0.3rem 0.75rem;
    border-radius: 9999px;
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-text);
    font-size: 0.85rem;
    font-family: inherit;
    cursor: pointer;
    transition: all 150ms;
  }

  .tag-pill:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .tag-pill.active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
    font-weight: 500;
  }

  .hint {
    color: var(--color-text-muted);
    font-size: 0.9rem;
  }

  .model-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1.5rem;
    width: 100%;
    max-width: var(--max-width);
    margin: 0 auto;
    padding: 0 var(--space-4);
    box-sizing: border-box;
  }

  .no-results {
    color: var(--color-text-muted);
    grid-column: 1 / -1;
  }
</style>
