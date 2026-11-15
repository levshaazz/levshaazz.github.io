/* py-worker.js — sandboxed Python runner for practice labs.
   Real CPython (Pyodide/WASM) inside a Web Worker: a hung student script
   never freezes the page — the main thread terminates this worker on timeout
   and respawns a fresh one. Practice only; no network access from student code. */
"use strict";

let pyodide = null;
let loadPromise = null;

const HARNESS = `
import sys, io, json, traceback

class _Ring(io.TextIOBase):
    def __init__(self, cap=200):
        self.lines = []; self.cap = cap
    def write(self, s):
        s = str(s)
        for ln in s.splitlines(True):
            self.lines.append(ln.rstrip("\\n"))
            if len(self.lines) > self.cap:
                self.lines.pop(0)
        return len(s)
    def flush(self):
        pass

_ring = _Ring()
sys.stdout = _ring
sys.stderr = _ring
_M = {"expected": "expected", "got": "got"}

def _eq(got, expected):
    if got == expected:
        return
    raise AssertionError(_M["expected"] + " %r, " % (expected,) + _M["got"] + " %r" % (got,))

def _approx(got, expected, tol):
    try:
        ok = abs(got - expected) <= tol
    except TypeError:
        ok = False
    if ok:
        return
    raise AssertionError(_M["expected"] + " %r +/- %s, " % (expected, tol) + _M["got"] + " %r" % (got,))

def _dump():
    return "\\n".join(_ring.lines)

def _last(tb):
    lines = [l for l in tb.splitlines() if l.strip()]
    return lines[-1] if lines else tb

def _run_exercise(args_json):
    student_src, tests, msgs = json.loads(args_json)
    _M.update(msgs)
    _ring.lines.clear()
    ns = {"__name__": "__student__", "eq": _eq, "approx": _approx}
    try:
        exec(compile(student_src, "<student>", "exec"), ns)
    except SyntaxError:
        return json.dumps({"status": "syntax", "error": _last(traceback.format_exc(limit=3)),
                           "results": [], "stdout": ""})
    except BaseException:
        return json.dumps({"status": "error", "error": _last(traceback.format_exc(limit=4)),
                           "results": [], "stdout": _dump()})
    results = []
    for name, hidden, src in tests:
        try:
            exec(compile(src, "<test>", "exec"), ns)
            results.append({"name": name, "hidden": hidden, "passed": True, "kind": "", "message": ""})
        except AssertionError as e:
            results.append({"name": name, "hidden": hidden, "passed": False, "kind": "assert", "message": str(e)})
        except BaseException:
            results.append({"name": name, "hidden": hidden, "passed": False, "kind": "exception",
                            "message": _last(traceback.format_exc(limit=3))})
    status = "passed" if all(r["passed"] for r in results) else "failed"
    return json.dumps({"status": status, "error": "", "results": results, "stdout": _dump()})
`;

async function ensure(msg) {
  if (pyodide) return pyodide;
  if (!loadPromise) {
    loadPromise = (async () => {
      importScripts(msg.indexURL + "pyodide.js");
      const py = await loadPyodide({ indexURL: msg.indexURL });
      py.runPython(HARNESS);
      if (msg.numpy) await py.loadPackage("numpy");
      pyodide = py;
      return py;
    })();
  }
  return loadPromise;
}

self.onmessage = async (event) => {
  const msg = event.data;
  if (msg.type === "init") {
    try {
      await ensure(msg);
      self.postMessage({ type: "ready", id: msg.id });
    } catch (e) {
      self.postMessage({ type: "load-error", id: msg.id, message: String(e) });
    }
    return;
  }
  if (msg.type === "run") {
    try {
      const py = await ensure(msg);
      if (msg.numpy) await py.loadPackage("numpy");
      py.globals.set("_args_json", JSON.stringify([msg.code, msg.tests, msg.msgs || {}]));
      const resultJson = py.runPython("_run_exercise(_args_json)");
      self.postMessage({ type: "done", id: msg.id, result: JSON.parse(resultJson) });
    } catch (e) {
      self.postMessage({ type: "done", id: msg.id, result: { status: "error", error: String(e), results: [], stdout: "" } });
    }
  }
};
