
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { InfographicData, LoadingState } from '../types';

interface InfographicProps {
  data: InfographicData | undefined;
  onGenerate: () => void;
  loadingState: LoadingState;
}

const Infographic: React.FC<InfographicProps> = ({ data, onGenerate, loadingState }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (data && svgRef.current) {
      renderInfographic();
    }
  }, [data, isZoomed]);

  const renderInfographic = () => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 500;
    const margin = { top: 60, right: 40, bottom: 40, left: 40 };

    svg.attr("viewBox", `0 0 ${width} ${height}`)
       .attr("preserveAspectRatio", "xMidYMid meet");

    // Background
    svg.append("rect")
       .attr("width", width)
       .attr("height", height)
       .attr("fill", "#f8fafc")
       .attr("rx", 12);

    // Title
    svg.append("text")
       .attr("x", width / 2)
       .attr("y", 40)
       .attr("text-anchor", "middle")
       .attr("font-size", "24px")
       .attr("font-weight", "bold")
       .attr("fill", "#1e293b")
       .text(data.title);

    // Summary
    svg.append("text")
       .attr("x", width / 2)
       .attr("y", 70)
       .attr("text-anchor", "middle")
       .attr("font-size", "14px")
       .attr("fill", "#64748b")
       .text(data.summary);

    // Layout
    const items = data.items;
    const cols = 3;
    const itemWidth = (width - margin.left - margin.right) / cols;
    const itemHeight = 120;

    const g = svg.append("g")
                 .attr("transform", `translate(${margin.left}, ${margin.top + 50})`);

    items.forEach((item, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      
      const itemG = g.append("g")
                     .attr("transform", `translate(${col * itemWidth}, ${row * itemHeight})`);

      // Card
      itemG.append("rect")
           .attr("width", itemWidth - 20)
           .attr("height", itemHeight - 20)
           .attr("fill", "white")
           .attr("stroke", "#e2e8f0")
           .attr("rx", 8)
           .attr("class", "shadow-sm");

      // Type Badge
      const badgeColor = item.type === 'stat' ? '#0ea5e9' : item.type === 'action' ? '#f43f5e' : '#10b981';
      itemG.append("rect")
           .attr("x", 10)
           .attr("y", 10)
           .attr("width", 40)
           .attr("height", 16)
           .attr("fill", badgeColor)
           .attr("rx", 4);

      itemG.append("text")
           .attr("x", 30)
           .attr("y", 22)
           .attr("text-anchor", "middle")
           .attr("font-size", "10px")
           .attr("fill", "white")
           .attr("font-weight", "bold")
           .text(item.type.toUpperCase());

      // Label
      itemG.append("text")
           .attr("x", 10)
           .attr("y", 45)
           .attr("font-size", "12px")
           .attr("font-weight", "bold")
           .attr("fill", "#334155")
           .text(item.label.length > 25 ? item.label.substring(0, 22) + "..." : item.label);

      // Value
      const valueText = itemG.append("text")
           .attr("x", 10)
           .attr("y", 65)
           .attr("font-size", "14px")
           .attr("fill", "#475569")
           .attr("width", itemWidth - 40);

      // Simple text wrapping
      const words = item.value.split(/\s+/);
      let line = [];
      let y = 65;
      const lineHeight = 18;
      const maxWidth = itemWidth - 40;

      words.forEach(word => {
        line.push(word);
        const testLine = line.join(" ");
        if (testLine.length * 7 > maxWidth) { // Rough estimate
          itemG.append("text")
               .attr("x", 10)
               .attr("y", y)
               .attr("font-size", "13px")
               .attr("fill", "#475569")
               .text(line.slice(0, -1).join(" "));
          line = [word];
          y += lineHeight;
        }
      });
      itemG.append("text")
           .attr("x", 10)
           .attr("y", y)
           .attr("font-size", "13px")
           .attr("fill", "#475569")
           .text(line.join(" "));
    });
  };

  const handleDownload = () => {
    if (!svgRef.current) return;

    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = 1600; // High res
      canvas.height = 1000;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, 1600, 1000);
        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `infographic-${data?.title || 'meeting'}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  const isGenerating = loadingState === LoadingState.GENERATING_INFOGRAPHIC;

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4 overflow-hidden transition-all duration-300 ${isZoomed ? 'fixed inset-4 z-50 shadow-2xl' : ''}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Visual Infographic
        </h2>
        <div className="flex items-center gap-2">
          {data && (
            <>
              <button
                onClick={handleDownload}
                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                title="Download as PNG"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
              <button
                onClick={() => setIsZoomed(!isZoomed)}
                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                title={isZoomed ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isZoomed ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                )}
              </button>
            </>
          )}
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generating...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {data ? 'Regenerate' : 'Generate Infographic'}
              </>
            )}
          </button>
        </div>
      </div>

      <div className={`flex-grow flex items-center justify-center bg-slate-50 rounded-xl border border-slate-100 overflow-hidden ${isZoomed ? 'min-h-0' : 'min-h-[400px]'}`}>
        {data ? (
          <svg ref={svgRef} className={`w-full h-full ${isZoomed ? '' : 'max-h-[500px]'}`}></svg>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900">No Infographic Yet</h3>
            <p className="text-slate-500 mt-2 max-w-xs text-sm">
              Generate a visual summary of your meeting with key points and stats.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Infographic;
