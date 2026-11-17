/* runtime.js — main-thread Python runner for practice labs.
   Wraps py-worker.js: warm worker, hard timeout (worker is terminated and
   respawned — a student infinite loop never freezes the page), promise API.
   Usage: const res = await window.LSMPython.run(code, tests, {numpy, timeoutMs}); */
(function () {
  "use strict";

  const SCRIPT_BASE = (() => {
    const src = document.currentScript && document.currentScript.src;
    return src ? src.substring(0, src.lastIndexOf("/") + 1) : "/js/labs/";
  })();

  let vendorBase = "/vendor/pyodide/";
  let lang = "en";
  let warm = null;
  let seq = 0;

  const MSGS = {
    en: { expected: "expected", got: "got" },
    ru: { expected: "ожидал", got: "получил" },
  };

  function spawn() {
    const worker = new Worker(SCRIPT_BASE + "py-worker.js");
    worker.postMessage({ type: "init", id: "init", indexURL: vendorBase });
    const ready = new Promise((resolve, reject) => {
      worker.onmessage = (e) => {
        if (e.data.type === "ready") resolve(worker);
        if (e.data.type === "load-error") reject(new Error(e.data.message));
      };
      worker.onerror = (e) => reject(new Error(e.message || "worker error"));
    });
    return { worker, ready };
  }

  async function ensureWarm() {
    if (!warm) warm = spawn();
    try {
      await warm.ready;
    } catch (e) {
      warm = null; // a failed spawn must not poison every later run
      throw e;
    }
    return warm;
  }

  function run(code, tests, opts) {
    opts = opts || {};
    const timeoutMs = opts.timeoutMs || 4000;
    const useNumpy = !!opts.numpy;
    const runId = "run-" + (++seq);
    return new Promise(async (resolve) => {
      let w;
      try {
        w = await ensureWarm();
      } catch (e) {
        resolve({ status: "runner-error", error: String(e), results: [], stdout: "" });
        return;
      }
      const worker = w.worker;
      const timer = setTimeout(() => {
        worker.terminate();
        if (warm && warm.worker === worker) warm = null;
        resolve({ status: "timeout", error: "timeout", results: [], stdout: "" });
      }, timeoutMs);
      worker.onmessage = (e) => {
        if (e.data.type === "done" && e.data.id === runId) {
          clearTimeout(timer);
          resolve(e.data.result);
        }
      };
      worker.postMessage({
        type: "run", id: runId, code,
        tests: tests.map((t) => [t.name, !!t.hidden, t.code]),
        msgs: MSGS[lang] || MSGS.en,
        numpy: useNumpy,
        indexURL: vendorBase,
      });
    });
  }

  window.LSMPython = {
    run,
    setLang(l) { lang = l === "ru" ? "ru" : "en"; },
    setVendorBase(b) { vendorBase = b; },
    preload() { ensureWarm().catch(() => {}); },
  };
})();
