"use client";

import {
  combineByGroup,
  filterSuggestionItems,
  locales,
} from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
// import "@blocknote/core/style.css";
import insertMagicItem from "@/components/AI/insertMagicAi";
import { insertPageBreak } from "@/components/PageBreakBlock";
import { useEdgeStore } from "@/lib/edgestore";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import {
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
} from "@blocknote/react";
import {
  getMultiColumnSlashMenuItems,
  multiColumnDropCursor,
  locales as multiColumnLocales,
  withMultiColumn,
} from "@blocknote/xl-multi-column";
import { useTheme } from "next-themes";
import { useMemo } from "react";
import { schema } from "./PageBreakBlock";

import { AIToolbarButton } from "@/components/AI/AIToolbarButton";
import {
  BasicTextStyleButton,
  BlockTypeSelect,
  ColorStyleButton,
  CreateLinkButton,
  FileCaptionButton,
  FileReplaceButton,
  FormattingToolbar,
  FormattingToolbarController,
  NestBlockButton,
  TextAlignButton,
  UnnestBlockButton,
} from "@blocknote/react";
import { useDebouncedCallback } from "use-debounce";

interface EditorProps {
  onChange: (value: string) => void;
  initialContent?: string;
  editable?: boolean;
  onBlur?: () => void;
}

const Editor = ({
  onChange,
  initialContent,
  editable,
  onBlur,
}: EditorProps) => {
  const { resolvedTheme } = useTheme();
  const { edgestore } = useEdgeStore();

  const handleUpload = async (file: File) => {
    const response = await edgestore.publicFiles.upload({
      file,
    });

    return response.url;
  };

  const editor = useCreateBlockNote({
    schema: withMultiColumn(schema),
    dropCursor: multiColumnDropCursor,
    initialContent: initialContent ? JSON.parse(initialContent) : undefined,
    uploadFile: handleUpload,
    dictionary: {
      ...locales.en,
      multi_column: multiColumnLocales.en,
    },
  });

  const debounced = useDebouncedCallback((value) => {
    onChange(value);
  }, 2000);

  /* const { complete, completion, isLoading, stop } = useCompletion({
    onFinish: (_prompt, completion) => {
      // select the text that was just inserted
      editor?._tiptapEditor.commands.setTextSelection({
        from: editor._tiptapEditor.state.selection.from - completion.length,
        to: editor._tiptapEditor.state.selection.from,
      });

      editor?._tiptapEditor.commands.focus("end");
    },
    onError: (err) => {
      console.error(`📕 err - 87:editor.tsx \n`, err);
      toast.error("Something went wrong with text generation", {
        duration: 3000,
      });
    },
  }); */

  /* const prev = useRef("");

  useEffect(() => {
    if (!editor) return;

    const streamCompletion = async () => {
      const diff = completion?.slice(prev.current.length);
      prev.current = completion;

      const block = editor.getTextCursorPosition().block;
      const blockText = (await editor?.blocksToMarkdownLossy([block]))?.trim();

      editor.updateBlock(editor.getTextCursorPosition().block, {
        id: editor.getTextCursorPosition().block.id,
        content: blockText + diff,
      });
    };

    streamCompletion();
  }, [isLoading, completion]);

  useEffect(() => {
    if (!editor) return;

    // if user presses escape or cmd + z and it's loading,
    // stop the request, delete the completion, and insert back the "++"
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || (e.metaKey && e.key === "z")) {
        stop();
        if (e.key === "Escape") {
          editor?._tiptapEditor.commands.deleteRange({
            from: editor._tiptapEditor.state.selection.from - completion.length,
            to: editor._tiptapEditor.state.selection.from,
          });
        }
        editor?._tiptapEditor.commands.insertContent("++");
      }
    };
    const mousedownHandler = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      stop();
    };
    if (isLoading) {
      document.addEventListener("keydown", onKeyDown);
      window.addEventListener("mousedown", mousedownHandler);
    } else {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", mousedownHandler);
    }
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", mousedownHandler);
    };
  }, [stop, isLoading, editor, complete, completion.length]); */

  const getSlashMenuItems = useMemo(() => {
    return async (query: string) =>
      filterSuggestionItems(
        combineByGroup(
          getDefaultReactSlashMenuItems(editor),
          getMultiColumnSlashMenuItems(editor),
          [insertPageBreak(editor as unknown as never)],
          [insertMagicItem(editor as unknown as never)]
        ),
        query
      );
  }, [editor]);

  return (
    <div>
      <BlockNoteView
        editable={editable}
        editor={editor}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        onChange={async () => {
          /* const block = editor.getTextCursorPosition().block;
          const blockText = (
            await editor.blocksToMarkdownLossy([block])
          ).trim();

          const lastTwo = blockText?.slice(-2);
          if (lastTwo === "++" && !isLoading) {
            editor.updateBlock(block, {
              id: block.id,
              content: blockText?.slice(0, -2),
            });
            complete(blockText?.slice(-500) ?? "");
          } */

          debounced(JSON.stringify(editor.document, null, 2));
        }}
        onBlur={onBlur}
        slashMenu={false}
        formattingToolbar={false}
      >
        <SuggestionMenuController
          triggerCharacter='/'
          getItems={getSlashMenuItems}
        />
        <FormattingToolbarController
          formattingToolbar={() => {
            return (
              <FormattingToolbar>
                <BlockTypeSelect key={"blockTypeSelect"} />
                <AIToolbarButton key={"customButton"} />

                <FileCaptionButton key={"fileCaptionButton"} />
                <FileReplaceButton key={"replaceFileButton"} />

                <BasicTextStyleButton
                  basicTextStyle={"bold"}
                  key={"boldStyleButton"}
                />
                <BasicTextStyleButton
                  basicTextStyle={"italic"}
                  key={"italicStyleButton"}
                />
                <BasicTextStyleButton
                  basicTextStyle={"underline"}
                  key={"underlineStyleButton"}
                />
                <BasicTextStyleButton
                  basicTextStyle={"strike"}
                  key={"strikeStyleButton"}
                />
                {/* Extra button to toggle code styles */}
                <BasicTextStyleButton
                  key={"codeStyleButton"}
                  basicTextStyle={"code"}
                />

                <TextAlignButton
                  textAlignment={"left"}
                  key={"textAlignLeftButton"}
                />
                <TextAlignButton
                  textAlignment={"center"}
                  key={"textAlignCenterButton"}
                />
                <TextAlignButton
                  textAlignment={"right"}
                  key={"textAlignRightButton"}
                />

                <ColorStyleButton key={"colorStyleButton"} />

                <NestBlockButton key={"nestBlockButton"} />
                <UnnestBlockButton key={"unnestBlockButton"} />

                <CreateLinkButton key={"createLinkButton"} />
              </FormattingToolbar>
            );
          }}
        />
      </BlockNoteView>
    </div>
  );
};

export default Editor;
