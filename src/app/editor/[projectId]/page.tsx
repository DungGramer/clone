"use client";
import { useEditor } from "@/features/editor/hooks/use-editor";
import { fabric } from "fabric";
import { useEffect, useRef } from "react";

const EditorProjectIdPage = () => {
  const { init } = useEditor();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = new fabric.Canvas(canvasRef.current!, {
      controlsAboveOverlay: true, //? Can control outside of the workspace
      preserveObjectStacking: true,
    });

    init({
      initialCanvas: canvas,
      initialContainer: containerRef.current!,
    });
  }, [init]);

  return (
    <div className='h-full flex flex-col'>
      <div className='flex-1 h-full bg-muted' ref={containerRef}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

export default EditorProjectIdPage;
