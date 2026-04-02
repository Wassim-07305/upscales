"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { RotateCcw, Pen, Type } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignaturePadProps {
  onSign: (dataUrl: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

type SignMode = "draw" | "type";

export function SignaturePad({
  onSign,
  onCancel,
  disabled,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [mode, setMode] = useState<SignMode>("draw");
  const [typedName, setTypedName] = useState("");

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#1a1a1a";
    }
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled || mode !== "draw") return;
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (isDrawing && hasDrawn) {
      // Appeler onSign quand l'utilisateur arrete de dessiner
      const canvas = canvasRef.current;
      if (canvas) {
        const dataUrl = canvas.toDataURL("image/png");
        onSign(dataUrl);
      }
    }
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setHasDrawn(false);
  };

  // Generer une image de signature a partir du texte tape
  const generateTypedSignature = useCallback(() => {
    if (!typedName.trim()) return;
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#1a1a1a";
    ctx.font = "italic 48px 'Georgia', 'Times New Roman', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);
    const dataUrl = canvas.toDataURL("image/png");
    onSign(dataUrl);
  }, [typedName, onSign]);

  // Valider la signature dessinee
  const handleDrawSign = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;
    const dataUrl = canvas.toDataURL("image/png");
    onSign(dataUrl);
  };

  // Generer la signature quand le texte change (mode type)
  useEffect(() => {
    if (mode === "type" && typedName.trim().length >= 2) {
      generateTypedSignature();
    }
  }, [mode, typedName, generateTypedSignature]);

  const hasSigned = mode === "draw" ? hasDrawn : typedName.trim().length >= 2;

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-1 bg-white/5 rounded-lg p-0.5 w-fit">
        <button
          type="button"
          onClick={() => setMode("draw")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
            mode === "draw"
              ? "bg-white/10 text-white"
              : "text-white/40 hover:text-white/60",
          )}
        >
          <Pen className="w-3 h-3" />
          Dessiner
        </button>
        <button
          type="button"
          onClick={() => setMode("type")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
            mode === "type"
              ? "bg-white/10 text-white"
              : "text-white/40 hover:text-white/60",
          )}
        >
          <Type className="w-3 h-3" />
          Taper
        </button>
      </div>

      {mode === "draw" ? (
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full h-36 bg-white rounded-xl cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          {!hasDrawn && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-sm text-muted-foreground/60">
                Dessinez votre signature ici
              </p>
            </div>
          )}
          {hasDrawn && (
            <button
              type="button"
              onClick={clear}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/5 hover:bg-black/10 transition-colors"
              title="Effacer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder="Tapez votre nom complet"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-primary"
          />
          {typedName.trim() && (
            <div className="mt-3 h-24 bg-white rounded-xl flex items-center justify-center">
              <span
                className="text-3xl text-black/80"
                style={{
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontStyle: "italic",
                }}
              >
                {typedName}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
