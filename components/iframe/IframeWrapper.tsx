import { iframeParse } from "@/components/iframe/Iframe.d";
import { schema } from "@/components/PageBreakBlock";
import { FileBlockConfig, insertOrUpdateBlock } from "@blocknote/core";
import {
  createReactBlockSpec,
  DefaultReactSuggestionItem,
  ReactCustomBlockRenderProps,
} from "@blocknote/react";
import { cx } from "class-variance-authority";
import { useState } from "react";
import { RiImage2Fill } from "react-icons/ri";

export const iframeBlockConfig = {
  type: "iframe" as const,
  width: "100%" as any,
  propSchema: {
    url: { default: "" },
    width: { default: 600 },
    height: { default: 400 },
    caption: { default: "" },
    name: { default: "" },
    showPreview: { default: true },
    previewWidth: { default: 600 },
    textAlignment: {
      default: "center" as const,
      values: ["left", "center", "right"] as const,
    },
  },
  content: "none" as const,
  isFileBlock: true,
} as FileBlockConfig;

// type AlignmentType =
//   (typeof iframeBlockConfig.propSchema.textAlignment.values)[number];

export const IframePreview = (
  props: Omit<
    ReactCustomBlockRenderProps<typeof iframeBlockConfig, any, any>,
    "contentRef"
  >
) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [url, setUrl] = useState("");
  const [width, setWidth] = useState("600");
  const [height, setHeight] = useState("400");
  // const [textAlignment, setTextAlignment] = useState<AlignmentType>(
  //   (props.block.props.textAlignment as AlignmentType) || "center"
  // );

  const alignmentClasses = {
    left: "justify-left",
    center: "justify-center",
    right: "justify-right",
  };

  if (!props.block.props.url) {
    return (
      <div className='relative'>
        <div
          className='cursor-pointer p-4 border-2 border-dashed border-gray-300 rounded-md text-center'
          onClick={() => setShowTooltip(true)}
        >
          <p>Click to add iframe URL</p>
        </div>

        {showTooltip && (
          <div className='absolute top-full left-0 mt-2 p-4 bg-white shadow-lg rounded-md border border-gray-200 z-50'>
            <div className='space-y-3'>
              <div>
                <label className='block text-sm font-medium mb-1'>URL:</label>
                <input
                  type='text'
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className='w-full px-3 py-2 border rounded-md'
                  placeholder='https://example.com'
                />
              </div>
              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <label className='block text-sm font-medium mb-1'>
                    Width:
                  </label>
                  <input
                    type='number'
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    className='w-full px-3 py-2 border rounded-md'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium mb-1'>
                    Height:
                  </label>
                  <input
                    type='number'
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className='w-full px-3 py-2 border rounded-md'
                  />
                </div>
              </div>
              {/* <div>
                <label className='block text-sm font-medium mb-1'>
                  Alignment:
                </label>
                <div className='flex space-x-2'>
                  {(["left", "center", "right"] as const).map((align) => (
                    <button
                      key={align}
                      onClick={() => setTextAlignment(align)}
                      className={`px-3 py-1 text-sm border rounded-md ${
                        textAlignment === align
                          ? "bg-blue-500 text-white"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {align.charAt(0).toUpperCase() + align.slice(1)}
                    </button>
                  ))}
                </div>
              </div> */}
              <div className='flex justify-end space-x-2 mt-3'>
                <button
                  onClick={() => setShowTooltip(false)}
                  className='px-3 py-1 text-sm border rounded-md hover:bg-gray-100'
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (url && props.editor) {
                      props.editor.updateBlock(props.block, {
                        props: {
                          url,
                          width: parseInt(width),
                          height: parseInt(height),
                          caption: "",
                          name: "iframe",
                          // textAlignment,
                          showPreview: true,
                          previewWidth: parseInt(width),
                        } as any,
                      });
                      setShowTooltip(false);
                    }
                  }}
                  className='px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600'
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cx(
        "bn-visual-media",
        "flex",
        "w-full",
        alignmentClasses[
          // (props.block.props.textAlignment as AlignmentType) ||
           "center"
        ]
      )}
    >
      <iframe
        className={"bn-visual-media"}
        src={props.block.props.url}
        contentEditable={false}
        draggable={false}
        width={props.block.props.width}
        height={props.block.props.height}
      />
    </div>
  );
};

export const IframeToExternalHTML = (
  props: Omit<
    ReactCustomBlockRenderProps<typeof iframeBlockConfig, any, any>,
    "contentRef"
  >
) => {
  if (!props.block.props.url) {
    return <p>Add image</p>;
  }

  return (
    <iframe
      className={"bn-visual-media"}
      src={props.block.props.url}
      contentEditable={false}
      draggable={false}
      width={props.block.props.width}
      height={props.block.props.height}
    />
  );
};

/* const IframeToExternalHTMLs = (
  props: Omit<
    ReactCustomBlockRenderProps<typeof iframeBlockConfig, any, any>,
    "contentRef"
  >
) => {
  const [url, setUrl] = useState(props.block.props.url || "");
  const [width, setWidth] = useState(props.block.props.width || "400"); // Giá trị mặc định
  const [height, setHeight] = useState(props.block.props.height || "315"); // Giá trị mặc định

  const addIframe = useCallback(() => {
    if (!editor || !url) return;

    // Tạo một block mới kiểu 'iframe'
    const iframeBlock: PartialBlock = {
      id: Math.random().toString(36).substring(2), // ID duy nhất
      type: "iframe",
      width: "100%",
      props: {
        url: url,
        width: width,
        height: height,
        style: {}, // Có thể thêm style trực tiếp, nếu cần
      },
      content: [], // Iframe thường không có nội dung con trong BlockNote
      children: [],
    };

    // Thêm block vào editor tại vị trí con trỏ hiện tại (hoặc cuối cùng)
    editor.insertBlocks(
      [iframeBlock],
      editor.getTextCursorPosition().block,
      "after"
    );
    setUrl(""); // Reset URL input
    // Không cần reset width/height vì có thể muốn giữ nguyên cho lần nhúng tiếp theo.
  }, [editor, url, width, height]);

  return (
    <div>
      <div>
        <label htmlFor='iframe-url'>Iframe URL:</label>
        <input
          id='iframe-url'
          type='text'
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder='https://example.com'
        />
      </div>
      <div>
        <label htmlFor='iframe-width'>Width:</label>
        <input
          id='iframe-width'
          type='number'
          value={width}
          onChange={(e) => setWidth(e.target.value)}
          placeholder='Width (px)'
        />
        <label htmlFor='iframe-height'>Height:</label>
        <input
          id='iframe-height'
          type='number'
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          placeholder='Height (px)'
        />
      </div>
      <button onClick={addIframe}>Add Iframe</button>
    </div>
  );
}; */

const IframeBlock = (
  props: ReactCustomBlockRenderProps<typeof iframeBlockConfig, any, any>
) => {
  return (
    <div
      // {...(props as any)}
      className='w-full'
    >
      <IframePreview {...(props as any)} />
    </div>
  );
};

export const ReactIframeBlock = createReactBlockSpec(
  {
    type: "iframe" as any,
    width: "100%" as any,
    propSchema: {
      url: { default: "" },
      width: { default: 600 },
      height: { default: 400 },
    } as any,
    content: "none",
  } as any,
  {
    render: IframeBlock,
    parse: iframeParse,
    toExternalHTML: IframeToExternalHTML,
  }
);

const insertIframeItem = (
  editor: typeof schema.BlockNoteEditor
): DefaultReactSuggestionItem => ({
  title: "Iframe",
  onItemClick: async () => {
    insertOrUpdateBlock(editor, {
      type: "iframe" as any,
    });
  },
  aliases: ["iframe", "embed", "url"],
  group: "Media",
  icon: <RiImage2Fill size={18} />,
  subtext: "Add an embedded iframe",
});

export default insertIframeItem;
