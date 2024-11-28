import * as marked from "marked";
import * as yaml from "@std/yaml";
import Papa from "papaparse";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import { parse as parseToml, stringify as stringifyToml } from "@ltd/j-toml";

/**
 * Recursively flatten a marked token and return something if a find function is met
 */
export const flattenMarkedTokenRecursive = (
  token: marked.Token,
  findFunction: (token: any) => boolean,
): marked.Token[] => {
  if (findFunction(token)) {
    return [token];
  }

  if (token.type === "table") {
    const header = token.header
      .map((token: any) => {
        const result = token.tokens
          .map((x: any) => flattenMarkedTokenRecursive(x, findFunction))
          .flat();
        return result;
      })
      .flat();

    const rows = token.rows
      .map((row: any) => {
        const result = row
          .map((token: any) => {
            const result = token.tokens
              .map((x: any) => flattenMarkedTokenRecursive(x, findFunction))
              .flat();

            return result;
          })
          .flat();

        return result;
      })
      .flat();

    return [header, rows].flat();
  }

  if (token.type === "list") {
    const result = token.items
      .map((token: any) => {
        const result = token.tokens
          .map((x: any) => flattenMarkedTokenRecursive(x, findFunction))
          .flat();
        return result;
      })
      .flat();

    return result;
  }

  if (
    token.type === "del" ||
    token.type === "em" ||
    token.type === "heading" ||
    token.type === "link" ||
    token.type === "paragraph" ||
    token.type === "strong"
  ) {
    if (!token.tokens) {
      return [];
    }
    const result = token.tokens
      .map((x: any) => flattenMarkedTokenRecursive(x, findFunction))
      .flat();
    return result;
  }

  return [];
};

/**
 * find all items that match a token, recursively in all nested things
 */
export const flattenMarkdownString = (
  markdownString: string,
  findFunction: (token: marked.Token) => boolean,
): marked.Token[] => {
  const tokenList = marked.lexer(markdownString);
  const result = tokenList
    .map((x) => flattenMarkedTokenRecursive(x, findFunction))
    .filter((x) => !!x)
    .map((x) => x!)
    .flat();

  return result;
};
/**
 * find all codeblocks  (stuff between triple bracket)
 *
 * ```
 * here
 * is
 * example
 * ```
 *
 */
export const findCodeblocks = (
  markdownString: string,
): { text: string; lang?: string }[] => {
  const result = flattenMarkdownString(
    markdownString,
    (token) => token.type === "code",
  );

  const codesblocks: { text: string; lang?: string }[] = result
    .map((token) => {
      if (token.type !== "code") return;

      const { text, lang } = token;
      return { text, lang };
    })
    .filter((x) => !!x)
    .map((x) => x!);

  return codesblocks;
};

const tryParseJson = (text: string) => {
  try {
    const data = JSON.parse(text);
    return { data, text: JSON.stringify(data, undefined, 2), lang: "json" };
  } catch (e) {
    return { error: "Couldn't parse JSON", text };
  }
};

const tryParseYaml = (text: string) => {
  try {
    const data = yaml.parse(text) as any;
    return { data, text, lang: "yaml" };
  } catch (e) {
    return { error: "Couldn't parse YAML", text };
  }
};

export const tryParseXml = (text: string) => {
  try {
    // Check if it looks like XML before attempting parse
    if (!text.trim().startsWith("<")) {
      return { error: "Doesn't look like XML", text };
    }

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      preserveOrder: true,
    });

    const data = parser.parse(text);

    // Rebuild XML string with consistent formatting
    const builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      format: true,
      indentBy: "  ",
    });

    return {
      data,
      text: builder.build(data),
      lang: "xml",
    };
  } catch (e) {
    return {
      error: `Couldn't parse XML: ${(e as Error).message}`,
      text,
    };
  }
};

export const tryParseCsv = (text: string) => {
  try {
    // Quick validation - check if there are commas or semicolons
    if (!text.includes(",") && !text.includes(";")) {
      return { error: "Doesn't look like CSV", text };
    }

    const result = Papa.parse(text, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      delimitersToGuess: [",", ";", "\t", "|"],
    });

    if (result.errors.length > 0) {
      return {
        error: `CSV parse errors: ${result.errors
          .map((e) => e.message)
          .join(", ")}`,
        text,
      };
    }

    // If we only got one column, probably not a CSV
    if (result.meta.fields && result.meta.fields.length <= 1) {
      return { error: "Only one column found - probably not CSV", text };
    }

    // Rebuild CSV string with consistent formatting
    const rebuiltCsv = Papa.unparse(result.data, {
      quotes: true, // Always quote fields
      delimiter: ",", // Use comma consistently
    });

    return {
      data: result.data as any,
      text: rebuiltCsv,
      lang: "csv",
    };
  } catch (e) {
    return {
      error: `Couldn't parse CSV: ${(e as Error).message}`,
      text,
    };
  }
};

export const tryParseToml = (text: string) => {
  try {
    // Quick validation - check for typical TOML patterns
    if (!text.includes("=") && !text.includes("[")) {
      return { error: "Doesn't look like TOML", text };
    }

    const data: any = parseToml(text, 1, undefined, undefined, {
      literal: true, // Preserve exact string content
      multi: true, // Support multiline strings
    });

    // TOML.stringify is used to ensure consistent formatting
    return {
      data,
      text: stringifyToml(data, { newline: "\n", indent: 2 }),
      lang: "toml",
    };
  } catch (e) {
    return {
      error: `Couldn't parse TOML: ${(e as Error).message}`,
      text,
    };
  }
};

export const parseCodeblock = <T = any>(
  text: string,
  lang?: string,
): { data?: T; error?: string; text: string; lang?: string } => {
  if (lang === "md" || lang === "markdown") {
    return { text, lang: "md" };
  }

  if (
    lang === "html" ||
    text?.startsWith("<!DOCTYPE html>") ||
    text?.startsWith("<html")
  ) {
    return { text, lang: "html" };
  }

  if (lang === "json") {
    return tryParseJson(text);
  }

  if (lang === "yaml") {
    return tryParseYaml(text);
  }

  if (lang === "toml") {
    return tryParseToml(text);
  }
  if (lang === "xml") {
    return tryParseXml(text);
  }

  if (lang === "csv") {
    return tryParseCsv(text);
  }

  // if not specified, try them all in the same order i tried them above
  const json = tryParseJson(text);
  if (!json.error) {
    return json;
  }
  const yaml = tryParseYaml(text);
  if (!yaml.error) {
    return yaml;
  }
  const toml = tryParseToml(text);
  if (!toml.error) {
    return toml;
  }
  const xml = tryParseXml(text);
  if (!xml.error) {
    return xml;
  }

  const csv = tryParseCsv(text);
  if (!csv.error) {
    return csv;
  }

  return { error: "Unidentified language", text };
};

/**
 * Finds all codeblocks in a markdown string and tries to parse them in JSON, YAML, CSV, or XML
 */
export const findAndParseCodeblocks = (markdownString: string) => {
  const codeblocks = findCodeblocks(markdownString);
  const parses = codeblocks.map((item) => parseCodeblock(item.text, item.lang));
  return parses;
};
