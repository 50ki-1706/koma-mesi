/**
 * 画面下からスライドインする汎用ボトムシートを提供する。
 * 背景タップ・Escキーで閉じられ、モーダルとしてフォーカスを内部に閉じ込める。
 */

"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * ボトムシートを表示する。
 *
 * @param props - 開閉状態、閉じる操作、タイトル、中身。
 * @returns 開いている場合はオーバーレイ付きのボトムシート。
 */
export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLElement | null>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    triggerElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    sheetRef.current?.focus();

    return () => {
      triggerElementRef.current?.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || sheetRef.current === null) {
        return;
      }

      const focusable = Array.from(
        sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (first === undefined || last === undefined) {
        event.preventDefault();
        return;
      }

      const isSheetItselfActive = document.activeElement === sheetRef.current;

      if (
        !event.shiftKey &&
        (isSheetItselfActive || document.activeElement === last)
      ) {
        event.preventDefault();
        first.focus();
      } else if (
        event.shiftKey &&
        (isSheetItselfActive || document.activeElement === first)
      ) {
        event.preventDefault();
        last.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid items-end">
      <button
        className="absolute inset-0 bg-ink/40 backdrop-blur-[1px]"
        type="button"
        aria-label="閉じる"
        onClick={onClose}
      />
      <section
        ref={sheetRef}
        className="relative max-h-[85dvh] overflow-y-auto rounded-t-[1.75rem] border-t border-line bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-24px_60px_oklch(0.45_0.08_70/0.16)] outline-none"
        aria-label={title === undefined ? "詳細" : undefined}
        aria-labelledby={title !== undefined ? "bottom-sheet-title" : undefined}
        aria-modal="true"
        role="dialog"
        tabIndex={-1}
      >
        <div
          className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line"
          aria-hidden="true"
        />
        {title !== undefined ? (
          <h2
            className="mb-3 text-base font-black tracking-tight text-ink"
            id="bottom-sheet-title"
          >
            {title}
          </h2>
        ) : null}
        {children}
      </section>
    </div>
  );
}
