"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

// ✅ Always load worker from public folder
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

export default function ShowPdf() {
  const { pdfId } = useParams(); // filename from URL
  const [numPages, setNumPages] = useState(0);
  const [pages, setPages] = useState([]);
  const canvasRefs = useRef([]);
  const renderTasksRef = useRef([]);
  const resizeTimeoutRef = useRef(null);

  useEffect(() => {
    if (!pdfId) return;

    const loadPdf = async () => {
      try {
        // ✅ Use relative path (works on Web + Android WebView)
        const url = `/uploads/${pdfId}`;

        const pdf = await pdfjsLib.getDocument(url).promise;
        setNumPages(pdf.numPages);

        const tempPages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          tempPages.push(page);
        }
        setPages(tempPages);
      } catch (err) {
        console.error("Error loading PDF:", err);
      }
    };

    loadPdf();
  }, [pdfId]);

  // Render PDF pages
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
    <div className="min-h-screen bg-white text-black p-6 sm:p-10">
      <h1 className="text-2xl font-bold mb-6 break-all">
        Viewing: {pdfId}
      </h1>

      {numPages === 0 ? (
        <p className="text-gray-400">Loading PDF...</p>
      ) : (
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
        </div>
      )}
    </div>
  );
}
