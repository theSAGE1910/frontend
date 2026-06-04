import { useState } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [question, setQuestion] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploadStatus('Uploading and vectorizing... (this may take a few seconds)');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/upload', {
        method: 'POST', 
        body: formData,
      });

      if (response.ok) {
        setUploadStatus(`Success: ${file.name} is ready for queries!`);
      } else {
        setUploadStatus('Upload failed.');
      }
    } catch (error) {
      console.error(error);
      setUploadStatus('Connection error during upload.');
    }
  };

  const handleQuery = async (e) => {
    e.preventDefault();
    if(!question.trim()) return;

    const newChat = [...chatLog, {role: 'user', text: question}];
    setChatLog(newChat);
    setQuestion('');
    setIsLoading(true)

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/query', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({question: newChat[newChat.length - 1].text}),
      });

      const data = await response.json();

      if (response.ok) {
        setChatLog((prev) => [
          ...prev,
          {role: 'ai', text: data.answer, context: data.retrieved_context}
        ]);
      } else {
        setChatLog((prev) => [
          ...prev,
          {role: 'ai', text: `Error: ${data.detail}`}
        ]);
      }
    } catch (error) {
      console.error(error);
      setChatLog((prev) => [
          ...prev,
          {role: 'ai', text: 'Error connecting to RAG API.'}
        ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{display: "flex", height: "100vh", fontFamily: "sans-serif", backgroundColor: "#f4f4f5"}}>
      
      {/* LEFT PANEL: UPLOAD */}
      <div style={{width: "30%", padding: "2rem", backgroundColor: "#ffffff", borderRight: "1px solid #e4e4e7"}}>
        <h2 style={{color: "#18181b"}}>Smart Document Insights</h2>
        <p style={{color: "#71717a", fontSize: "14px", marginBottom: "2rem"}}>Powerd by FastAPI & </p>

        <form onSubmit={handleUpload} style={{display: "flex", flexDirection: "column", gap: "1rem"}}>
          <div style={{ border: '2px dashed #d4d4d8', padding: '2rem', textAlign: 'center', borderRadius: '8px' }}>
            <input type="file"
            onChange={(e) => setFile(e.target.files[0])}
              style={{width: "100%"}} 
            />
          </div>
          <button
            type="submit"

            style={{padding: "10px", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold"}}
          >
            Ingest Document
          </button>
        </form>
        <p style={{marginTop: "1rem", fontSize: "14px", color: "#059669", fontWeight: "bold"}}>{uploadStatus}</p>
      </div>

      {/* RIGHT PANEL: CHAT */}
      <div style={{flex: 1, display: "flex", flexDirection: "column", padding: "2rem"}}>
        
        {/* Chat History Window */}
        <div style={{flex: 1, overflowY: "auto", backgroundColor: "#ffffff", padding: "2rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: "1rem"}}>
          {chatLog.length === 0 ? (
            <p style={{color: "#a1a1aa", textAlign: "center", marginTop: "20%"}}>Upload a document and start asking questions.</p>
          ) : (
            chatLog.map((message, index) => (
              <div key={index} style={{marginBottom: "1.5rem", textAlign: message.role === "user" ? "right" : "left"}}>
                <span style={{
                  display: "inline-block",
                  padding: "12px 18px",
                  borderRadius: "8px",
                  backgroundColor: message.role === "user" ? "#2563eb" : "#f4f4f5",
                  color: message.role === "user" ? "#ffffff" : "#18181b",
                  maxWidth: "80%",
                  lineHeight: "1.5"
                }}>
                  {message.text}
                </span>
                {message.context && (
                  <details style={{fontSize: "12px", color: "#71717a", marginTop: "8px", textAlign: "left"}}>
                    <summary style={{cursor: "pointer"}}>View Source Context</summary>
                    <div style={{padding: "10px", backgroundColor: "#fafafa", border: "1px solid #e4e4e7", borderRadius: "4px", marginTop: "4px", whiteSpace: "pre-wrap"}}>
                      {message.context}
                    </div>
                  </details>
                )}
              </div>
            ))
          )}
          {isLoading && <p style={{color: "#71717a"}}>Analysing documents...</p>}
        </div>

        {/* Input Field */}
        <form onSubmit={handleQuery} style={{display: "flex", gap: "10px"}}>
          <input 
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about the document..."
          style={{flex: 1, padding: "15px", borderRadius: "8px", border: "1px solid #d4d4d8", fontSize: "16px"}}
          />
          <button type="submit" style={{padding: "15px 30px", backgroundColor: "#18181b", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold"}}>
            Send
          </button>
        </form>

      </div>
    </div>
  );
}

export default App;