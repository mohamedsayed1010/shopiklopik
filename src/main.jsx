import { StrictMode, startTransition } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "./index.css";
import App from "./App.jsx";
import { HelmetProvider } from "react-helmet-async";

function registerServiceWorker() {
  registerSW({ immediate: true });
}

if (document.readyState === "complete") registerServiceWorker();
else window.addEventListener("load", registerServiceWorker, { once: true });

const rootElement = document.getElementById("root");

const SHELL_WAIT_MS = 1500;

function afterShellHeroPaint() {
  const hero = rootElement.querySelector("img[data-shell-hero]");

  const canObserve =
    typeof PerformanceObserver !== "undefined" &&
    PerformanceObserver.supportedEntryTypes?.includes("largest-contentful-paint");

  if (
    !hero ||
    !canObserve ||
    window.location.pathname !== "/" ||
    document.visibilityState !== "visible"
  ) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let observer;

    const done = () => {
      observer?.disconnect();
      resolve();
    };

    const timer = setTimeout(done, SHELL_WAIT_MS);

    observer = new PerformanceObserver((list) => {
      if (list.getEntries().some((entry) => entry.element === hero)) {
        clearTimeout(timer);
        done();
      }
    });

    observer.observe({ type: "largest-contentful-paint", buffered: true });
  });
}

afterShellHeroPaint().then(() => {
  const root = createRoot(rootElement);

  startTransition(() => {
    root.render(
      <StrictMode>
        <HelmetProvider>
          <App />
        </HelmetProvider>
      </StrictMode>
    );
  });
});