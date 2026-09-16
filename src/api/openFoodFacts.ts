import type { OpenFoodFactsProduct } from '../types/food';

export class ProductNotFoundError extends Error {
  constructor(barcode: string) {
    super(`Geen product gevonden voor barcode ${barcode}`);
    this.name = 'ProductNotFoundError';
  }
}

export async function lookupProductByBarcode(
  barcode: string
): Promise<OpenFoodFactsProduct> {
  const response = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
  );

  if (!response.ok) {
    throw new Error(`Open Food Facts request failed: ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== 1 || !data.product) {
    throw new ProductNotFoundError(barcode);
  }

  const nutriments = data.product.nutriments ?? {};

  return {
    barcode,
    name: data.product.product_name || 'Onbekend product',
    caloriesPer100g: Math.round(nutriments['energy-kcal_100g'] ?? 0),
    proteinPer100g: Math.round(nutriments['proteins_100g'] ?? 0),
    carbsPer100g: Math.round(nutriments['carbohydrates_100g'] ?? 0),
    fatPer100g: Math.round(nutriments['fat_100g'] ?? 0),
  };
}
