<script lang="ts">
  import CardContributor from "$lib/components/CardContributor.svelte";
  import contributors from "$lib/contributors";
  import {
    H1,
    Section,
    SectionHeader,
  } from "@computational-biology-aachen/design";

  const sorted = Object.keys(contributors)
    .sort()
    .map((key) => contributors[key]);
</script>

<svelte:head>
  <title>Contributors - GreenSloth</title>
</svelte:head>

<SectionHeader width="narrow">
  <H1 color="light">Contributors</H1>
</SectionHeader>

<Section
  variant="light"
  width="narrow"
>
  <div class="grid">
    {#each sorted as contributor (contributor.key)}
      <CardContributor contributor={contributor} />
    {/each}
  </div>
</Section>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
    gap: var(--space-6);
    margin: 0 auto;
    width: 100%;
    max-width: var(--max-width);
  }
</style>
