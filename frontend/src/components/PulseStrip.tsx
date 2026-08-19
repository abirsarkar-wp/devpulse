interface PulseStripProps {
  openCount: number;
}

export function PulseStrip({ openCount }: PulseStripProps) {
  const active = openCount > 0;

  const speed = active
    ? Math.max(1.2, 3 - openCount * 0.3)
    : 6;

  const color = active ? '#D14C3F' : '#3F8F6F';

  const beatPath = active
    ? '0,16 40,16 50,4 60,28 70,16 120,16 160,16 170,6 180,26 190,16 240,16 280,16 290,4 300,28 310,16 400,16'
    : '0,16 400,16';

  return (
    <div className="relative h-8 overflow-hidden bg-ink border-b border-black/30">
      <div
        className="absolute inset-y-0 flex"
        style={{
          width: '200%',
          animation: `pulse-scroll ${speed}s linear infinite`,
        }}
      >
        {[0, 1].map((i) => (
          <svg
            key={i}
            width="50%"
            height="32"
            viewBox="0 0 400 32"
            preserveAspectRatio="none"
            className="shrink-0"
          >
            <polyline
              points={beatPath}
              fill="none"
              stroke={color}
              strokeWidth="2"
            />
          </svg>
        ))}
      </div>

      <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
        <span className="font-mono text-[10px] tracking-widest text-white/40 uppercase">
          System pulse
        </span>

        <span
          className="font-mono text-[10px] tracking-widest font-medium"
          style={{ color }}
        >
          {active ? `${openCount} OPEN` : 'ALL CLEAR'}
        </span>
      </div>
    </div>
  );
}