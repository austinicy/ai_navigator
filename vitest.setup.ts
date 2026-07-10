import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Auto-cleanup the DOM between @testing-library/react render() calls.
// @testing-library/react registers its own afterEach only when a global
// afterEach exists (vitest globals: true). This repo uses explicit imports
// (no globals), so we register cleanup here.
afterEach(() => {
  cleanup();
});
