import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { X } from "lucide-react";
import {
  lineSegments,
  nearestPoint,
  valueDomain,
  type ChartPoint,
  type ChartSeries,
} from "../../lib/chart-data";

type Props = {
  points: ChartPoint[];
  series: ChartSeries[];
  label: string;
  height?: number;
  table?: boolean;
  empty?: string;
};
const number = (value: number, unit: string) =>
  `${value.toLocaleString(undefined, { maximumFractionDigits: unit === "sessions" ? 0 : 1 })}${unit ? ` ${unit}` : ""}`;
export function InteractiveChart({
  points,
  series,
  label,
  height = 210,
  table = false,
  empty = "No measurements in this period.",
}: Props) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 400, height });
  const [active, setActive] = useState<number | null>(null);
  const [pinned, setPinned] = useState(false);
  const hasValues = points.some((point) => series.some((s) => point.values[s.key] != null));
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => setSize({ width: element.clientWidth, height: element.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasValues]);
  if (!hasValues)
    return (
      <div className="chart-empty">
        <p>{empty}</p>
      </div>
    );
  const { width, height: plotHeight } = size;
  const left = 46,
    right = 12,
    top = 20,
    bottom = 30;
  const plotWidth = Math.max(1, width - left - right),
    plotAreaHeight = Math.max(1, plotHeight - top - bottom);
  const [low, high] = valueDomain(points, series);
  const start = points[0]!.x,
    end = points.at(-1)!.x;
  const bars = series.some((s) => s.kind === "bar");
  const pointIndices = new Map(points.map((point, i) => [point, i]));
  const px = (point: ChartPoint, index: number) =>
    bars
      ? left + (plotWidth * (index + 0.5)) / points.length
      : left + (end === start ? 0.5 : (point.x - start) / (end - start)) * plotWidth;
  const py = (value: number) => top + ((high - value) / (high - low)) * plotAreaHeight;
  const index = active == null ? null : Math.min(active, points.length - 1);
  const selected = index == null ? undefined : points[index];
  const selectedX = selected && index != null ? px(selected, index) : 0;
  const yTicks = bars
    ? [...new Set([0, Math.ceil(high / 2), high])]
    : [low, (low + high) / 2, high];
  const tickIndices = [
    ...new Set(
      width > 340
        ? [0, Math.floor((points.length - 1) / 2), points.length - 1]
        : [0, points.length - 1],
    ),
  ];
  const inspect = (event: PointerEvent<HTMLDivElement>) => {
    if (pinned && event.type === "pointermove" && event.pointerType === "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const proportion = Math.max(0, Math.min(1, (event.clientX - bounds.left - left) / plotWidth));
    setActive(
      bars
        ? Math.min(points.length - 1, Math.floor(proportion * points.length))
        : nearestPoint(points, start + proportion * (end - start)),
    );
  };
  const keyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = index ?? points.length - 1;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      setActive(
        Math.max(0, Math.min(points.length - 1, current + (event.key === "ArrowLeft" ? -1 : 1))),
      );
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setActive(event.key === "Home" ? 0 : points.length - 1);
    } else if (event.key === "Escape") {
      setActive(null);
      setPinned(false);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setPinned(!pinned);
    }
  };
  const selectedText = selected
    ? `${selected.label}. ${series.map((s) => `${s.label}: ${selected.values[s.key] == null ? "Not recorded" : number(selected.values[s.key]!, s.unit)}`).join(". ")}`
    : "No date selected";
  return (
    <div
      className="interactive-chart"
      style={{ "--chart-height": `${height}px` } as React.CSSProperties}
    >
      <p id={`${id}-help`} className="sr-only">
        {label}. Hover or touch to inspect a date. Use Left and Right arrows, Home and End to
        inspect with the keyboard; Escape clears selection.
      </p>
      <div
        ref={ref}
        className="chart-plot"
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-describedby={`${id}-help`}
        aria-valuemin={0}
        aria-valuemax={points.length - 1}
        aria-valuenow={index ?? points.length - 1}
        aria-valuetext={selected ? selectedText : points.at(-1)!.label}
        onPointerMove={inspect}
        onPointerDown={(event) => {
          inspect(event);
          setPinned(event.pointerType !== "mouse" || !pinned);
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse" && !pinned) setActive(null);
        }}
        onFocus={(event) => {
          if (active == null && event.currentTarget.matches(":focus-visible"))
            setActive(points.length - 1);
        }}
        onBlur={() => {
          if (!pinned) setActive(null);
        }}
        onKeyDown={keyboard}
      >
        <svg viewBox={`0 0 ${width} ${plotHeight}`} aria-hidden="true" className="data-chart">
          {yTicks.map((value, i) => (
            <g key={i}>
              <line
                x1={left}
                x2={width - right}
                y1={py(value)}
                y2={py(value)}
                className="chart-gridline"
              />
              <text x={left - 9} y={py(value) + 4} textAnchor="end">
                {value.toLocaleString(undefined, { maximumFractionDigits: bars ? 0 : 1 })}
              </text>
            </g>
          ))}
          {series.map((s) => (
            <g
              key={s.key}
              className={`${s.secondary ? "series-secondary" : "series-primary"} series-${s.kind}`}
            >
              {s.kind === "bar" &&
                points.map((point, i) =>
                  point.values[s.key] == null ? null : (
                    <rect
                      key={point.x}
                      x={px(point, i) - Math.min(34, (plotWidth / points.length) * 0.5) / 2}
                      y={py(point.values[s.key]!)}
                      width={Math.min(34, (plotWidth / points.length) * 0.5)}
                      height={Math.max(0, py(0) - py(point.values[s.key]!))}
                      rx={3}
                      className={i === index ? "chart-bar is-inspected" : "chart-bar"}
                    />
                  ),
                )}
              {s.kind === "line" &&
                lineSegments(points, s.key).map((segment, i) =>
                  segment.length === 1 ? (
                    <circle
                      key={i}
                      cx={px(segment[0]!, pointIndices.get(segment[0]!)!)}
                      cy={py(segment[0]!.values[s.key]!)}
                      r={3}
                      className="chart-mark"
                    />
                  ) : (
                    <polyline
                      key={i}
                      points={segment
                        .map(
                          (point) =>
                            `${px(point, pointIndices.get(point)!)},${py(point.values[s.key]!)}`,
                        )
                        .join(" ")}
                      className="chart-line"
                    />
                  ),
                )}
              {s.kind === "point" &&
                points.map((point, i) =>
                  point.values[s.key] == null ? null : (
                    <circle
                      key={point.x}
                      cx={px(point, i)}
                      cy={py(point.values[s.key]!)}
                      r={2.75}
                      className="chart-observation"
                    />
                  ),
                )}
            </g>
          ))}
          {tickIndices.map((i, tick) => (
            <text
              key={i}
              x={px(points[i]!, i)}
              y={plotHeight - 7}
              textAnchor={tick === 0 ? "start" : tick === tickIndices.length - 1 ? "end" : "middle"}
            >
              {new Date(points[i]!.x).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </text>
          ))}
          {selected && index != null && (
            <g>
              <line
                x1={selectedX}
                x2={selectedX}
                y1={top - 4}
                y2={plotHeight - bottom}
                className="chart-guide"
              />
              {series
                .filter((s) => s.kind !== "bar" && selected.values[s.key] != null)
                .map((s) => (
                  <circle
                    key={s.key}
                    cx={selectedX}
                    cy={py(selected.values[s.key]!)}
                    r={4.5}
                    className={`chart-selected ${s.kind === "point" ? "observation" : ""}`}
                  />
                ))}
            </g>
          )}
        </svg>
        {selected && (
          <div
            className="chart-tooltip"
            role="tooltip"
            style={{ left: Math.max(8, Math.min(width - 228, selectedX + 12)) }}
          >
            <strong>{selected.label}</strong>
            {series.map((s) => (
              <div className="chart-tooltip-row" key={s.key}>
                <span>
                  <i className={`legend-swatch ${s.kind === "point" ? "dot" : ""}`} />
                  {s.label}
                </span>
                <b>
                  {selected.values[s.key] == null ? "—" : number(selected.values[s.key]!, s.unit)}
                </b>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="chart-legend">
        {series.map((s) => (
          <span key={s.key}>
            <i className={`legend-swatch ${s.kind === "point" ? "dot" : ""}`} />
            {s.label}
            {s.unit !== "sessions" && ` (${s.unit})`}
          </span>
        ))}
        {pinned && (
          <button
            type="button"
            className="clear-chart"
            aria-label="Clear chart selection"
            onClick={() => {
              setActive(null);
              setPinned(false);
            }}
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>
      {table && (
        <details className="chart-data-table">
          <summary>View data table</summary>
          <div className="table-scroll">
            <table>
              <caption className="sr-only">{label}</caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  {series.map((s) => (
                    <th key={s.key} scope="col">
                      {s.label} ({s.unit})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {points.map((point) => (
                  <tr key={point.x}>
                    <th scope="row">{point.label}</th>
                    {series.map((s) => (
                      <td key={s.key}>
                        {point.values[s.key] == null
                          ? "Not recorded"
                          : number(point.values[s.key]!, s.unit)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
