const API_BASE_URLS = {
    SQUARE: '/api/square',
    // ADD any other API here
};

export const API_ENDPOINTS = {
    SQUARE: {
        CATALOG: {
            getCatalogObject: (objectId) => `${API_BASE_URLS.SQUARE}/v2/catalog/object/${objectId}?include_related_objects=true`, // GET 
            list: `${API_BASE_URLS.SQUARE}/v2/catalog/list`, // GET
        },
        // ORDERS: {
        //     create: `${API_BASE_URL}/v2/orders`, // POST
        // },
        // PAYMENTS: {
        //     create: `${API_BASE_URL}/v2/payments`, // POST
        // },
    }
    // ADD any other API here
};
