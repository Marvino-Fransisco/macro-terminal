import { forwardRef } from "react";
import { NativeOptionProps } from "./type";

export const NativeOption = forwardRef<HTMLOptionElement, NativeOptionProps>(
  (props , ref) => {
    return (
      <option
        ref={ref}
        {...props}
      />
    )
});

NativeOption.displayName = "NativeOption";
