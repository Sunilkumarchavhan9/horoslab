import React from "react";
import { Button as ShadcnButton } from "@/components/ui/button";

export function Button(props: React.ComponentProps<typeof ShadcnButton>) {
 return <ShadcnButton {...props} />;
}
