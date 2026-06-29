import type { ModelMeta } from "$lib/types";

export const meta: ModelMeta = {
  slug: "hahn1987",
  title: "Hahn 1987, Ann. Bot.",
  DOI: "10.1093/oxfordjournals.aob.a087432",
  tags: {
    "Part of Photosynthesis": ["CBB Cycle"],
  },
  analyses: [
    {
      type: "timecourse",
      tEnd: 100,
      nTimePoints: 500,
      // Variables span several orders of magnitude; auto-split them into
      // per-magnitude subplots so small-valued species stay readable.
      plot: { type: "magnitude" },
    },
  ],
};
