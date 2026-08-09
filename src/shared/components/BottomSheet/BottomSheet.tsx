/**
 * 画面下に常駐し、タップまたは上下スワイプで開閉できるボトムシートを提供する。
 * 開いた状態では背景タップ・Escキーでも閉じられ、フォーカスを内部に閉じ込める。
 */

"use client";

import type { PointerEvent, ReactNode } from "react";
import { useEffect, useRef } from "react";
import { SWIPE_THRESHOLD_PX } from "@/constants/gestures";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
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
  onOpen,
  onClose,
  title,
  children,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLElement | null>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);
  const startYRef = useRef<number | null>(null);

  /**
   * シート上のスワイプ開始位置を記録する。
   *
   * @param event - ポインター押下イベント。
   * @returns なし。
   */
  const handlePointerDown = (event: PointerEvent<HTMLElement>): void => {
    startYRef.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  /**
   * 上方向のスワイプで開き、下方向のスワイプで閉じる。
   *
   * @param event - ポインター解放イベント。
   * @returns なし。
   */
  const handlePointerUp = (event: PointerEvent<HTMLElement>): void => {
    const startY = startYRef.current;
    startYRef.current = null;
    if (startY === null) {
      return;
    }

    const deltaY = event.clientY - startY;
    if (deltaY <= -SWIPE_THRESHOLD_PX) {
      onOpen();
    } else if (deltaY >= SWIPE_THRESHOLD_PX) {
      onClose();
    }
  };

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

  return (
    <div className="pointer-events-none fixed inset-0 z-50 grid items-end">
      {isOpen ? (
        <button
          className="pointer-events-auto absolute inset-0 bg-ink/40 backdrop-blur-[1px]"
          type="button"
          aria-label="閉じる"
          onClick={onClose}
        />
      ) : null}
      <section
        ref={sheetRef}
        className={`pointer-events-auto relative max-h-[85dvh] min-h-28 overflow-y-auto rounded-t-[1.75rem] border-t border-line bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-bottom-sheet outline-none transition-transform duration-300 ease-out lg:mx-auto lg:w-[min(36rem,calc(100%-3rem))] lg:rounded-t-[1.75rem] lg:border-x ${
          isOpen ? "translate-y-0" : "translate-y-[calc(100%-7rem)]"
        }`}
        aria-label={title === undefined ? "詳細" : undefined}
        aria-labelledby={title !== undefined ? "bottom-sheet-title" : undefined}
        aria-modal={isOpen ? "true" : undefined}
        role="dialog"
        tabIndex={-1}
      >
        <button
          className="-mx-5 -mt-5 mb-3 flex h-24 w-[calc(100%+2.5rem)] touch-none flex-col items-center justify-start rounded-t-[1.75rem] pt-3 text-ink focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-focus"
          type="button"
          aria-label={isOpen ? "店舗詳細を閉じる" : "店舗詳細を開く"}
          onClick={isOpen ? onClose : onOpen}
          onPointerCancel={() => {
            startYRef.current = null;
          }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          <span className="mb-4 h-1.5 w-10 rounded-full bg-line" />
          {title !== undefined ? (
            <span
              className="px-5 text-center text-base font-black tracking-tight"
              id="bottom-sheet-title"
            >
              {title}
            </span>
          ) : null}
        </button>
        <div aria-hidden={!isOpen} inert={!isOpen}>
          {children}
        </div>
      </section>
    </div>
  );
}
