/** Le logo de Codex : trois livres sur une étagère, dont un marqué d'une étoile. */
export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg
      className="logo-mark"
      width={size}
      height={size}
      viewBox="22 24 106 96"
      aria-hidden="true"
    >
      <rect x="34" y="40" width="22" height="72" rx="3" fill="#f7f3ea" />
      <rect x="34" y="52" width="22" height="3" fill="#0b2b29" opacity=".25" />
      <rect x="34" y="98" width="22" height="3" fill="#0b2b29" opacity=".25" />
      <rect x="60" y="30" width="24" height="82" rx="3" fill="#ecc267" />
      <path
        d="M72 58 l3.2 6.5 7.2 1 -5.2 5.1 1.2 7.1 -6.4-3.4 -6.4 3.4 1.2-7.1 -5.2-5.1 7.2-1z"
        fill="#0b2b29"
      />
      <rect x="95" y="46" width="20" height="68" rx="3" fill="#6cc4b8" transform="rotate(14 95 114)" />
      <rect x="26" y="112" width="98" height="5" rx="2.5" fill="#f7f3ea" opacity=".9" />
    </svg>
  );
}
