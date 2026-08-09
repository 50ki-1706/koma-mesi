/**
 * コマメシのブランドマーク（時計と大学の建物を組み合わせたロゴアイコン）を表示する。
 * ログイン画面や初期設定画面のバッジで共通して使用する。
 */

import { KomaMeshiMarkArtwork } from "@/shared/components/KomaMeshiMark/KomaMeshiMarkArtwork";

interface KomaMeshiMarkProps {
  className?: string;
}

/**
 * コマメシのロゴマークをSVGで描画する。
 *
 * @param props - SVG要素に適用するclassName。
 * @returns ロゴマークのSVG要素。
 */
export function KomaMeshiMark({ className }: KomaMeshiMarkProps) {
  return (
    <svg className={className} viewBox="140 50 720 720" aria-hidden="true">
      <KomaMeshiMarkArtwork />
    </svg>
  );
}
