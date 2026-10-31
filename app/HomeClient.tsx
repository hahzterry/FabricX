function deriveZodiacSigns(
  title: string,
  tags: string[] = [],
  description: string = ""
): ZodiacSign[] {
  const normalize = (value: string) =>
    value
      .replace(/<[^>]*>/g, " ")
      .replace(/&[a-z]+;/gi, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[_-]/g, " ")
      .toLowerCase()
      .trim();

  const searchableText = normalize(
    [
      title,
      description,
      ...tags.map(String),
    ].join(" ")
  );

  const aliases: Record<ZodiacSign, string[]> = {
    Aries: ["aries", "the ram"],
    Taurus: ["taurus", "the bull"],
    Gemini: ["gemini", "the twins"],
    Cancer: ["cancer", "the crab"],
    Leo: ["leo", "the lion"],
    Virgo: ["virgo", "the maiden"],
    Libra: ["libra", "the scales"],
    Scorpio: ["scorpio", "the scorpion"],
    Sagittarius: ["sagittarius", "the archer"],
    Capricorn: ["capricorn", "the sea goat"],
    Aquarius: ["aquarius", "the water bearer"],
    Pisces: ["pisces", "the fish"],
  };

  return zodiacSigns.filter((sign) =>
    aliases[sign].some((alias) => {
      const escaped = alias.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      return new RegExp(
        `\\b${escaped}\\b`,
        "i"
      ).test(searchableText);
    })
  );
}
