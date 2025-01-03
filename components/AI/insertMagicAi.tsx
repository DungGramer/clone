"use client";
import { BlockNoteEditor } from "@blocknote/core";
import { DefaultReactSuggestionItem } from "@blocknote/react";
// import "@blocknote/core/style.css";
import { ImMagicWand } from "react-icons/im";

const handleSubmit = async (prevText: string, prompt = "Continue the text") => {
  const response = await fetch("/api/generate", {
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
  const prevText = editor._tiptapEditor.state.doc.textBetween(
    Math.max(0, editor._tiptapEditor.state.selection.from - 5000),
    editor._tiptapEditor.state.selection.from - 1,
    "\n"
  );

  // Call handleSubmit to get AI-generated text
  const aiGeneratedText = await handleSubmit(prevText);

  // Insert the AI-generated text into the editor
  if (aiGeneratedText) {
    editor.insertBlocks(
      [{ type: "paragraph", content: aiGeneratedText }],
      editor.getTextCursorPosition().block,
      "before"
    );
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
