"use client";

import { cn } from "@/lib/utils/cn";
import { Clock, Lock, Crown } from "lucide-react";
import { Badge } from "@/components/ui";
import type { LessonType, SubscriptionPlan } from "@/types";
import { LESSON_TYPE_LABELS, LESSON_TYPE_DURATIONS } from "@/lib/utils/constants";

interface LessonTypeSelectorProps {
  value: LessonType;
  onChange: (value: LessonType) => void;
  subscriptionPlan: SubscriptionPlan;
  disabled?: boolean;
}

export function LessonTypeSelector({
  value,
  onChange,
  subscriptionPlan,
  disabled,
}: LessonTypeSelectorProps) {
  const canAccessMicro = subscriptionPlan === "premium";

  const lessonTypes: {
    type: LessonType;
    description: string;
    requiresPremium: boolean;
  }[] = [
    {
      type: "response_practice",
      description:
        "A full 30-minute session focusing on real-time response skills and pronunciation.",
      requiresPremium: false,
    },
    {
      type: "micro_response_practice",
      description:
        "A focused 15-minute session for quick practice and feedback.",
      requiresPremium: true,
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">
        Select Lesson Type
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {lessonTypes.map((lesson) => {
          const isLocked = lesson.requiresPremium && !canAccessMicro;
          const isSelected = value === lesson.type;

          return (
            <button
              key={lesson.type}
              type="button"
              disabled={disabled || isLocked}
              onClick={() => onChange(lesson.type)}
              className={cn(
                "relative flex flex-col rounded-lg border-2 p-4 text-left transition-all",
                isSelected
                  ? "border-zinc-900 bg-zinc-50 dark:border-zinc-50 dark:bg-zinc-900"
                  : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700",
                isLocked && "cursor-not-allowed opacity-60",
                disabled && "pointer-events-none opacity-50"
              )}
            >
              {/* Premium badge */}
              {lesson.requiresPremium && (
                <Badge
                  variant={canAccessMicro ? "success" : "secondary"}
                  className="absolute right-3 top-3"
                >
                  <Crown className="mr-1 h-3 w-3" />
                  Premium
                </Badge>
              )}

              {/* Lock icon for basic users */}
              {isLocked && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-zinc-100/80 dark:bg-zinc-900/80">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Lock className="h-6 w-6 text-foreground-muted" />
                    <span className="text-sm font-medium text-foreground-muted">
                      Upgrade to Premium
                    </span>
                  </div>
                </div>
              )}

              {/* Selection indicator */}
              <div
                className={cn(
                  "absolute left-3 top-3 h-5 w-5 rounded-full border-2",
                  isSelected
                    ? "border-zinc-900 bg-zinc-900 dark:border-zinc-50 dark:bg-zinc-50"
                    : "border-zinc-300 dark:border-zinc-700"
                )}
              >
                {isSelected && (
                  <svg
                    className="h-full w-full text-white dark:text-zinc-900"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>

              {/* Content */}
              <div className="mt-6">
                <h4 className="text-base font-semibold text-foreground">
                  {LESSON_TYPE_LABELS[lesson.type]}
                </h4>
                <div className="mt-1 flex items-center gap-1 text-sm text-foreground-muted">
                  <Clock className="h-4 w-4" />
                  {LESSON_TYPE_DURATIONS[lesson.type]} minutes
                </div>
                <p className="mt-2 text-sm text-foreground-muted">
                  {lesson.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
