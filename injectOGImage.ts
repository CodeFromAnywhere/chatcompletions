/** NB: this doesn't work yet because BAD REQUEST 400 Invalid URI: [The encoded slash character is not allowed]
 *
 * (for the thum api)
 * */

export function injectOGImage(html: string, url: string): string {
  // Check if og:image already exists
  if (
    html.includes('property="og:image"') ||
    html.includes("property='og:image'")
  ) {
    return html;
  }

  // Create the meta tag
  const metaTag = `<meta property="og:image" content="https://image.thum.io/get/${url}" />`;

  // Insert before closing head tag
  return html.replace("</head>", `${metaTag}</head>`);
}
