/* import {
  u as updateSchema,
  s as schema,
  v as transformContent,
  P as plugin,
  d as pluginKey,
  D as decorations,
  x as getBlocksInRange,
  y as findNodeType,
  b as createDecoration,
  M as markType,
  m as mergeAttributes,
  T as resolveStart,
  z as resolveEnd,
  R as replaceStep,
  A as addStep,
  S as setSelection,
  c as basePlugin,
  p as mapTransaction,
  F as fragment,
  B as isValidNode,
  l as nodeBuilder,
  C as addStylesheet,
} from "./index-C7CaB2OV.js";

class ContentBuffer {
  constructor() {
    this.content = "";
    this.lastPartial = "";
    this.endsWithOpenTag = false;
  }
  static create() {
    return new ContentBuffer();
  }
  append(partial) {
    if (this.endsWithOpenTag) this.content += "<";
    this.endsWithOpenTag = partial.endsWith("<");
    this.lastPartial = this.endsWithOpenTag ? partial.slice(0, -1) : partial;
    this.content += this.lastPartial;
  }
  finalize() {
    if (this.endsWithOpenTag) this.content += "<";
    this.endsWithOpenTag = false;
  }
}

const isSameParentNode = (selection) => {
  const { $from: start, $to: end, empty } = selection;
  return empty ? false : start.parent === end.parent;
};

function extractContent(editor, start, end) {
  const { state } = editor,
    documentFragment = state.doc.cut(start, end),
    schemaContent = updateSchema(
      schema.fromJSON(editor.schema, documentFragment.toJSON()).content,
      editor.schema
    );

  return isSameParentNode(editor.state.selection)
    ? schemaContent.slice(
        schemaContent.indexOf(">") + 1,
        schemaContent.lastIndexOf("<")
      )
    : schemaContent;
}

// ...[Additional code with renamed variables continues]
const isValidJson = (input) => {
  try {
    JSON.parse(input);
  } catch {
    return false;
  }
  return true;
};

const fetchTextData = async ({
  action,
  text,
  textOptions,
  extensionOptions,
  aborter,
}) => {
  const { appId, token, baseUrl } = extensionOptions;
  const apiUrl = baseUrl || defaultBaseUrl;
  const requestBody = {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "X-App-Id": appId,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      html: textOptions?.format === "rich-text" ? true : undefined,
      ...textOptions,
      text,
      stream: true,
    }),
  };

  if (aborter && aborter instanceof AbortController) {
    requestBody.signal = aborter.signal;
  }

  const response = await fetch(
    `${apiUrl}/text/${action}?stream=1`,
    requestBody
  );
  if (!response.ok) {
    const errorData = await response.json();
    const error = errorData?.error;
    throw new Error(
      `${error?.status || "500"} ${error?.message || "Unknown error"}`
    );
  }

  return response?.body;
};

function transformNodeContent(node) {
  if (!node) {
    return { type: "paragraph", content: [] };
  }
  if (Array.isArray(node)) {
    return node.map((child) => transformNodeContent(child));
  }
  if (node.content && Array.isArray(node.content)) {
    node.content = transformNodeContent(node.content);
  }
  if (node.type === "text") {
    const aiMark = { type: "aiMark" };
    node.marks = [...(node.marks || []), aiMark];
  }
  return node;
}

const handleEditorCommand = async ({
  props,
  action,
  textOptions,
  extensionOptions,
  fetchDataFn,
}) => {
  const { editor } = props;
  const { state } = editor;
  const storage = editor.storage.ai || editor.storage.advancedAi;
  const options = {
    collapseToEnd: true,
    format: "plain-text",
    ...textOptions,
  };
  const { from, to } =
    typeof options.insertAt === "number"
      ? { from: options.insertAt, to: options.insertAt }
      : options.insertAt || state.selection;
  const shouldInsert = options.insert !== false;
  const appendMode = options.append && options.insertAt === undefined;
  const extractedText =
    textOptions?.text ||
    (!options.plainText || options.format === "plain-text"
      ? extractContent(editor, from, to)
      : state.doc.textBetween(from, to, " "));

  if (!extractedText) return false;

  Object.assign(storage, {
    state: "loading",
    response: "",
    error: undefined,
    generatedWith: { options: textOptions, action, range: undefined },
  });

  editor.chain().setMeta("aiResponse", storage).run();
  const textDecoder = new TextDecoder("utf-8");
  const contentBuffer = ContentBuffer.create();
  let startPosition = from;
  let endPosition = to;

  return editor.commands.streamContent(
    appendMode ? to : { from, to },
    async ({ write }) => {
      try {
        const dataStream = await fetchDataFn({
          editor,
          action,
          text: extractedText,
          textOptions: options,
          extensionOptions,
        });
        const reader = dataStream?.getReader();
        if (!reader) {
          throw new Error("[tiptap-ai] fetchDataFn doesn’t return stream.");
        }
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const decodedChunk = textDecoder.decode(value, { stream: true });
          if (isValidJson(decodedChunk)) {
            const jsonResponse = JSON.parse(decodedChunk);
            if (jsonResponse.error) {
              throw new Error(
                `${jsonResponse.error.status || 500} - ${
                  jsonResponse.error.message
                } (${jsonResponse.error.code})`
              );
            }
          }
          contentBuffer.append(decodedChunk);
          Object.assign(storage, {
            state: "loading",
            response: contentBuffer.content,
            error: undefined,
            generatedWith: {
              options: textOptions,
              action,
              range: undefined,
            },
          });

          // Continue writing transformed content to the editor
          write({
            partial: decodedChunk,
            transform: ({ defaultTransform }) =>
              transformContent(
                transformNodeContent(defaultTransform().toJSON()),
                editor.schema
              ),
            appendToChain: (chain) => chain.setMeta("aiResponse", storage),
          });
        }
        contentBuffer.finalize();
        Object.assign(storage, {
          state: "idle",
          response: contentBuffer.content,
          error: undefined,
          generatedWith: {
            options: textOptions,
            action,
            range: undefined,
          },
        });
        storage.pastResponses.push(contentBuffer.content);
        editor.chain().setMeta("aiResponse", storage).run();
        return true;
      } catch (error) {
        Object.assign(storage, {
          state: "error",
          response: undefined,
          error,
          generatedWith: { options: textOptions, action, range: undefined },
        });
        editor.chain().setMeta("aiResponse", storage).run();
        return false;
      }
    }
  );
};

// [Continue with other function renaming and implementation adjustments...]
const applySuggestion = (editor, suggestion) => {
  const suggestionText = suggestion.type.attrs["data-suggestion"];
  editor
    .chain()
    .focus()
    .insertContentAt(suggestion.to - 1, suggestionText, {
      updateSelection: true,
      errorOnInvalidContent: false,
    })
    .focus()
    .run();
};

const findTableCellNode = (editorState) => {
  return findNodeType((node) => node.type.name === "tableCell")(
    editorState.selection
  )?.node;
};

const createDecorations = (nodes, promptText, suggestionText) =>
  nodes
    .map((node) => [
      createDecoration.inline(node.pos, node.pos + node.node.nodeSize, {
        class: "tiptap-ai-prompt",
      }),
      createDecoration.node(node.pos, node.pos + node.node.nodeSize, {
        class: "tiptap-ai-suggestion",
        "data-prompt": promptText,
        "data-suggestion": suggestionText,
      }),
    ])
    .flat();

let abortControllerInstance;

const abortAutocomplete = () => {
  abortControllerInstance?.abort();
};

const streamAutocomplete = async (editor, blocks, options) => {
  abortControllerInstance = new AbortController();
  const aiExtension = editor.extensionManager.extensions.find(
    (ext) => ext.name === "ai" || ext.name === "aiAdvanced"
  );
  if (!aiExtension) throw new Error("AI extension not found.");

  const { aiStreamResolver } = aiExtension.options;
  const recentText = (blocks.length > 3 ? blocks.slice(-3) : blocks)
    .filter((block) => block.node.textContent)
    .map((block) => block.node.textContent)
    .join(" ")
    .trim();

  if (!recentText.length) return;

  const optionsWithDefaults = {
    text: recentText.slice(-options.inputLength).trim(),
    aborter: abortControllerInstance,
  };

  const writeStreamContent = async ({ text, aborter }) => {
    let accumulatedText = "";
    try {
      const responseStream = await aiStreamResolver({
        editor,
        action: "autocomplete",
        text,
        textOptions: {
          modelName: options.modelName,
        },
        extensionOptions: aiExtension.options,
        aborter,
        defaultResolver: fetchTextData,
      });
      const reader = responseStream.getReader();
      const textDecoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: isDone } = await reader.read();
        done = isDone;
        const decodedChunk = textDecoder.decode(value, { stream: true });
        accumulatedText += decodedChunk;

        const newDecorations = createDecorations(
          [blocks[blocks.length - 1]],
          editor.view.state.doc.nodeSize,
          blocks[blocks.length - 1].node.textContent,
          accumulatedText || ""
        );
        const transaction = editor.view.state.tr.setMeta(
          "asyncDecorations",
          newDecorations
        );
        editor.view.dispatch(transaction);
      }
    } catch (error) {
      console.error("Error during autocomplete:", error);
    }
  };

  writeStreamContent(optionsWithDefaults);
};

// Setting up the autocomplete plugin
const setupAutocompletePlugin = ({
  editor,
  options,
  pluginKey = "AiAutocompletionPlugin",
}) =>
  new plugin({
    key: new pluginKey(pluginKey),
    state: {
      init() {
        return decorations.empty;
      },
      apply(transaction, previousState, oldEditorState, newEditorState) {
        const { doc, docChanged } = transaction;
        const asyncDecorations = transaction.getMeta("asyncDecorations");
        if (
          typeof asyncDecorations === "undefined" &&
          !docChanged &&
          oldEditorState.selection.eq(newEditorState.selection)
        ) {
          return previousState;
        }

        // Cleanup async decorations if necessary
        if (!oldEditorState.selection.eq(newEditorState.selection)) {
          abortAutocomplete();
        }

        const newDecorations = previousState.map(
          transaction.mapping,
          transaction.doc
        );
        return decorations.create(doc, asyncDecorations || []);
      },
    },
    props: {
      decorations(state) {
        return this.getState(state);
      },
      handleKeyDown(view, event) {
        const currentState = this.getState(view.state);
        const activeDecorations = currentState.find();
        const [start, end] =
          view.state.tr.getMeta("asyncDecorations") || activeDecorations || [];
        const clearDecorations = () => {
          const transaction = view.state.tr.setMeta("asyncDecorations", []);
          currentState?.remove([start]);
          currentState?.remove([end]);
          view.dispatch(transaction);
        };

        if (start) {
          switch (event.key) {
            case "Escape":
            case "Enter":
              abortAutocomplete();
              clearDecorations();
              break;
            default:
              clearDecorations();
              break;
          }
        }

        if (event.key === options.trigger) {
          event.preventDefault();
          event.stopPropagation();
          const isTableCell =
            findTableCellNode(editor)?.type.name === "tableCell";
          if (options.trigger === "Tab" && isTableCell) return false;

          if (start) {
            applySuggestion(editor, end);
            abortAutocomplete();
          } else {
            const position = editor.state.selection.to;
            const blocksInRange = getBlocksInRange(
              view.state.doc,
              { from: 0, to: position },
              (node) => node.isTextblock
            );
            const lastBlock = blocksInRange[blocksInRange.length - 1];
            const endOfBlock = lastBlock.pos + lastBlock.node.nodeSize;

            if (position === endOfBlock - 1) {
              streamAutocomplete(editor, blocksInRange, options);
            }
          }
        }

        return false;
      },
    },
  });
const aiMarkExtension = markType.create({
  name: "aiMark",
  addOptions() {
    return {
      HTMLAttributes: {
        class: "tiptap-ai-insertion",
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: "span",
        getAttrs: (node) =>
          node.classList.contains("tiptap-ai-insertion") && null,
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },
  addCommands() {
    return {
      setAiMark:
        () =>
        ({ commands }) =>
          commands.setMark(this.name),
      toggleAiMark:
        () =>
        ({ commands }) =>
          commands.toggleMark(this.name),
      unsetAiMark:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});

// CSS for AI suggestions
const aiSuggestionStyles = `
.tiptap-ai-suggestion {
  cursor: pointer;
  pointer-events: none;
}

.tiptap-ai-suggestion::after {
  color: #6B7280;
  content: attr(data-suggestion);
  pointer-events: none;
}

.tiptap-ai-suggestion br:first-child,
.tiptap-ai-suggestion br:last-child {
  content: ' ';
  display: inline;
}
`;

// Utility for creating a text selection range
const createTextSelection = (editor, rangeStart, rangeEnd) => {
  const { doc } = editor,
    startPosition = resolveStart(doc).from,
    endPosition = resolveEnd(doc).to;

  const start = Math.max(startPosition, rangeStart),
    end = Math.min(endPosition, rangeEnd);

  return resolveStart(doc).create(doc, start, end);
};

// Utility for resolving the last step of a transaction
const resolveLastTransactionStep = (transaction, stepIndex, direction) => {
  const lastStepIndex = transaction.steps.length - 1;
  if (lastStepIndex < stepIndex) return -1;

  const lastStep = transaction.steps[lastStepIndex];
  if (!(lastStep instanceof replaceStep || lastStep instanceof addStep))
    return -1;

  const mapping = transaction.mapping.maps[lastStepIndex];
  let mappedPosition = 0;
  mapping.forEach((from, to, newFrom, newTo) => {
    if (mappedPosition === 0) mappedPosition = newTo;
  });

  return setSelection.near(transaction.doc.resolve(mappedPosition), direction);
};

// Apply text selection updates during AI processing
const applyAiSelectionUpdates = ({ dispatch, tr, oldSelection }) => {
  if (dispatch) {
    const newSelection = resolveLastTransactionStep(
      tr,
      tr.steps.length - 1,
      -1
    );
    if (newSelection !== -1) {
      const textSelection = createTextSelection(tr, newSelection, oldSelection);
      tr.setSelection(textSelection);
      dispatch(tr);
      return true;
    }
  }
  return false;
};

// Fetch and process AI-generated text
const fetchAndProcessAiText = async ({
  action,
  text,
  textOptions,
  extensionOptions,
}) => {
  const { appId, token, baseUrl } = extensionOptions;
  const apiUrl = baseUrl || defaultBaseUrl;

  const response = await fetch(`${apiUrl}/text/${action}`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "X-App-Id": appId,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      html: textOptions?.format === "rich-text" ? true : undefined,
      ...textOptions,
      text,
    }),
  });

  const responseBody = await response.json();

  if (!response.ok) {
    const error = responseBody?.error;
    throw new Error(
      `${error?.status || "500"} ${error?.message || "Unknown error"}`
    );
  }

  return responseBody?.response;
};

// AI command handlers for the editor
const aiCommandHandlers = {
  aiAdjustTone:
    (tone, options = {}) =>
    (editorProps) =>
      processAiRequest(editorProps, "adjust-tone", {
        ...options,
        tone,
      }),
  aiSummarize:
    (options = {}) =>
    (editorProps) =>
      processAiRequest(editorProps, "summarize", options),
  aiTranslate:
    (language, options = {}) =>
    (editorProps) =>
      processAiRequest(editorProps, "translate", {
        ...options,
        language,
      }),
  aiImagePrompt:
    (options = {}) =>
    (editorProps) =>
      processImagePrompt(editorProps, options),
  aiAccept:
    ({ insertAt, append } = {}) =>
    ({ dispatch, editor, chain }) => {
      const aiStorage = editor.storage.ai || editor.storage.advancedAi;
      const { from, to } =
        typeof insertAt === "number"
          ? { from: insertAt, to: insertAt }
          : insertAt || editor.state.selection;
      const appendContent =
        append ??
        (typeof insertAt === "number" ||
          aiStorage.generatedWith?.options?.append);

      if (
        aiStorage.state !== "loading" &&
        aiStorage.state !== "error" &&
        aiStorage.response !== undefined
      ) {
        if (dispatch) {
          const { response } = aiStorage;

          Object.assign(aiStorage, {
            state: "idle",
            response: undefined,
            error: undefined,
            generatedWith: undefined,
          });

          aiStorage.pastResponses = [];

          chain()
            .setMeta("aiResponse", aiStorage)
            .focus()
            .insertContentAt(appendContent ? to : { from, to }, response, {
              parseOptions: { preserveWhitespace: false },
              errorOnInvalidContent: false,
            })
            .run();
        }
        return true;
      }
      return false;
    },
};
aiCommandHandlers.aiReject =
  ({ type = "reset" } = {}) =>
  ({ dispatch, editor, chain }) => {
    const aiStorage = editor.storage.ai || editor.storage.advancedAi;

    if (
      aiStorage.state === "error" ||
      aiStorage.response === undefined ||
      (aiStorage.generatedWith?.range &&
        aiStorage.generatedWith?.range !== undefined)
    ) {
      return false;
    }

    if (dispatch) {
      if (type === "reset") {
        Object.assign(aiStorage, {
          state: "idle",
          response: undefined,
          error: undefined,
          generatedWith: undefined,
        });
        aiStorage.pastResponses = [];
      } else if (type === "pause") {
        Object.assign(aiStorage, { state: "idle" });
      }

      chain().setMeta("aiResponse", aiStorage).run();
    }
    return true;
  };

aiCommandHandlers.aiRegenerate =
  ({ insert, insertAt } = {}) =>
  ({ dispatch, editor }) => {
    const aiStorage = editor.storage.ai || editor.storage.advancedAi;

    if (
      aiStorage.pastResponses.length === 0 ||
      !aiStorage.generatedWith ||
      (insert && (!aiStorage.generatedWith.range || insertAt === undefined))
    ) {
      return false;
    }

    if (dispatch) {
      const options = insert
        ? {
            ...aiStorage.generatedWith.options,
            insert: true,
            insertAt: insertAt ?? aiStorage.generatedWith.range,
          }
        : aiStorage.generatedWith.options;

      return processAiRequest(
        { dispatch, editor },
        aiStorage.generatedWith.action,
        options
      );
    }

    return true;
  };

// AI Plugin definition
const aiPlugin = basePlugin.create({
  name: "ai",
  addStorage() {
    return {
      pastResponses: [],
      state: "idle",
      response: undefined,
      error: undefined,
      generatedWith: undefined,
    };
  },
  addOptions() {
    return {
      appId: "YOUR_APP_ID",
      token: "YOUR_TOKEN_HERE",
      baseUrl: defaultBaseUrl,
      autocompletion: false,
      autocompletionOptions: {
        inputLength: 4000,
        trigger: "Tab",
      },
      append: false,
      collapseToEnd: true,
      aiStreamResolver: fetchTextData,
      aiCompletionResolver: fetchAndProcessAiText,
      aiImageResolver: fetchAndProcessImagePrompt,
      onLoading: () => null,
      onSuccess: () => null,
      onError: () => null,
    };
  },
  addExtensions() {
    return [aiMarkExtension.configure(), streamContentPlugin.configure()];
  },
  addProseMirrorPlugins() {
    const plugins = [];

    // Add AI-related CSS styles
    addStylesheet(aiSuggestionStyles, this.editor.options.injectNonce, "ai");

    // Add autocompletion plugin if enabled
    if (this.options.autocompletion) {
      plugins.push(
        setupAutocompletePlugin({
          editor: this.editor,
          options: {
            appId: this.options.appId,
            token: this.options.token,
            baseUrl: this.options.baseUrl || defaultBaseUrl,
            inputLength: this.options.autocompletionOptions.inputLength || 4000,
            modelName: this.options.autocompletionOptions.modelName,
            trigger: this.options.autocompletionOptions.trigger || "Tab",
          },
        })
      );
    }

    return plugins;
  },
  addCommands() {
    return aiCommandHandlers;
  },
});

// Stream content plugin
const streamContentPlugin = basePlugin.create({
  name: "streamContent",
  onTransaction({ transaction }) {
    asyncContentProcessors.forEach((processor) => processor(transaction));
  },
  addCommands() {
    return {
      streamContent:
        (range, writerCallback, options = {}) =>
        ({ editor }) => {
          const isInlineResponse = options.respondInline ?? true;
          const transactionId = Date.now();

          let from = -1;
          let to = -1;

          if (typeof range === "number") {
            from = range;
            to = range;
          } else if ("from" in range && "to" in range) {
            from = range.from;
            to = range.to;
          }

          if (from === -1 || to === -1) return false;

          let bufferSize = 0;
          const contentBuffer = ContentBuffer.create();
          const transactionMapper = new mapTransaction();

          const cleanup = () => {
            const previousLength = asyncContentProcessors.length;
            asyncContentProcessors = asyncContentProcessors.filter(
              (processor) => processor !== onTransaction
            );

            if (asyncContentProcessors.length === previousLength - 1) {
              contentBuffer.finalize();
              editor
                .chain()
                .setMeta("streamContent", {
                  startTime: transactionId,
                  partial: contentBuffer.lastPartial,
                  buffer: contentBuffer.content,
                  done: true,
                })
                .run();
            }
          };

          const writeContent = (input) => {
            const {
              partial,
              transform = parseContent,
              appendToChain = (chain) => chain,
            } = input;

            let chain = editor.chain();

            if (contentBuffer.content === "" && from !== to) {
              chain = chain.deleteRange({ from, to });
            }

            contentBuffer.append(partial);

            chain = chain
              .setMeta("streamContent", {
                startTime: transactionId,
                partial: contentBuffer.lastPartial,
                buffer: contentBuffer.content,
                done: true,
              })
              .setMeta("preventClearDocument", true);

            const transformedFragment = fragment.from(
              transform({
                partial: contentBuffer.lastPartial,
                buffer: contentBuffer.content,
                editor,
                defaultTransform: (input) =>
                  parseContent({
                    buffer: input || contentBuffer.content,
                    partial,
                    editor,
                  }),
              })
            );

            if (isValidNode(transformedFragment)) {
              const newSize = transformedFragment.size;
              const mappedStart = mapPosition(
                transactionMapper.map(from, 1),
                1,
                editor.state.doc.nodeSize - 2
              );
              const mappedEnd = Math.min(
                mappedStart + bufferSize,
                editor.state.doc.nodeSize - 2
              );

              chain = chain.command(({ tr }) => {
                tr.replaceRange(
                  mappedStart,
                  mappedEnd,
                  new nodeBuilder(transformedFragment, 0, 0)
                );
                return true;
              });

              bufferSize = newSize;
            }

            chain = appendToChain(chain);
            chain.run();

            return {
              buffer: contentBuffer.content,
              from: transactionMapper.map(from),
              to: transactionMapper.map(from) + bufferSize,
            };
          };

          const asyncContentProcessor = {
            cleanup,
            write: writeContent,
          };

          try {
            writerCallback(asyncContentProcessor);
          } finally {
            cleanup();
          }

          return true;
        },
    };
  },
});
const defaultBaseUrl = "https://api.tiptap.dev/v1/ai";
const demoBaseUrl = "https://api-demo.tiptap.dev/v1/ai";

// AI Plugin registration utility
const registerAiPlugin = () => {
  if (!window) return true;

  const { location } = window;
  const { hostname } = location;

  return ![
    "localhost",
    "tiptap.dev",
    "embed-pro.tiptap.dev",
    "ai-demo.tiptap.dev",
    "demos.tiptap.dev",
    "demo-pitch.tiptap.dev",
  ].includes(hostname);
};

// Utility for determining if all nodes are valid
const areAllNodesValid = (nodes) => {
  let isValid = true;

  nodes.forEach((node) => {
    if (isValid) {
      isValid = isValidNode(node, {
        checkChildren: true,
        ignoreWhitespace: true,
      });
    }
  });

  return isValid;
};

// Utility to calculate the depth of nested content
const getNestedContentDepth = (node, depth = 0) => {
  if (!node) return -1;
  return node.firstChild
    ? 1 + getNestedContentDepth(node.firstChild, depth + 1)
    : depth;
};

// Stream Content Manager
const contentStreamKey = new pluginKey("streamContent");
let asyncContentProcessors = [];

const contentStreamPlugin = basePlugin.create({
  name: "streamContent",
  onTransaction({ transaction }) {
    asyncContentProcessors.forEach((processor) => processor(transaction));
  },
  addCommands() {
    return {
      streamContent:
        (range, writerCallback, options = {}) =>
        ({ editor }) => {
          const transactionId = Date.now();
          let from = -1,
            to = -1;

          if (typeof range === "number") {
            from = to = range;
          } else if (range.from !== undefined && range.to !== undefined) {
            from = range.from;
            to = range.to;
          }

          if (from === -1 || to === -1) return false;

          const isInlineResponse = options.respondInline !== false;
          const contentBuffer = ContentBuffer.create();
          const transactionMapper = new mapTransaction();
          let bufferSize = 0;

          const cleanup = () => {
            asyncContentProcessors = asyncContentProcessors.filter(
              (processor) => processor.transactionId !== transactionId
            );

            contentBuffer.finalize();

            editor
              .chain()
              .setMeta(contentStreamKey, {
                startTime: transactionId,
                partial: contentBuffer.lastPartial,
                buffer: contentBuffer.content,
                done: true,
              })
              .run();
          };

          const writeContent = ({
            partial,
            transform = parseContent,
            appendToChain = (chain) => chain,
          }) => {
            let chain = editor.chain();

            if (contentBuffer.content === "" && from !== to) {
              chain = chain.deleteRange({ from, to });
            }

            contentBuffer.append(partial);

            chain = chain
              .setMeta(contentStreamKey, {
                startTime: transactionId,
                partial: contentBuffer.lastPartial,
                buffer: contentBuffer.content,
                done: true,
              })
              .setMeta("preventClearDocument", true);

            const transformedContent = fragment.from(
              transform({
                partial: contentBuffer.lastPartial,
                buffer: contentBuffer.content,
                editor,
                defaultTransform: (input) =>
                  parseContent({
                    buffer: input || contentBuffer.content,
                    partial,
                    editor,
                  }),
              })
            );

            if (!areAllNodesValid([transformedContent])) return chain.run();

            const contentSize = transformedContent.size;
            const mappedFrom = Math.max(transactionMapper.map(from, 1), 0);
            const mappedTo = Math.min(
              mappedFrom + bufferSize,
              editor.state.doc.nodeSize - 2
            );

            chain = chain.command(({ tr }) => {
              tr.replaceRange(
                mappedFrom,
                mappedTo,
                new nodeBuilder(
                  transformedContent,
                  isInlineResponse
                    ? 0
                    : getNestedContentDepth(transformedContent)
                )
              );
              return true;
            });

            bufferSize = contentSize;

            return appendToChain(chain).run();
          };

          asyncContentProcessors.push({
            transactionId,
            write: writeContent,
            cleanup,
          });

          writerCallback({
            write: writeContent,
            getWritableStream: () => {
              const decoder = new TextDecoder("utf-8");

              return new WritableStream({
                write(chunk) {
                  return new Promise((resolve) => {
                    const decodedText = decoder.decode(chunk, { stream: true });
                    writeContent({ partial: decodedText });
                    resolve();
                  });
                },
                close() {
                  cleanup();
                },
              });
            },
          });

          return true;
        },
    };
  },
});

const processAiRequest = async (editorProps, action, options = {}) => {
  const { dispatch, editor } = editorProps;
  const aiStorage = editor.storage.ai || editor.storage.advancedAi;

  if (aiStorage.state === "loading") return false;

  const { state, selection } = editor;
  const { from, to } =
    typeof options.insertAt === "number"
      ? { from: options.insertAt, to: options.insertAt }
      : options.insertAt || selection;

  const textToProcess =
    options.text ||
    (!options.plainText || options.format === "plain-text"
      ? extractContent(editor, from, to)
      : state.doc.textBetween(from, to, " "));

  if (!textToProcess) return false;

  Object.assign(aiStorage, {
    state: "loading",
    response: "",
    error: undefined,
    generatedWith: {
      options,
      action,
      range: undefined,
    },
  });

  editor.chain().setMeta("aiResponse", aiStorage).run();

  try {
    const processedResponse = await fetchTextData({
      action,
      text: textToProcess,
      textOptions: options,
      extensionOptions: editor.extensionManager.get("ai").options,
    });

    Object.assign(aiStorage, {
      state: "idle",
      response: processedResponse,
      error: undefined,
      generatedWith: {
        options,
        action,
        range: options.insert ? { from, to } : undefined,
      },
    });

    aiStorage.pastResponses.push(processedResponse);

    if (dispatch && options.insert !== false) {
      editor
        .chain()
        .setMeta("aiResponse", aiStorage)
        .focus()
        .insertContentAt(
          options.insert ? to : { from, to },
          processedResponse,
          {
            parseOptions: { preserveWhitespace: false },
            errorOnInvalidContent: false,
          }
        )
        .run();
    } else {
      editor.chain().setMeta("aiResponse", aiStorage).run();
    }

    return true;
  } catch (error) {
    Object.assign(aiStorage, {
      state: "error",
      response: undefined,
      error,
      generatedWith: { options, action, range: undefined },
    });

    editor.chain().setMeta("aiResponse", aiStorage).run();

    return false;
  }
};

const fetchAndProcessImagePrompt = async ({
  text,
  imageOptions,
  extensionOptions,
}) => {
  const { appId, token, baseUrl } = extensionOptions;
  const apiUrl = baseUrl || defaultBaseUrl;

  const response = await fetch(`${apiUrl}/image/prompt`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "X-App-Id": appId,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...imageOptions,
      text,
    }),
  });

  const responseBody = await response.json();

  if (!response.ok) {
    const error = responseBody?.error;
    throw new Error(
      `${error?.status || "500"} ${error?.message || "Unknown error"}`
    );
  }

  return responseBody?.response;
};

// Default AI configuration and exports
const defaultAiConfiguration = {
  appId: "YOUR_APP_ID",
  token: "YOUR_TOKEN_HERE",
  baseUrl: defaultBaseUrl,
  autocompletionOptions: {
    inputLength: 4000,
    trigger: "Tab",
  },
  aiStreamResolver: fetchTextData,
  aiCompletionResolver: fetchAndProcessAiText,
  aiImageResolver: fetchAndProcessImagePrompt,
  onLoading: () => null,
  onSuccess: () => null,
  onError: () => null,
};

export {
  aiPlugin as default,
  fetchAndProcessAiText as fetchTextProcessor,
  fetchAndProcessImagePrompt as fetchImageProcessor,
  handleEditorCommand as executeEditorCommand,
  registerAiPlugin,
};
 */