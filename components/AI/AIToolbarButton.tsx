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

  const unnestBlock = useCallback(() => {
    editor.focus();
    // const selectedText = editor.getSelectedText();
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
      onClick={unnestBlock}
      // isSelected={isSelected}
      icon={<Bot size={24} />}
    >
      Continue with AI
    </Components.FormattingToolbar.Button>
  );
}
