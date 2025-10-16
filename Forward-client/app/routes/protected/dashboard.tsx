import { type ReactNode, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Expand, FileVolume } from "lucide-react";
import Pie from "@/components/ui/cprogress";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store";
import type { User } from "@/features/account/types";
import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/dashboard";
import { apiFetch } from "@/utils/utils";
import type { Lesson } from "@/features/curriculum/types";
import MarkdownTTS from "@/components/ui/markdown-tts";
import { setUser } from "@/features/account/slices/userSlice";
import { Button } from "@/components/ui/button";

export async function clientLoader({}: Route.ClientLoaderArgs) {
  const response = await apiFetch("/lessons", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (response.ok) {
    const json = await response.json();
    return json.data as Array<any>;
  }
}

function LessonCard(props: { lesson?: Lesson; children?: ReactNode }) {
  return (
    <div className="bg-background rounded-2xl pt-3">
      <div className="mx-4 flex items-center gap-4 pb-3">
        <img
          src={props.lesson?.image || "grad_cap.png"}
          className="h-full max-w-20"
        ></img>
        <MarkdownTTS className="flex grow" controlsClassName="flex flex-row-reverse grow justify-between">
          <div className="flex flex-col text-left">
            <Link
              prefetch="intent"
              to={"/lesson/" + props.lesson?.id}
              className="text-accent text-xl underline"
            >
              {props.lesson?.title}
            </Link>
            <p className="text-secondary-foreground text-base ">
              {props.lesson?.description}
            </p>
          </div>
        </MarkdownTTS>
      </div>
      {props.children}
    </div>
  );
}

function Accordion(props: { children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="text-secondary-foreground flex flex-col">
      <div
        className={`overflow-hidden transition-all duration-400 ease-in-out ${
          open ? "max-h-screen pb-4" : "max-h-0 pb-0"
        } px-4`}
      >
        <div>{props.children}</div>
      </div>

      <div className="bg-muted/50 border-muted flex items-center justify-end rounded-b-2xl border-t-1 px-4 py-0.5">
        <button
          aria-label="View lesson overview"
          className="flex items-center gap-1.5 text-sm"
          onClick={() => setOpen(!open)}
        >
          More Info {open ? <ChevronUp /> : <ChevronDown />}
        </button>
      </div>
    </div>
  );
}

export function meta() {
  return [{ title: "Dashboard | FORWARD" }];
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const [sortType, setSortType] = useState<"name" | "order" | "progress">(
    "progress",
  );
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch({ type: "curriculum/setCurriculum", payload: loaderData });
  }, [loaderData, dispatch]);

  const lessons = useSelector((state: RootState) => state.curriculum.lessons);
  const user = useSelector((state: RootState) => state.user.user) as User;
  const navigate = useNavigate();

  /* TODO: grab from api instead of hardcoding*/

  return (
    <>
      <div className="mx-4 my-12 lg:mx-[15vw]">
        <div className="text-secondary-foreground mb-4 flex w-full gap-3 text-sm">
          <p>Sort By:</p>
          <button
            aria-label="Sort by progress"
            className={`${sortType == "progress" ? "bg-muted" : "bg-secondary"} outline-foreground-border rounded-md px-8 text-center outline-1 drop-shadow-xs`}
            onClick={() => {
              setSortType("progress");
            }}
          >
            Progress
          </button>
          <button
            aria-label="Sort by name"
            className={`${sortType == "name" ? "bg-muted" : "bg-secondary"} outline-foreground-border rounded-md px-8 text-center outline-1 drop-shadow-xs`}
            onClick={() => {
              setSortType("name");
            }}
          >
            Name
          </button>
          <button
            aria-label="Sort by order"
            className={`${sortType == "order" ? "bg-muted" : "bg-secondary"} outline-foreground-border rounded-md px-8 text-center outline-1 drop-shadow-xs`}
            onClick={() => {
              setSortType("order");
            }}
          >
            Order
          </button>
        </div>
        <div className="flex flex-col-reverse gap-8 lg:grid lg:grid-cols-12 lg:gap-0">
          <div className="col-span-8">
            <div className="bg-foreground outline-foreground-border flex flex-col gap-2 rounded-3xl p-4 outline-1 lg:mr-4">
              <h1 className="text-secondary-foreground text-left text-3xl font-medium">
                Lessons
              </h1>

              {!lessons ? (
                <p>Loading...</p>
              ) : (
                [...lessons]
                  .sort((a, b) => {
                    switch (sortType) {
                      case "order":
                        return a.order - b.order;
                      case "name":
                        return a.title.localeCompare(b.title);
                      case "progress":
                        return (b.completion || 0) - (a.completion || 0);
                    }
                  })
                  .map((e) => (
                    <LessonCard key={e.id} lesson={e}>
                      <Accordion>
                        {e.objectives.length > 0 && (
                          <p className="ml-4 mb-4">
                            <span className="font-medium">
                              Lesson Objectives:
                            </span>{" "}
                            <ul>
                              {e.objectives.map((o) => (
                                <li className="ml-10 list-disc font-light">{o}</li>
                              ))}
                            </ul>
                          </p>
                        )}
                        {e.tags && (
                          <div className="flex gap-2 ml-4 italic">
                            Tags: {e.tags.map((t) => (
                              <p
                                className={`bg-secondary outline-foreground-border rounded-md px-2 text-center outline-1 drop-shadow-xs`}
                              >
                                {t}
                              </p>
                            ))}
                          </div>
                        )}
                      </Accordion>
                    </LessonCard>
                  ))
              )}
            </div>
          </div>
          <div className="col-span-4 flex flex-col gap-4">
            <div className="bg-foreground outline-foreground-border flex h-fit w-full items-center gap-3 rounded-3xl p-4 outline-1">
              <div
                className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-full ${
                  user.profile_picture
                    ? ""
                    : "border-secondary-foreground border-1 border-solid"
                }`}
              >
                {user.profile_picture ? (
                  <img src={user.profile_picture} className="object-cover" />
                ) : (
                  <p className="text-secondary-foreground text-2xl font-light">
                    {(user.display_name || "   ").substring(0, 2).toUpperCase()}
                  </p>
                )}
              </div>
              <div className="text-left">
                <h3 className="text-secondary-foreground text-lg">
                  {user.display_name}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {user?.username}
                </p>
              </div>
              <Link
                prefetch="intent"
                className="text-secondary-foreground ml-auto"
                to="/account"
              >
                Edit
              </Link>
            </div>
            {lessons?.some((e) => e.completion != 0) && (
              <div className="text-secondary-foreground bg-foreground outline-foreground-border col-start-2 col-end-2 rounded-3xl p-4 outline-1">
                <p className="text-left font-medium">Your Progress</p>
                {!lessons ? (
                  <p>Loading...</p>
                ) : (
                  [...lessons]
                    .sort((a, b) => {
                      switch (sortType) {
                        case "order":
                          return a.order - b.order;
                        case "name":
                          return a.title.localeCompare(b.title);
                        case "progress":
                          return (b.completion || 0) - (a.completion || 0);
                      }
                    })
                    .map((e) => {
                      if (e.completion != 0)
                        return (
                          <div className="flex items-center" key={e.id}>
                            <Pie
                              size={120}
                              percentage={e.completion * 100}
                              color=""
                            />
                            <Link
                              prefetch="intent"
                              to={"/lesson/" + e.id}
                              className="text-base underline"
                            >
                              {e.title}
                            </Link>
                          </div>
                        );
                    })
                )}
              </div>
            )}
            {user?.consent && (
              <div className="text-secondary-foreground bg-foreground outline-foreground-border col-start-2 col-end-2 rounded-3xl p-4 outline-1">
                <p className="mb-2 text-left font-medium">
                  FORWARD Readiness Survey
                </p>
                <Link
                  to="/survey"
                  className="bg-primary text-primary-foreground outline-primary-border ml-auto flex w-full justify-center rounded-xl p-2 outline-1"
                >
                  Re-Take
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
