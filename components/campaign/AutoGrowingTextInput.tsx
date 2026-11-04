import { campaignTextHeight } from "@/services/campaignTextHeight";
import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Platform, TextInput, TextInputProps } from "react-native";

interface Props extends Omit<TextInputProps, "multiline" | "value"> {
  value: string;
  minimumHeight?: number;
}

/** Cresce e encolhe com o conteúdo no nativo e no textarea da web. */
export function AutoGrowingTextInput({ value, minimumHeight = 60, style, onContentSizeChange, onLayout, ...props }: Props) {
  const input = useRef<TextInput>(null);
  const lastWidth = useRef(0);
  const [height, setHeight] = useState(minimumHeight);
  const measureWeb = useCallback(() => {
    if (Platform.OS !== "web") return;
    const element = input.current as unknown as HTMLTextAreaElement | null;
    if (!element?.style) return;
    element.style.height = "auto";
    const measured = campaignTextHeight(element.scrollHeight + 2, minimumHeight);
    element.style.height = `${measured}px`;
    setHeight(measured);
  }, [minimumHeight]);

  useLayoutEffect(() => { measureWeb(); }, [value, measureWeb]);

  return <TextInput {...props} ref={input} value={value} multiline scrollEnabled={false}
    onContentSizeChange={(event) => {
      if (Platform.OS !== "web") setHeight(campaignTextHeight(event.nativeEvent.contentSize.height + 2, minimumHeight));
      onContentSizeChange?.(event);
    }}
    onLayout={(event) => {
      if (lastWidth.current !== event.nativeEvent.layout.width) {
        lastWidth.current = event.nativeEvent.layout.width;
        measureWeb();
      }
      onLayout?.(event);
    }}
    style={[style, { height, minHeight: minimumHeight, textAlignVertical: "top" }]} />;
}
