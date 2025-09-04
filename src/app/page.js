"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

export default function Home() {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null); // Saved file URL
  const [numPages, setNumPages] = useState(0);
  const [pages, setPages] = useState([]);
  const canvasRefs = useRef([]);
  const renderTasksRef = useRef([]);
  const resizeTimeoutRef = useRef(null);

  // Handle local file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      const reader = new FileReader();
      reader.onload = async function () {
        const typedArray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument(typedArray).promise;
        setNumPages(pdf.numPages);

        const tempPages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          tempPages.push(page);
        }
        setPages(tempPages);
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert("Please upload a valid PDF file");
    }
  };

  // Submit file to server
  const handleSubmit = async () => {
    if (!pdfFile) return alert("No file selected!");

    const formData = new FormData();
    formData.append("file", pdfFile);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (res.ok) {
      setPdfUrl(data.url);
      alert("PDF uploaded successfully!");
    } else {
      alert("Upload failed: " + data.error);
    }
  };

  // Render pages
  useEffect(() => {
    const renderPages = async () => {
      if (pages.length === 0) return;
      renderTasksRef.current.forEach((task) => task?.cancel());
      renderTasksRef.current = [];

      pages.forEach((page, i) => {
        const canvas = canvasRefs.current[i];
        if (!canvas) return;

        const context = canvas.getContext("2d");
        const containerWidth = canvas.parentElement.offsetWidth;

        const viewport = page.getViewport({ scale: 1 });
        const scale = containerWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        const renderTask = page.render({
          canvasContext: context,
          viewport: scaledViewport,
        });

        renderTasksRef.current.push(renderTask);

        renderTask.promise.catch((err) => {
          if (err?.name !== "RenderingCancelledException") {
            console.error("Render error:", err);
          }
        });
      });
    };

    renderPages();

    const handleResize = () => {
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = setTimeout(() => {
        renderPages();
      }, 200);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      renderTasksRef.current.forEach((task) => task?.cancel());
    };
  }, [pages]);

  return (
    <div className="font-sans min-h-screen p-6 sm:p-10 bg-black text-white">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 w-full max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold">My PDF Viewer App</h1>
        <div>
          <label className="cursor-pointer flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
            <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" width="20" height="20">
              <path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM15 3.5V8h4.5L15 3.5z" />
            </svg>
            Upload PDF
            <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
          </label>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center w-full">
        {pdfFile ? (
          <div className="w-full max-w-5xl flex flex-col items-center">
            {Array.from({ length: numPages }).map((_, index) => (
              <canvas
                key={index}
                ref={(el) => (canvasRefs.current[index] = el)}
                className="mb-8 border max-w-full h-auto bg-white"
                role="img"
                aria-label={`PDF page ${index + 1}`}
              />
            ))}

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg mt-6"
            >
              Submit PDF
            </button>
          </div>
        ) : (
          <p className="text-gray-400">No PDF uploaded yet.</p>
        )}

        {pdfUrl && (
          <p className="mt-6 text-green-400">
            File saved! Accessible at: <a href={pdfUrl} className="underline" target="_blank">{pdfUrl}</a>
          </p>
        )}
      </main>
    </div>
  );
}
