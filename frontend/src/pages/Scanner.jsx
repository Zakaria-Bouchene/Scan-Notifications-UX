import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import QRCode from "qrcode";

const READER_ID = "qr-reader";

export default function Scanner() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null); // { value, ts }
  const [error, setError] = useState("");
  const [manual, setManual] = useState("");
  const [cameras, setCameras] = useState([]);
  const [cameraId, setCameraId] = useState("");
  const [genText, setGenText] = useState("LOGI-PKG-00123");
  const [genUrl, setGenUrl] = useState("");
  const scannerRef = useRef(null);

  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((cams) => {
        setCameras(cams);
        if (cams[0]) setCameraId(cams[0].id);
      })
      .catch((e) => setError("Camera enumeration failed: " + e.message));
  }, []);

  useEffect(() => {
    QRCode.toDataURL(genText || " ", { width: 240, margin: 1 }).then(setGenUrl);
  }, [genText]);

  async function startScan() {
    setError("");
    setResult(null);
    if (!cameraId) return setError("No camera available.");
    try {
      const html5Qr = new Html5Qrcode(READER_ID);
      scannerRef.current = html5Qr;
      await html5Qr.start(
        cameraId,
        { fps: 12, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          setResult({ value: decodedText, ts: Date.now() });
          stopScan();
        },
        () => {}
      );
      setScanning(true);
    } catch (e) {
      setError("Could not start camera: " + (e?.message || e));
    }
  }

  async function stopScan() {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch (_) {}
    setScanning(false);
  }

  useEffect(() => () => { stopScan(); }, []);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">QR Scanner</h2>
          <span className={`text-xs px-2 py-1 rounded-full ${scanning ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
            {scanning ? "scanning…" : "idle"}
          </span>
        </div>

        {cameras.length > 1 && (
          <select
            value={cameraId}
            onChange={(e) => setCameraId(e.target.value)}
            disabled={scanning}
            className="mt-3 w-full text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1.5"
          >
            {cameras.map((c) => <option key={c.id} value={c.id}>{c.label || c.id}</option>)}
          </select>
        )}

        <div id={READER_ID} className="mt-4 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-square grid place-items-center text-slate-400 text-sm">
          {!scanning && "Camera preview will appear here"}
        </div>

        <div className="mt-4 flex gap-2">
          {!scanning ? (
            <button onClick={startScan} className="flex-1 rounded-lg bg-sky-600 text-white py-2 font-medium hover:bg-sky-700">
              Start scanning
            </button>
          ) : (
            <button onClick={stopScan} className="flex-1 rounded-lg bg-rose-600 text-white py-2 font-medium hover:bg-rose-700">
              Stop
            </button>
          )}
        </div>

        <div className="mt-4">
          <label className="text-xs font-medium text-slate-500">Manual input (simulate scan)</label>
          <div className="flex gap-2 mt-1">
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="e.g. LOGI-PKG-00123"
              className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
            />
            <button
              onClick={() => manual && setResult({ value: manual, ts: Date.now() })}
              className="rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-3 text-sm font-medium"
            >
              Submit
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 text-sm rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 px-3 py-2">
            {error}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <h2 className="text-lg font-semibold">QR Generator</h2>
        <p className="text-sm text-slate-500 mt-1">Make a test QR, point your other device at it.</p>
        <input
          value={genText}
          onChange={(e) => setGenText(e.target.value)}
          className="mt-3 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
        />
        {genUrl && (
          <div className="mt-4 grid place-items-center">
            <img src={genUrl} alt="QR" className="rounded-lg border border-slate-200 dark:border-slate-800 p-2 bg-white" />
          </div>
        )}
      </section>

      {result && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-[92%] p-6 animate-pop">
            <div className="flex items-center gap-2 text-emerald-600">
              <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 grid place-items-center">✓</div>
              <div>
                <div className="font-semibold">Scan successful</div>
                <div className="text-xs text-slate-500">{new Date(result.ts).toLocaleString()}</div>
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-slate-100 dark:bg-slate-800 p-3 text-sm break-all font-mono">
              {result.value}
            </div>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => { setResult(null); startScan(); }}
                className="flex-1 rounded-lg bg-sky-600 text-white py-2 font-medium hover:bg-sky-700"
              >
                Scan again
              </button>
              <button
                onClick={() => setResult(null)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
