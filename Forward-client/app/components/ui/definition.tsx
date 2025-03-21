import * as Popover  from "./popover";
import { useSelector } from "react-redux";
import { type RootState } from "@/store";

export interface DefinitionProps extends React.HTMLAttributes<HTMLElement> {
    def?: string;
    node?: any; // or use the Element type from 'hast' if you need it
  }
  
  
  export const Def: React.FC<DefinitionProps> = ({ def, children }) => {
    const user = useSelector((state: RootState) => state.user.user);
    return (
      <Popover.Popover >
        <Popover.PopoverTrigger className="underline text-accent">
            {children}
        </Popover.PopoverTrigger>
        <Popover.PopoverContent className={`${
                user?.preferences?.theme || ""
              } ${user?.preferences?.text_size || ""} bg-secondary text-secondary-foreground text-base`}>
            {def}
        </Popover.PopoverContent>
      </Popover.Popover>
    );
  };