type ScriptInputProps = {
  scriptText: string
  onScriptTextChange: (value: string) => void
  onParseScript: () => void
  selectedFile: File | null
  onFileChange: (file: File | null) => void
  onUploadFile: () => void
  onLoadExample: () => void
  loading: boolean
}

function ScriptInput({
  scriptText,
  onScriptTextChange,
  onParseScript,
  selectedFile,
  onFileChange,
  onUploadFile,
  onLoadExample,
  loading
}: ScriptInputProps) {
  return (
    <section className="input-grid">
      <div className="card">
        <h2>Liitä käsikirjoitus</h2>
        <label htmlFor="script-text" className="visually-hidden">
          Käsikirjoitusteksti
        </label>
        <textarea
          id="script-text"
          value={scriptText}
          onChange={(event) => onScriptTextChange(event.target.value)}
          rows={12}
          className="script-textarea"
          placeholder={"INT. KEITTIÖ - AAMU\n\nAnna juo kahvia. Puhelin soi.\n\nANNA\nHaloo?"}
          spellCheck={false}
        />
        <div className="button-row">
          <button className="btn btn-primary" onClick={onParseScript} disabled={loading}>
            {loading ? "Puretaan…" : "Pura käsikirjoitus"}
          </button>
        </div>
      </div>

      <div className="side-stack">
        <div className="card">
          <h2>Tai lataa tiedosto</h2>
          <p className="muted">Final Draft (.fdx) tai pelkkä teksti (.txt, UTF-8)</p>
          <label className="file-picker">
            <input
              type="file"
              accept=".txt,.fdx"
              onChange={(event) => onFileChange(event.target.files?.[0] || null)}
            />
            <span>{selectedFile ? selectedFile.name : "Valitse tiedosto…"}</span>
          </label>
          <button className="btn" onClick={onUploadFile} disabled={loading || !selectedFile}>
            Lataa ja pura
          </button>
        </div>

        <div className="card card-accent">
          <h2>Kokeile esimerkillä</h2>
          <p className="muted">
            Lyhyt kuuden kohtauksen näyte. Voit myös ladata sen{" "}
            <a href="/esimerkit/viimeinen-juna.fdx" download>.fdx</a>- tai{" "}
            <a href="/esimerkit/viimeinen-juna.txt" download>.txt</a>-muodossa.
          </p>
          <button className="btn btn-dark" onClick={onLoadExample} disabled={loading}>
            Pura esimerkki
          </button>
        </div>
      </div>
    </section>
  )
}

export default ScriptInput
