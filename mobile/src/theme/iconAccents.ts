// SEYVEO · soft icon accents for Black Velvet HDR.
// Restrained colors: icons remain outlined, with no bright tile backgrounds.
export const iconAccents={
 messages:'#8FE3C3',
 chat:'#8FE3C3',
 family:'#E8B8C7',
 care:'#E8B8C7',
 health:'#E8B8C7',
 documents:'#B8D4E8',
 tasks:'#B8D4E8',
 finance:'#E7D2A2',
 music:'#CBBFE9',
 assistant:'#A5F2CF',
 home:'#C2DED1',
 security:'#BCCCDC'
} as const;
export type AccentCategory=keyof typeof iconAccents;
export function accentFor(category:AccentCategory){return iconAccents[category]}
