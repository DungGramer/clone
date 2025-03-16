export declare const iframeBlockConfig: {
  type: "iframe";
  propSchema: {
    url: { default: "" };
    width: { default: 600 };
    height: { default: 400 };
  };
  content: "none";
  isFileBlock: true;
};

export declare const iframeParse: (
  element: HTMLElement
) => Partial<Props<typeof iframeBlockConfig.propSchema>> | undefined;
