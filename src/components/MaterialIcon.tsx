type Props = {
  name: string;
  className?: string;
  filled?: boolean;
  size?: number;
  weight?: number;
};

export function MaterialIcon({ name, className = "", filled = false, size = 20, weight = 400 }: Props) {
  return (
    <span
      aria-hidden="true"
      className={`material-icon select-none ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: `"FILL" ${filled ? 1 : 0}, "wght" ${weight}, "GRAD" 0, "opsz" ${size}`,
      }}
    >
      {name}
    </span>
  );
}