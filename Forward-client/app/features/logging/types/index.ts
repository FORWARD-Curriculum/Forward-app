import type { RootState } from "@/store";
import type { initialState, loggingSlice } from "../slices/loggingSlice";
import type { Location } from "react-router";

export interface BugReport {
    description: string;
    steps_to_reproduce: string;
    recent_window_locations: Location;
    app_state: Omit<RootState, 'lesson'>;
    device_info: string;
    app_version: string;
}