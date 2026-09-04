export default function MenuBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden print:hidden"
      aria-hidden
      style={{
        background:
          "radial-gradient(ellipse 92% 70% at 50% 36%, #F9F7F2 0%, #F4F0E4 68%, #EFE8D6 100%)",
      }}
    >
      <svg
        viewBox="0 0 1000 500"
        fill="none"
        className="absolute top-[47%] left-1/2 w-[min(118vw,860px)] -translate-x-1/2 -translate-y-1/2 opacity-[0.14]"
      >
        <g
          stroke="#C5A059"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M206 252C152 198 88 138 78 88c58 48 92 104 128 164C152 306 82 372 90 418c58-52 88-108 116-166Z" />
          <path d="M206 252c48-82 196-128 372-112 138 12 248 62 318 112-70 50-180 100-318 112C402 380 254 334 206 252Z" />
          <path d="M392 148c52-68 188-78 268 2" />
          <path d="M468 348c28 62 128 78 198 8" />
          <path d="M792 202c-28 28-30 68 0 98" />
          <path d="M468 208c18 28 18 58 0 86M538 192c24 34 24 72 0 108M608 186c26 38 26 80 0 118" />
          <path d="M868 268c22 10 38 28 32 52" />
        </g>
        <circle cx="838" cy="228" r="5.5" fill="#9B2B2B" className="opacity-70" />
      </svg>
    </div>
  );
}
