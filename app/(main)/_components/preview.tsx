import Presentation from "@/app/(main)/_components/presentation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Doc } from "@/convex/_generated/dataModel";
import { useRef, useState } from "react";

interface PresentationProps {
  initialData: Doc<"documents">;
  buttonClassName?: string;
}

const PresentationButton = ({
  initialData,
  buttonClassName,
}: PresentationProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const enterFullscreen = () => {
    setIsDialogOpen(true);
  };

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
        // ref={dialogRef}
      >
        <Presentation
          initialData={initialData}
          ref={dialogRef}
          open={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default PresentationButton;
