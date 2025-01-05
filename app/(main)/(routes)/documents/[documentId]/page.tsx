"use client";
import dynamic from "next/dynamic";
import { useMemo, useCallback, useState, useEffect } from "react";
import { debounce } from "lodash";
import Cover from "@/components/cover";
import Toolbar from "@/components/toolbar";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";

interface DocumentIdPageProps {
  params: {
    documentId: Id<"documents">;
  };
}

const DocumentIdPage = ({ params }: DocumentIdPageProps) => {
  const Editor = useMemo(
    () => dynamic(() => import("@/components/editor"), { ssr: false }),
    []
  );

  const document = useQuery(api.documents.getById, {
    documentId: params.documentId,
  });

  const update = useMutation(api.documents.update);
  const [localContent, setLocalContent] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Save content to the server
  const saveContent = useCallback(async (content: string) => {
    setIsSaving(true);
    try {
      await update({
        id: params.documentId,
        content,
      });
    } finally {
      setIsSaving(false);
    }
  }, [params.documentId, update]);

  // Debounced update with shorter delay (300ms)
  const debouncedUpdate = useMemo(
    () => debounce((content: string) => saveContent(content), 300),
    [saveContent]
  );

  // Handle content changes during typing
  const onChange = (content: string) => {
    setLocalContent(content);
    debouncedUpdate(content);
  };

  // Save immediately on blur
  const onBlur = () => {
    debouncedUpdate.cancel(); // Cancel any pending debounced saves
    if (localContent) {
      saveContent(localContent);
    }
  };

  // Save before unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (localContent) {
        debouncedUpdate.cancel();
        saveContent(localContent);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      debouncedUpdate.cancel();
    };
  }, [localContent, debouncedUpdate, saveContent]);

  if (document === undefined) {
    return (
      <div>
        <Cover.Skeleton />
        <div className='md:max-w-3xl lg:max-w-4xl mx-auto mt-10'>
          <div className='space-y-4 pl-8 pt-4'>
            <Skeleton className='h-14 w-[50%]' />
            <Skeleton className='h-4 w-[80%]' />
            <Skeleton className='h-4 w-[40%]' />
            <Skeleton className='h-4 w-[60%]' />
          </div>
        </div>
      </div>
    );
  }

  if (document === null) {
    return <div>Not found</div>;
  }

  return (
    <div className='pb-40'>
      <Cover url={document.coverImage} />
      <div className='md:max-w-3xl lg:max-w-4xl mx-auto'>
        <Toolbar initialData={document} />
        <Editor 
          onChange={onChange} 
          initialContent={document.content} 
          editable={true}
          onBlur={onBlur}
        />
      </div>
    </div>
  );
};

export default DocumentIdPage;