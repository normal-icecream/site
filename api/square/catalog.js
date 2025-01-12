import { apiClient } from '../client.js'
import { API_ENDPOINTS } from '../config.js';

export async function getCatalogItem(itemId) {
    if (!itemId) {
        throw new Error('ItemId is required to fetch catalog item')
    }
    try {
        const item = await apiClient(API_ENDPOINTS.SQUARE.CATALOG.item(itemId), 'GET')
        if (item) {
            console.log('returned Square item', item.object)
            return item.object;
        }
    } catch (error) {
        console.error("Error fetching catalog item:", error);
        
    }
}

export async function getCatalogList() {
    let objectList = {}
    await apiClient(API_ENDPOINTS.SQUARE.CATALOG.list, 'GET')
      .then((list) => {
        objectList = list.objects;
      })
      .catch((error) => {
        console.error("Error fetching catalog list:", error);
      });

    return objectList;
}


// run    wrangler deploy    // To update cloudflare with any updates to the worker.js file
// run    wrangler dev        // To test your code locally

// run    wrangler dev --env production --remote to test square locally for PROD env

// run    wrangler dev --env sandbox --remote to test square locally for SANDBOX env

// Wrangler commands - https://developers.cloudflare.com/workers/wrangler/commands/#deploy