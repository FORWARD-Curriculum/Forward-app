import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDownIcon, ListTree, Menu } from "lucide-react";

import { cn } from "@/lib/utils";

function Accordion({
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      {...props}
      className=""
    />
  );
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b last:border-b-0 w-min flex flex-col", className)}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex w-min">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group focus-visible:border-ring focus-visible:ring-ring/50 items-start rounded-md \
          justify-between flex gap-2 data-[orientation=horizontal]:data-[state=closed]:gap-0 py-4 \
          text-left text-sm font-medium transition-all outline-none hover:underline \
          focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 \
          [&[data-state=open]>svg]:rotate-180",
          className,
        )}
        {...props}
      >

          <div className="
          overflow-hidden transition-[max-width] group-data-[state=open]:duration-400 group-data-[state=closed]:duration-400 shrink ease-in-out
          group-data-[orientation=horizontal]:group-data-[state=open]:max-w-[50vw]
          group-data-[orientation=horizontal]:max-w-0
          group-data-[orientation=horizontal]:min-w-0">
          {children}
          </div>

        <ChevronDownIcon className="text-muted-foreground pointer-events-none size-6 shrink-0 translate-y-0.5 transition-transform duration-200 lg:hidden" />
        <Menu className="text-muted-foreground pointer-events-none hidden size-6 shrink-0 translate-y-0.5 transition-transform duration-200 lg:block" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="shrink [&[data-state=open][data-orientation=horizontal]]:animate-slide-right  [&[data-state=closed][data-orientation=horizontal]]:animate-slide-left [&[data-state=open][data-orientation=vertical]]:animate-slide-down [&[data-state=closed][data-orientation=vertical]]:animate-slide-up overflow-hidden text-sm"
      {...props}
    >
      <div className={cn("pt-0 pb-4", className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
