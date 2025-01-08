"use client";
import { BlockNoteEditor } from "@blocknote/core";
import { DefaultReactSuggestionItem } from "@blocknote/react";
// import "@blocknote/core/style.css";
import { ImMagicWand } from "react-icons/im";

export const postGenerateAI = async (prevText: string, prompt = "Continue the text") => {
  const response = await fetch("https://propozel-backend.onrender.com/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: `${prompt}: "${prevText}"` }),
  });

  if (!response.ok) {
    console.error("Failed to fetch AI-generated text");
    return "";
  }

  const { output } = await response.json();
  return output;
};

const insertMagicAi = async (editor: BlockNoteEditor) => {
  const selection = editor.getSelection();
  let selectionBlock;

  if (selection) {
    selectionBlock = selection?.blocks;
  } else {
    const startBlock = editor.document[0];
    const currentPositionBlock = editor.getTextCursorPosition().block;

    // Select all from start to current position
    editor.setSelection(startBlock, currentPositionBlock);
    const newSelection = editor.getSelection();
    // Un-select
    editor.setTextCursorPosition(currentPositionBlock);

    selectionBlock = newSelection?.blocks;
  }

  /*  const prevText = editor._tiptapEditor.state.doc.textBetween(
    Math.max(0, editor._tiptapEditor.state.selection.from - 5000),
    editor._tiptapEditor.state.selection.from - 1,
    "\n"
  ); */


  // Call handleSubmit to get AI-generated text
  const aiGeneratedText = await postGenerateAI(JSON.stringify(selectionBlock));

  // Insert the AI-generated text into the editor
  if (aiGeneratedText) {
    const blockInserted = editor.insertBlocks(
      [{ type: "paragraph", content: '' }],
      editor.getTextCursorPosition().block,
      "before"
    );

    editor.updateBlock(blockInserted?.[0], { content: aiGeneratedText });
  }
};

const insertMagicItem = (
  editor: BlockNoteEditor
): DefaultReactSuggestionItem => ({
  title: "Continue with AI",
  onItemClick: async () => {
    insertMagicAi(editor);
  },
  aliases: ["autocomplete", "ai", "fill"],
  group: "AI",
  icon: <ImMagicWand size={18} />,
  subtext: "Continue your note with Ai-generated text",
});

/* const getCustomSlashMenuItems = (
  editor: BlockNoteEditor
): DefaultReactSuggestionItem[] => [
  ...getDefaultReactSlashMenuItems(editor),
  insertMagicItem(editor),
]; */

export default insertMagicItem;
