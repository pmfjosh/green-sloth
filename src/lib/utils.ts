import Papa from "papaparse";
import { marked } from "marked";
import type { CsvRow, FigureItem, GlossaryRow, MathSection, ModelPageData } from "./types";
import { GH_RAW } from "./models";

function cleanMathStr(text: string): string | null {
  const mathLines = text.match(/(?<=`math)[^`]*(?=\n```)/gms);
  if (!mathLines) return null;
  let mathHTML = "\\begin{align}";
  mathLines.forEach((row) => {
    const cleaned = row.match(/(?<=\n)[^`]*/m)?.[0] ?? "";
    let r = cleaned.replace(/[^&]=/mg, " &=");
    r = r.replace("\\begin{align}", "").replace("\\end{align}", "");
    mathHTML += r;
    if (!row.endsWith("\\\\")) mathHTML += "\\\\";
  });
  mathHTML += "\\end{align}";
  return mathHTML;
}

function parseFigureDetails(section: string): FigureItem[] {
  const regex = /<details>\s*<summary>(.*?)<\/summary>\s*([\s\S]*?)<\/details>/g;
  const items: FigureItem[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(section)) !== null) {
    const title = m[1].trim();
    const content = m[2];
    const imgMatch = content.match(/<img[^>]+src=['"]([^'"]+)['"]/);
    const imgSrc = imgMatch ? imgMatch[1] : null;
    const text = marked.parse(content.replace(/<img[^>]*>/g, "").trim()) as string;
    items.push({ title, imgSrc, text });
  }
  return items;
}

export async function parseCsv(fetchFn: typeof fetch, modelName: string, file: string): Promise<CsvRow[]> {
  const url = `${GH_RAW}/models/${modelName}/model_info/${file}.csv`;
  const res = await fetchFn(url);
  const text = await res.text();
  const result = Papa.parse<CsvRow>(text, { header: true, skipEmptyLines: true });
  return result.data;
}

export async function parseGlossary(fetchFn: typeof fetch): Promise<GlossaryRow[]> {
  const url = `${GH_RAW}/models/comps_glossary.csv`;
  const res = await fetchFn(url);
  const text = await res.text();
  const result = Papa.parse<GlossaryRow>(text, { header: true, skipEmptyLines: true });
  return result.data;
}

export async function fetchModelPageData(fetchFn: typeof fetch, name: string, doi: string): Promise<ModelPageData> {
  const [readmeRes, compsData, paramsData, ratesData, derivedCompsData, derivedParamsData] = await Promise.all([
    fetchFn(`${GH_RAW}/models/${name}/README.md`),
    parseCsv(fetchFn, name, "comps"),
    parseCsv(fetchFn, name, "params"),
    parseCsv(fetchFn, name, "rates"),
    parseCsv(fetchFn, name, "derived_comps"),
    parseCsv(fetchFn, name, "derived_params"),
  ]);

  const readme = await readmeRes.text();

  const summaryMatch = readme.match(new RegExp(`#\\s*${name}\\s*([\\s\\S]*?)\\s*##\\s*Installation`));
  const summary = summaryMatch ? (marked.parse(summaryMatch[1]) as string) : "";

  const odeSection = readme.match(/#### Part of ODE system(.*)#### Conserved quantities/ms)?.[0] ?? "";
  const conservedSection = readme.match(/#### Conserved quantities(.*)### Parameters/ms)?.[0] ?? "";
  const parametersSection = readme.match(/### Parameters(.*)#### Derived Parameters/ms)?.[0] ?? "";
  const derivedParamsSection = readme.match(/#### Derived Parameters(.*)### Reaction Rates/ms)?.[0] ?? "";
  const ratesSection = readme.match(/### Reaction Rates(.*)### Figures/ms)?.[0] ?? "";
  const figuresSection = readme.match(/### Figures(.*)### Demonstrations/ms)?.[0] ?? "";
  const demonstrationsSection = readme.match(/### Demonstrations(.*)/ms)?.[0] ?? "";

  return {
    name,
    doi,
    summary,
    ode: { text: odeSection, math: cleanMathStr(odeSection) },
    derivedComps: { text: conservedSection, math: cleanMathStr(conservedSection) },
    params: parametersSection,
    derivedParams: { text: derivedParamsSection, math: cleanMathStr(derivedParamsSection) },
    rates: { text: ratesSection, math: cleanMathStr(ratesSection) },
    figures: parseFigureDetails(figuresSection),
    demonstrations: parseFigureDetails(demonstrationsSection),
    compsData,
    paramsData,
    ratesData,
    derivedCompsData,
    derivedParamsData,
  };
}

export function filterGlossaryByAbbr(gloss: GlossaryRow[]): Record<string, string> {
  return Object.fromEntries(gloss.map((r) => [r["Glossary ID"], r["Common Abbr."]]));
}

export function filterGlossaryByPythonVar(gloss: GlossaryRow[]): Record<string, string> {
  return Object.fromEntries(gloss.map((r) => [r["Glossary ID"], r["Python Var"]]));
}
