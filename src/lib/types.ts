export interface ModelInfo {
  DOI: string;
  tags: Record<string, string[]>;
}

export interface ModelData {
  [name: string]: ModelInfo;
}

export interface GlossaryRow {
  "Glossary ID": string;
  "Common Abbr.": string;
  "Python Var": string;
}

export interface CsvRow {
  [key: string]: string;
}

export interface FigureItem {
  title: string;
  imgSrc: string | null;
  text: string;
}

export interface MathSection {
  text: string;
  math: string | null;
}

export interface ModelPageData {
  name: string;
  doi: string;
  summary: string;
  ode: MathSection;
  derivedComps: MathSection;
  params: string;
  derivedParams: MathSection;
  rates: MathSection;
  figures: FigureItem[];
  demonstrations: FigureItem[];
  compsData: CsvRow[];
  paramsData: CsvRow[];
  ratesData: CsvRow[];
  derivedCompsData: CsvRow[];
  derivedParamsData: CsvRow[];
}
