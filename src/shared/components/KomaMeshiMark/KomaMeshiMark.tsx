/**
 * コマメシのブランドマーク（時計と大学の建物を組み合わせたロゴアイコン）を表示する。
 * ログイン画面や初期設定画面のバッジで共通して使用する。
 */

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
      <g fill="none" stroke="#E7990C" strokeWidth="68" strokeLinecap="butt">
        <path d="M585.09 208.92A250.0 250.0 0 1 1 275.62 529.39" />
        <path d="M275.62 366.61A250.0 250.0 0 0 1 438.91 208.92" />
      </g>
      <g fill="#2B1F11">
        <rect
          x="-8.50"
          y="-22.50"
          width="17"
          height="45"
          rx="3"
          transform="translate(512.00 275.50) rotate(0)"
        />
        <rect
          x="-4.50"
          y="-18.50"
          width="9"
          height="37"
          rx="4.5"
          transform="translate(597.25 300.34) rotate(30)"
        />
        <rect
          x="-4.50"
          y="-18.50"
          width="9"
          height="37"
          rx="4.5"
          transform="translate(659.66 362.75) rotate(60)"
        />
        <rect
          x="-8.50"
          y="-22.50"
          width="17"
          height="45"
          rx="3"
          transform="translate(684.50 448.00) rotate(90)"
        />
        <rect
          x="-4.50"
          y="-18.50"
          width="9"
          height="37"
          rx="4.5"
          transform="translate(659.66 533.25) rotate(120)"
        />
        <rect
          x="-4.50"
          y="-18.50"
          width="9"
          height="37"
          rx="4.5"
          transform="translate(597.25 595.66) rotate(150)"
        />
        <rect
          x="-8.50"
          y="-22.50"
          width="17"
          height="45"
          rx="3"
          transform="translate(512.00 620.50) rotate(180)"
        />
        <rect
          x="-4.50"
          y="-18.50"
          width="9"
          height="37"
          rx="4.5"
          transform="translate(426.75 595.66) rotate(210)"
        />
        <rect
          x="-4.50"
          y="-18.50"
          width="9"
          height="37"
          rx="4.5"
          transform="translate(364.34 533.25) rotate(240)"
        />
        <rect
          x="-8.00"
          y="-10.50"
          width="16"
          height="21"
          rx="3"
          transform="translate(357.50 448.00) rotate(270)"
        />
        <rect
          x="-4.50"
          y="-18.50"
          width="9"
          height="37"
          rx="4.5"
          transform="translate(364.34 362.75) rotate(300)"
        />
        <rect
          x="-4.50"
          y="-18.50"
          width="9"
          height="37"
          rx="4.5"
          transform="translate(426.75 300.34) rotate(330)"
        />
      </g>
      <g fill="#2B1F11">
        <path d="M447.5 160H576.5A64.5 61.5 0 0 1 447.5 160Z" />
        <path d="M485.0 196H539.0V227a5 5 0 0 1 -5 5H490.0a5 5 0 0 1 -5 -5Z" />
      </g>
      <g fill="#E7990C">
        <path d="M473.5 429H550.5A38.5 36.5 0 0 1 473.5 429Z" />
        <path d="M496.0 451H528.0V471a3 3 0 0 1 -3 3H499.0a3 3 0 0 1 -3 -3Z" />
      </g>
      <g fill="#2B1F11">
        <path d="M260.5 374 L288 396 V425 H233 V396Z" />
        <path d="M194 425H327V487a5 5 0 0 1 -5 5H272V470.5a11.5 11.5 0 0 0 -23 0V492H199a5 5 0 0 1 -5 -5Z" />
      </g>
      <g fill="#FFFFFF">
        <circle cx="260.5" cy="406.5" r="9" />
        <rect x="204.5" y="435.5" width="10" height="13" rx="1.5" />
        <rect x="204.5" y="462.5" width="10" height="13" rx="1.5" />
        <rect x="226.5" y="435.5" width="10" height="13" rx="1.5" />
        <rect x="226.5" y="462.5" width="10" height="13" rx="1.5" />
        <rect x="284.5" y="435.5" width="10" height="13" rx="1.5" />
        <rect x="284.5" y="462.5" width="10" height="13" rx="1.5" />
        <rect x="306.5" y="435.5" width="10" height="13" rx="1.5" />
        <rect x="306.5" y="462.5" width="10" height="13" rx="1.5" />
      </g>
    </svg>
  );
}
