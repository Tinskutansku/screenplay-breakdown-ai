type ScriptInputProps = {
  scriptText: string
  onScriptTextChange: (value: string) => void
  onParseScript: () => void
  selectedFile: File | null
  onFileChange: (file: File | null) => void
  onUploadFile: () => void
}

function ScriptInput({
  scriptText,
  onScriptTextChange,
  onParseScript,
  selectedFile,
  onFileChange,
  onUploadFile
}: ScriptInputProps) {
  return (
    <div style={wrapperStyle}>
      <h3>Paste screenplay text</h3>

      <textarea
        value={scriptText}
        onChange={(event) => onScriptTextChange(event.target.value)}
        rows={10}
        style={textAreaStyle}
        placeholder="Paste screenplay here..."
      />

      <button onClick={onParseScript}>Parse screenplay</button>

      <div style={uploadSectionStyle}>
        <h3>Or upload a screenplay file (.txt or .fdx)</h3>

        <input
          type="file"
          accept=".txt,.fdx"
          onChange={(event) => {
            const file = event.target.files?.[0] || null
            onFileChange(file)
          }}
        />

        {selectedFile && (
          <p>Selected file: {selectedFile.name}</p>
        )}

        <div style={{ marginTop: "10px" }}>
          <button onClick={onUploadFile}>Upload file</button>
        </div>
      </div>
    </div>
  )
}

const wrapperStyle = {
  marginBottom: "30px"
}

const textAreaStyle = {
  width: "100%",
  marginBottom: "10px"
}

const uploadSectionStyle = {
  marginTop: "20px"
}

export default ScriptInput