import Editor from "@/components/editor";
import { Schema } from "@/components/PageBreakBlock";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Doc } from "@/convex/_generated/dataModel";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface PresentationProps {
  initialData: Doc<"documents">;
  buttonClassName?: string;
}

const Presentation = ({ initialData, buttonClassName }: PresentationProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const editorWrapperRef = useRef<HTMLDivElement>(null);

  // Parse the initial content and split slides by "page_break"
  const slides: Schema[][] = (
    JSON.parse(initialData?.content || "[]") as Schema[]
  ).reduce(
    (acc: Schema[][], block: Schema) => {
      if (block.type === "page_break") {
        acc.push([]); // Create a new slide group
      } else {
        if (acc.length === 0) acc.push([]); // Ensure the first slide exists
        acc[acc.length - 1].push(block); // Add the block to the last slide group
      }
      return acc;
    },
    [] as Schema[][] // Initialize as an empty nested array
  );

  const progress = ((currentSlide + 1) / slides.length) * 100;

  const enterFullscreen = () => {
    setTimeout(async () => {
      if (dialogRef.current) {
        if (dialogRef.current.requestFullscreen) {
          await dialogRef.current.requestFullscreen();
        } else if (dialogRef.current.webkitRequestFullscreen) {
          // Support for Safari
          dialogRef.current.webkitRequestFullscreen();
        }
      }
    }, 0);
  };

  const exitFullscreen = () => {
    setTimeout(async () => {
      if (document.fullscreenElement || document.fullscreenEnabled) {
        await document.exitFullscreen();
      }
    }, 0);
  };

  // Handlers for navigating slides
  const nextSlide = () =>
    setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
  const prevSlide = () => setCurrentSlide((prev) => Math.max(prev - 1, 0));

  // Scroll handlers
  const scrollUp = () => {
    editorWrapperRef.current?.scrollBy({ top: -100, behavior: "smooth" });
  };
  const scrollDown = () => {
    editorWrapperRef.current?.scrollBy({ top: 100, behavior: "smooth" });
  };

  // Key handling
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const isFullscreen = !!document.fullscreenElement;

      if (isDialogOpen || isFullscreen) {
        switch (event.key) {
          case "Escape":
            // Exit fullscreen or close dialog
            if (isFullscreen) {
              exitFullscreen();
            }
            break;
          case "ArrowLeft":
          case "a":
            prevSlide();
            break;
          case "ArrowRight":
          case "d":
            nextSlide();
            break;
          case "ArrowUp":
          case "w":
            scrollUp();
            break;
          case "ArrowDown":
          case "s":
            scrollDown();
            break;
          default:
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [isDialogOpen]);

  return (
    <Dialog
      onOpenChange={(isOpen) => {
        setIsDialogOpen(isOpen);
      }}
    >
      <DialogTrigger asChild onClick={enterFullscreen}>
        <Button className={buttonClassName} onClick={enterFullscreen}>
          Presentation
        </Button>
      </DialogTrigger>
      <DialogContent
        hideClose
        className='w-screen h-screen max-w-[unset] sm:rounded-none flex flex-col'
        ref={dialogRef}
      >
        <header className='flex items-center justify-between p-4 relative'>
          <section className='absolute top-1 left-1/2 transform -translate-x-1/2 flex items-center gap-4'>
            <Button
              size='sm'
              variant='ghost'
              onClick={prevSlide}
              disabled={currentSlide === 0}
            >
              <ChevronLeft />
            </Button>
            <Progress value={progress} className='h-2 rounded-full w-96' />
            <Button
              size='sm'
              onClick={nextSlide}
              disabled={currentSlide === slides.length - 1}
              variant='ghost'
            >
              <ChevronRight />
            </Button>
          </section>
          {/* <DialogClose asChild>
            <Button size='sm' className='ml-auto'>
              <ChevronLeft /> Back to editor
            </Button>
          </DialogClose> */}
        </header>
        <div
          ref={editorWrapperRef}
          className='flex-grow overflow-auto p-4 [&_.bn-block-content.ProseMirror-selectednode>*]:outline-none'
        >
          <Editor
            key={currentSlide}
            editable={false}
            onChange={() => {}}
            initialContent={JSON.stringify(slides[currentSlide], null, 2)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Presentation;
