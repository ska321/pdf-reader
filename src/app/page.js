"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import {
  FileUp,
  FileText,
  Send,
  BookOpen,
  LayoutDashboard,
  Loader2,
  UploadCloud,
} from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

export default function Home() {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [pages, setPages] = useState([]);
  const canvasRefs = useRef([]);
  const renderTasksRef = useRef([]);
  const resizeTimeoutRef = useRef(null);

  // Handle PDF upload
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
      alert("Please upload a valid PDF.");
    }
  };

  // Upload to server
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

      resizeTimeoutRef.current = setTimeout(() => renderPages(), 200);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderTasksRef.current.forEach((task) => task?.cancel());
    };
  }, [pages]);

  return (
    <div className="font-sans min-h-screen bg-gradient-to-b from-zinc-100 to-white text-black">

      {/* HEADER */}
      <header className="w-full max-w-6xl mx-auto py-6 flex justify-between items-center">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-extrabold flex items-center gap-2"
        >
          <BookOpen className="text-red-600" />
          PDF Reader Pro
        </motion.h1>
      </header>

      {/* BIG HERO SECTION */}
      {!pdfFile && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col justify-center items-center py-24 text-center max-w-4xl mx-auto px-6"
        >
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-5xl font-extrabold text-zinc-800 mb-2 leading-tight"
          >
            A Smarter, Faster & Beautiful Way  
            <br /> to Read Your PDF Files
          </motion.h2>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-zinc-600 leading-relaxed max-w-2xl mb-10"
          >
            PDF Reader Pro gives you a clean and modern reading experience.  
            Upload any PDF, preview every page instantly, zoom smoothly, and store your files securely.  
            Built with Next.js, PDF.js, and Framer Motion for a buttery-smooth interface.
          </motion.p>

          {/* Centered upload + view buttons */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex gap-4 mt-4"
          >
            <label className="cursor-pointer flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all shadow-md text-lg">
              <FileUp size={22} />
              Upload PDF
              <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
            </label>

            <Link
              href="/show-all-pdf"
              className="cursor-pointer flex items-center gap-2 bg-zinc-800 text-white px-6 py-3 rounded-lg hover:bg-zinc-900 transition-all shadow-md text-lg"
            >
              <LayoutDashboard size={22} />
              View Library
            </Link>
          </motion.div>
        </motion.section>
      )}

      {/* MAIN */}
      <main className="flex flex-col items-center w-full">
        {pdfFile ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-4xl flex flex-col items-center"
          >
            {Array.from({ length: numPages }).map((_, index) => (
              <motion.canvas
                key={index}
                ref={(el) => (canvasRefs.current[index] = el)}
                className="mb-10 rounded-xl border shadow bg-white"
                role="img"
                aria-label={`PDF page ${index + 1}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              />
            ))}

            <motion.button
              onClick={handleSubmit}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg mt-4 flex items-center gap-2 shadow hover:shadow-lg transition"
            >
              <Send size={20} />
              Submit PDF
            </motion.button>
          </motion.div>
        ) : null}

        {pdfUrl && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-green-600 text-lg">
            File saved! 👉{" "}
            <a href={pdfUrl} target="_blank" className="underline font-semibold">
              Open PDF
            </a>
          </motion.p>
        )}
      </main>

      <footer className="mt-20 py-6 text-center text-sm text-zinc-500">
        Made with ❤️ using Next.js, PDF.js & Framer Motion.
      </footer>
    </div>
  );
}
