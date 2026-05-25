import type { PageLoad } from "./$types";
import { models, modelNames } from "$lib/models";
import { fetchModelPageData } from "$lib/utils";
import { error } from "@sveltejs/kit";

export const prerender = true;

export function entries() {
  return modelNames.map((name) => ({ name }));
}

export const load: PageLoad = async ({ params, fetch }) => {
  const name = params.name;
  const modelInfo = models[name];
  if (!modelInfo) error(404, `Model "${name}" not found`);

  const data = await fetchModelPageData(fetch, name, modelInfo.DOI);
  return data;
};
