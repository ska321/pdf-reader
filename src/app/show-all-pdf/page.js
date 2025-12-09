"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ShowAllPdf() {
  const [pdfs, setPdfs] = useState([]);

  useEffect(() => {
    const fetchPdfs = async () => {
      const res = await fetch("/api/list-pdfs");
      if (res.ok) {
        const data = await res.json();
        setPdfs(data);
      }
    };
    fetchPdfs();
  }, []);

  return (
    <div className="min-h-screen bg-white text-black p-6 sm:p-10">
      <h1 className="text-3xl font-bold mb-8">All Uploaded PDFs</h1>

      {pdfs.length === 0 ? (
        <p className="text-gray-400">No PDFs uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pdfs.map((pdf, index) => (
            <div key={index} className="bg-gray-200 rounded-2xl p-6 shadow-md flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="red" viewBox="0 0 24 24" width="32" height="32">
                  <path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM15 3.5V8h4.5L15 3.5z" />
                </svg>
                <span className="font-semibold text-lg truncate">{pdf.name}</span>
              </div>
              <div className="flex gap-4 mt-auto">
                <Link
                  href={`/show-pdf/${encodeURIComponent(pdf.name)}`}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm"
                >
                  View
                </Link>
                <a
                  href={pdf.url}
                  download
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm"
                >
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12">
        <Link href="/" className="text-blue-400 hover:underline">
          ← Back to Upload Page
        </Link>
      </div>
    </div>
  );
}
