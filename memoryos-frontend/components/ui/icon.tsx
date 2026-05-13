import type { SVGProps } from "react";

export type IconName =
  | "memory"
  | "agent"
  | "graph"
  | "handoff"
  | "vault"
  | "timeline"
  | "search"
  | "settings"
  | "send"
  | "mic"
  | "dither"
  | "terminal"
  | "radar"
  | "play"
  | "pause"
  | "replay"
  | "warning"
  | "success";

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
  title?: string;
};

export function Icon({ name, title, className, ...props }: IconProps) {
  const ariaHidden = title ? undefined : true;

  return (
    <svg
      className={className}
      aria-hidden={ariaHidden}
      role={title ? "img" : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <use href={`/icons.svg#${name}`} />
    </svg>
  );
}
