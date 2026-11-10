type Props = { name: string; color: string; className?: string };

/** Заглушка вместо фото: цвет товара и монограмма. Заменится на next/image, когда появятся фотографии. */
export function ProductImage({ name, color, className = "" }: Props) {
  const initials = name
    .replace(/[«»"]/g, "")
    .split(/\s+/)
    .filter((w) => /^[A-ZА-ЯЁ]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  return (
    <div
      role="img"
      aria-label={name}
      className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-lg ${className}`}
      style={{ background: `linear-gradient(145deg, ${color}, color-mix(in srgb, ${color} 60%, black))` }}
    >
      <span className="font-serif text-6xl text-white/85">{initials}</span>
      <span className="absolute bottom-3 left-3 rounded bg-black/30 px-2 py-0.5 text-[0.7rem] tracking-wide text-white/80 uppercase">
        демо
      </span>
    </div>
  );
}
