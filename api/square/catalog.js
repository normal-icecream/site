import { apiClient } from '../client.js'
import { API_ENDPOINTS } from '../config.js';

export async function getCatalogObject(objectId) {
    if (!objectId) {
        throw new Error('ObjectId is required to fetch catalog item')
    }
    try {
        const object = await apiClient(API_ENDPOINTS.SQUARE.CATALOG.getCatalogObject(objectId), 'GET')
        if (object) {
            console.log('returned Square object', object.object)
            return object.object;
        }
    } catch (error) {
        console.error("Error fetching catalog object:", error);
        
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

// Wrangler commands - https://developers.cloudflare.com/workers/wrangler/commands/#deploy