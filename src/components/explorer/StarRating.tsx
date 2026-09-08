import { Star } from "lucide-react";

export function StarRating({
  stars,
  size = 12,
}: {
  stars: number;
  size?: number;
}) {
  return (
    <span className="inline-flex items-center gap-px" aria-label={`${stars} star rating`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={
            i <= stars
              ? "fill-amber text-amber"
              : "fill-transparent text-edge2"
          }
        />
      ))}
    </span>
  );
}