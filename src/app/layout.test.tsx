import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import RootLayout from "./layout";

describe("RootLayout", () => {
  it("applies the product Korean font class at the document body", () => {
    const html = renderToString(<RootLayout><main>content</main></RootLayout>);

    expect(html).toContain('class="font-pretendard');
  });
});
