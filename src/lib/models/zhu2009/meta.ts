import type { ModelMeta } from "$lib/types";

export const meta: ModelMeta = {
  slug: "zhu2009",
  title: "Zhu 2009",
  DOI: "https://doi.org/10.1016/j.nonrwa.2008.01.021",
  tags: {
    "Part of Photosynthesis": ["CBB Cycle"],
    Demonstrations: [],
  },
  analyses: [
    {
      type: "timecourse",
      title: "Time course",
      tEnd: 100,
      nTimePoints: 500,
      // Variables span several orders of magnitude; auto-split them into
      // per-magnitude subplots so small-valued species stay readable.
      plot: { type: "magnitude" },
    },
  ],
};
