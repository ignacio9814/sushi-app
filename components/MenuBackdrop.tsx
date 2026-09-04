export default function MenuBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#F6F3EA]" aria-hidden>
      <svg
        viewBox="0 0 800 400"
        className="absolute top-[44%] left-1/2 w-[min(92vw,720px)] -translate-x-1/2 -translate-y-1/2 opacity-[0.055]"
      >
        <path
          fill="#C5A059"
          d="M118 206c22-54 14-108-32-148 64 18 104 70 112 128 48-72 150-112 252-92 82 16 144 64 168 124 44-24 108-18 164 28-42-8-76 14-90 48 58 10 112 38 146 86-52-24-110-20-156 12 26 36 32 80 12 124-36-40-90-56-152-48 12 54-14 102-66 132 12-52-16-100-72-122-34 46-98 66-168 52 38-28 54-72 40-120-66 12-122-12-158-64 44 6 82-12 110-48-50 0-94-20-114-60z"
        />
        <circle cx="596" cy="168" r="7" fill="#9B2B2B" />
      </svg>
    </div>
  );
}
