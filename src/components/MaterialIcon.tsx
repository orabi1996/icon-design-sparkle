type Props = {
  name: string;
  className?: string | undefined;
  filled?: boolean | undefined;
  size?: number | undefined;
  weight?: number | undefined;
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