import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";
import { resetDb } from "../api/db";

class RO { observe() {} unobserve() {} disconnect() {} }
Object.assign(globalThis, { ResizeObserver: RO });
if (!window.matchMedia) window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as never;
Element.prototype.scrollIntoView = function () {};
Element.prototype.hasPointerCapture = () => false;
Element.prototype.releasePointerCapture = () => {};
URL.createObjectURL = () => "blob:test";
URL.revokeObjectURL = () => {};
HTMLAnchorElement.prototype.click = function () {};

configure({ asyncUtilTimeout: 5000 });

beforeEach(() => { localStorage.clear(); resetDb(); });
afterEach(() => cleanup());
