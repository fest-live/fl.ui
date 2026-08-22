import test from "node:test";
import assert from "node:assert/strict";
import { defaultIconScaleForDisplay, inferIconDisplay, isAutoLinkFaviconUrl } from "../src/ui/speed-dial/tile-icon.ts";

test("auto S2 paste favicon is not treated as a chosen bitmap", () => {
    assert.equal(
        isAutoLinkFaviconUrl("https://www.google.com/s2/favicons?domain=example.com&sz=256"),
        true
    );
    assert.equal(isAutoLinkFaviconUrl("https://example.com/icon.png"), false);
});

test("unset display + paste S2 URL infers glyph so the link icon shows", () => {
    assert.equal(
        inferIconDisplay({
            iconUrl: "https://www.google.com/s2/favicons?domain=example.com&sz=256"
        }),
        "glyph"
    );
});

test("explicit colored and bookmark favicons stay bitmaps", () => {
    assert.equal(
        inferIconDisplay({
            iconDisplay: "colored",
            iconUrl: "https://www.google.com/s2/favicons?domain=example.com&sz=256"
        }),
        "colored"
    );
    assert.equal(
        inferIconDisplay({
            iconUrl: "https://www.google.com/s2/favicons?domain=example.com&sz=256",
            isBookmarkFavicon: true
        }),
        "colored"
    );
    assert.equal(
        inferIconDisplay({ iconUrl: "https://cdn.example/app.png" }),
        "colored"
    );
});

test("glyph tiles default to compact 0.78 unless scale is explicit", () => {
    assert.equal(defaultIconScaleForDisplay("glyph"), "compact");
    assert.equal(defaultIconScaleForDisplay("glyph", "auto"), "compact");
    assert.equal(defaultIconScaleForDisplay("glyph", "fill"), "fill");
    assert.equal(defaultIconScaleForDisplay("colored", "auto"), "auto");
});
