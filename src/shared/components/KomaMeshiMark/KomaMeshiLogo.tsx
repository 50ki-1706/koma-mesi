/**
 * コマメシのロゴ全体（マークと「コマメシ」の文字を含む）を加工せずそのまま表示する。
 * ログイン画面など、ロゴ単体で名称も伝えたい場面で使用する。
 */

interface KomaMeshiLogoProps {
  className?: string;
}

/**
 * コマメシのロゴ（マーク＋文字）をSVGで描画する。
 *
 * @param props - SVG要素に適用するclassName。
 * @returns ロゴ全体のSVG要素。
 */
export function KomaMeshiLogo({ className }: KomaMeshiLogoProps) {
  return (
    <svg className={className} viewBox="0 0 1024 1024" aria-hidden="true">
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
      <g fill="#2B1F11">
        <path
          transform="translate(278.06 881.8993288590605) scale(0.12109 -0.12109)"
          d="M144 167V24C177 27 234 30 273 30H729L728 -22H873C871 8 869 61 869 96V614C869 643 871 683 872 706C855 705 813 704 784 704H280C246 704 194 706 157 710V571C185 573 239 575 281 575H730V161H269C224 161 179 164 144 167Z"
        />
        <path
          transform="translate(390.67 881.8993288590605) scale(0.12109 -0.12109)"
          d="M425 151C490 84 574 -9 616 -65L733 28C694 75 635 140 578 197C719 311 847 471 919 588C927 601 939 614 953 630L853 712C832 705 798 701 760 701C652 701 268 701 205 701C171 701 116 706 90 710V570C111 572 165 577 205 577C281 577 646 577 734 577C687 495 593 379 480 289C417 344 351 398 311 428L205 343C265 300 367 210 425 151Z"
        />
        <path
          transform="translate(503.28 881.8993288590605) scale(0.12109 -0.12109)"
          d="M293 638 208 536C310 474 406 403 477 346C379 227 261 130 98 51L210 -50C379 42 494 153 582 259C662 190 734 120 804 38L907 152C839 224 755 301 667 373C726 465 771 566 801 645C811 668 830 712 843 735L694 787C690 761 679 721 670 695C644 616 610 537 559 457C478 517 373 588 293 638Z"
        />
        <path
          transform="translate(615.89 881.8993288590605) scale(0.12109 -0.12109)"
          d="M309 792 236 682C302 645 406 577 462 538L537 649C484 685 375 756 309 792ZM123 82 198 -50C287 -34 430 16 532 74C696 168 837 295 930 433L853 569C773 426 634 289 464 194C355 134 235 101 123 82ZM155 564 82 453C149 418 253 350 310 311L383 423C332 459 222 528 155 564Z"
        />
      </g>
    </svg>
  );
}
