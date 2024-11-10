import {
  BlockNoteSchema,
  BlockSchemaWithBlock,
  defaultBlockSpecs,
  DefaultInlineContentSchema,
  defaultProps,
  DefaultStyleSchema,
  insertOrUpdateBlock,
  PartialBlock,
} from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import { Minus } from "lucide-react";

// Define the page break block schema
const PageBreakBlock = createReactBlockSpec(
  {
    type: "page_break",
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      textColor: defaultProps.textColor,
    },
    content: "inline",
  },
  { render: () => <hr style={{ margin: "24px 0", width: "100%" }} /> }
);

export default PageBreakBlock;

export const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    page_break: PageBreakBlock,
  },
});

export const insertPageBreak = (editor: typeof schema.BlockNoteEditor) => ({
  title: "Page Break",
  onItemClick: () => {
    insertOrUpdateBlock(editor, {
      type: "page_break",
    });
  },
  aliases: ["page_break", "new_page", "separator", "---"],
  group: "Other",
  icon: <Minus />, // Choose an icon that represents a page break or separator
});

export type Schema = PartialBlock<
  BlockSchemaWithBlock<"page_break", (typeof PageBreakBlock)["config"]>,
  DefaultInlineContentSchema,
  DefaultStyleSchema
>;
