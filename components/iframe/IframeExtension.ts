/* import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react"; // Quan trọng cho BlockNote
import IframeWrapper from "./IframeWrapper"; // Component React bọc iframe

const IframeExtension = Node.create({
  name: "iframe",

  group: "block", // Iframe là một block-level element

  atom: true, // Không cho phép chỉnh sửa nội dung bên trong iframe trực tiếp

  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: "100%",
      },
      height: {
        default: "300px", // Chiều cao mặc định
      },
      frameborder: {
        default: 0,
      },
      allowfullscreen: {
        default: true,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "iframe", // Nhận diện thẻ iframe trong HTML
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["iframe", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(IframeWrapper); // Sử dụng ReactNodeViewRenderer
  },

  addCommands() {
    return {
      setIframe:
        (attributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          });
        },
      // Thêm command xóa nếu cần
      deleteIframe:
        () =>
        ({ commands }) => {
          return commands.deleteSelection();
        },
    };
  },
});

export default IframeExtension;
 */