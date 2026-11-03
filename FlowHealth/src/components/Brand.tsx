/** The Becky Boost logo: a white B with three stars on a dark green tile, plus the name. */
export function BrandMark({ size = 28 }: { size?: number }) {
  const spark = 'M0 -4l1 3 3 1-3 1-1 3-1-3-3-1 3-1Z'
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="brand-mark-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2b5c4d" />
          <stop offset="1" stopColor="#183e33" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#brand-mark-bg)" />
      <g transform="translate(14.5 16.5) scale(.62) translate(-16 -16)">
        <path
          fill="#fff"
          fillRule="evenodd"
          d="M9 6h7.6c3.4 0 5.7 2 5.7 4.9 0 1.8-1 3.2-2.5 3.9 2 .7 3.4 2.5 3.4 5 0 3.6-2.6 6.2-6.4 6.2H9Z M12.7 9.3v4.2h3.3c1.4 0 2.4-.8 2.4-2.1s-1-2.1-2.4-2.1Z M12.7 16.6v6.1h3.9c1.8 0 2.9-1.2 2.9-3.05 0-1.85-1.1-3.05-2.9-3.05Z"
        />
      </g>
      <path fill="#d3b27a" transform="translate(23.2 9.4) scale(.75)" d={spark} />
      <path fill="#ffffff" transform="translate(26.6 14.6) scale(.38)" d={spark} />
      <path fill="#9ac1b2" transform="translate(19.8 5.6) scale(.32)" d={spark} />
    </svg>
  )
}

export function Brand() {
  return (
    <div className="brand">
      <BrandMark />
      <span>Becky Boost</span>
    </div>
  )
}
