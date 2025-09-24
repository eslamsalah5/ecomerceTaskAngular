// Image placeholders and helpers
export const NO_IMAGE_PLACEHOLDER = '/assets/images/no-image.svg';

export const CATEGORY_PLACEHOLDERS: { [key: string]: string } = {
  Electronics: '/assets/images/electronics-placeholder.svg',
  Clothing: '/assets/images/clothing-placeholder.svg',
  Clothes: '/assets/images/clothing-placeholder.svg',
  Home: NO_IMAGE_PLACEHOLDER,
  'Home & Garden': NO_IMAGE_PLACEHOLDER,
  Books: NO_IMAGE_PLACEHOLDER,
  Sports: NO_IMAGE_PLACEHOLDER,
  Beauty: NO_IMAGE_PLACEHOLDER,
  Toys: NO_IMAGE_PLACEHOLDER,
  Food: NO_IMAGE_PLACEHOLDER,
  Accessories: NO_IMAGE_PLACEHOLDER,
  Other: NO_IMAGE_PLACEHOLDER,
};

export function getPlaceholderImage(category?: string): string {
  if (!category) return NO_IMAGE_PLACEHOLDER;

  const normalizedCategory = category.trim();
  return CATEGORY_PLACEHOLDERS[normalizedCategory] || NO_IMAGE_PLACEHOLDER;
}

export function getSafeImageUrl(
  imageUrl?: string | null,
  category?: string
): string {
  if (!imageUrl || imageUrl.trim().length === 0) {
    return getPlaceholderImage(category);
  }
  return imageUrl;
}
