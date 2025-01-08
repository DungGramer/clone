import { postGenerateAI } from "@/components/AI/insertMagicAi";
import "@blocknote/mantine/style.css";
import {
  useBlockNoteEditor,
  useComponentsContext,
  useSelectedBlocks,
} from "@blocknote/react";
import { Bot } from "lucide-react";
import { useCallback, useMemo } from "react";

export function AIToolbarButton() {
  const editor = useBlockNoteEditor();
  const Components = useComponentsContext()!;
  const selectedBlocks = useSelectedBlocks(editor);

  // const [isSelected, setIsSelected] = useState<boolean>(
  //   editor.getActiveStyles().textColor === "blue" &&
  //     editor.getActiveStyles().backgroundColor === "blue"
  // );

  const onSubmit = useCallback(async () => {
    const selectedText = editor.getSelectedText();
    const aiGeneratedText = await postGenerateAI(selectedText);

    const currentPositionBlock = editor.getTextCursorPosition().block as any;
    const blockContent = currentPositionBlock?.content;
    const replacedContent = blockContent?.[0]?.text?.replace(selectedText, aiGeneratedText);
    editor.updateBlock(currentPositionBlock, { content: replacedContent });
  }, [editor]);

  // Check selected blocks
  // useEditorContentOrSelectionChange(() => {
  //   // console.log(`📕 editor - 23:AIToolbarButton.tsx \n`, editor);
  //   // setIsSelected(
  //   //   editor.getActiveStyles().textColor === "blue" &&
  //   //     editor.getActiveStyles().backgroundColor === "blue"
  //   // );
  // }, editor);

  const show = useMemo(() => {
    return !selectedBlocks.find(
      (block) => editor.schema.blockSchema[block.type].content !== "inline"
    );
  }, [editor.schema.blockSchema, selectedBlocks]);

  if (!show || !editor.isEditable) {
    return null;
  }

  return (
    <Components.FormattingToolbar.Button
      mainTooltip={"Continue your idea with some extra inspiration!"}
      onClick={onSubmit}
      // isSelected={isSelected}
      icon={<Bot size={24} />}
    >
      Continue with AI
    </Components.FormattingToolbar.Button>
  );
}
