import { apiClient } from '../client.js';
import { API_ENDPOINTS } from '../config.js';

class ItemData {
  constructor(data) {
    this.name = data.name;
    this.description_html = data.description;
    this.product_type = data.product_type
    this.variations = (data.variations || []).map((variation) => new SquareItemVariation(variation).build());
  }

  build() {
    return {
      name: this.name,
      description_html: this.description_html,
      product_type: this.product_type,
      variations: this.variations,
    }
  }
}

class SquareItemVariationDataPrice {
  constructor(data) {
    this.amount = data.amount;
    this.currency = data.currency;
  }

  build() {
    return {
      amount: this.amount,
      currency: this.currency,
    }
  }
}

class SquareItemVariationData {
  constructor(data) {
    this.name = data.name;
    this.price_money = new SquareItemVariationDataPrice(data.price_money).build();
  }

  build() {
    return {
      name: this.name,
      price_money: this.price_money,
    }
  }
}

class SquareItemVariation {
  constructor(data) {
    console.log("data:", data);
    this.id = '#variation';
    this.type = data.type;
    this.item_variation_data = new SquareItemVariationData(data.item_variation_data).build();
    // this.item_variation_data = data.item_variation_data 
  }

  build() {
    return {
      id: this.id,
      type: this.type,
      item_variation_data: this.item_variation_data,
    }
  }
}

class SquareCatalogItem {
  constructor(data) {
    if (!data.type) {
      throw new Error("Data object must include 'id' and 'type'.");
    }

    // per docs, when a new CatalogObject is inserted, 
    // the client should set the id to a temporary identifier starting with a "#" character.
    this.id = '#item'; 
    this.type = data.type;
    this.item_data = new ItemData(data.item_data).build();
  }

  build() {
    return {
      id: this.id,
      type: this.type,
      item_data: this.item_data,
    }
  }
}

class SquareItemWrapper {
  constructor(data) {
    this.object = new SquareCatalogItem(data).build();
  }

  build() {
    return {
      object: this.object,
    }
  }
}

/**
 * Fetches a specific catalog item by its ID from the Square API.
 * @param {string} itemId - The ID of the catalog item to fetch.
 * @returns {Promise<Object>} - A promise that resolves to the catalog item object.
 * @throws {Error} - Throws an error if itemId is not provided or if the API call fails.
 */
export async function getCatalogItem(itemId) {
  if (!itemId) {
    // Validate that an itemId is provided before making the API call
    throw new Error('ItemId is required to fetch catalog item');
  }
  try {
    // Use the API client to fetch the catalog item from the Square API
    const item = await apiClient(API_ENDPOINTS.SQUARE.CATALOG.item(itemId), 'GET');

    // return square object
    return item.object;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching catalog item:', error);
    throw new Error(`Failed to fetch catalog item: ${error.message}`);
  }
}

/**
 * Fetches the list of catalog items from the Square API.
 * @returns {Promise<Array>} - A promise that resolves to an array of catalog item objects.
 * @throws {Error} - Throws an error if the API call fails.
*/
export async function getCatalogList() {
  try {
    // Use the API client to fetch the catalog list from the Square API
    const catalogList = await apiClient(API_ENDPOINTS.SQUARE.CATALOG.list, 'GET');

    // return list
    return catalogList.objects;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching catalog list:', error);
    throw new Error(`Failed to fetch catalog list: ${error.message}`);
  }
}

// TODO - add function description
export async function upsertCatalogItem(itemData) {
  if (!itemData) {
    // Validate that an itemId is provided before making the API call
    throw new Error('ItemData is required to upsert catalog item');
  }

  try {
    // console.log('itemData in catalog', itemData)
    // delete itemData['id'];
    // delete itemData['created_at'];
    // delete itemData['updated_at'];
    // console.log('itemData after id deleted', itemData)
    const catalogItem = new SquareItemWrapper(itemData).build();
    console.log("catalogItem:", catalogItem);


    // const newCatalogObject = new SquareCatalogObject(itemData).build();
    const newItem = await apiClient(API_ENDPOINTS.SQUARE.CATALOG.upsertItem, 'POST', JSON.stringify(catalogItem))
    console.log("newly created square Item:", newItem);

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error upserting catalog item:', error);
    throw new Error(`Failed to upsert catalog item: ${error.message}`);
  }
}



