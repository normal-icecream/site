// class ItemData {
//     constructor(data) {
//       this.name = data.name;
//       this.description_html = data.description;
//       this.product_type = data.product_type
//       this.variations = (data.variations || []).map((variation) => new SquareItemVariation(variation).build());
//     }
  
//     build() {
//       return {
//         name: this.name,
//         description_html: this.description_html,
//         product_type: this.product_type,
//         variations: this.variations,
//       }
//     }
//   }
  
//   class SquareItemVariationDataPrice {
//     constructor(data) {
//       this.amount = data.amount;
//       this.currency = data.currency;
//     }
  
//     build() {
//       return {
//         amount: this.amount,
//         currency: this.currency,
//       }
//     }
//   }
  
//   class SquareItemVariationData {
//     constructor(data) {
//       this.name = data.name;
//       this.price_money = new SquareItemVariationDataPrice(data.price_money).build();
//     }
  
//     build() {
//       return {
//         name: this.name,
//         price_money: this.price_money,
//       }
//     }
//   }
  
//   class SquareItemVariation {
//     constructor(data) {
//       console.log("data:", data);
//       this.id = '#variation';
//       this.type = data.type;
//       this.item_variation_data = new SquareItemVariationData(data.item_variation_data).build();
//       // this.item_variation_data = data.item_variation_data 
//     }
  
//     build() {
//       return {
//         id: this.id,
//         type: this.type,
//         item_variation_data: this.item_variation_data,
//       }
//     }
//   }
  
//   class SquareCatalogItem {
//     constructor(data) {
//       if (!data.type) {
//         throw new Error("Data object must include 'id' and 'type'.");
//       }
  
//       // per docs, when a new CatalogObject is inserted, 
//       // the client should set the id to a temporary identifier starting with a "#" character.
//       this.id = '#item'; 
//       this.type = data.type;
//       this.item_data = new ItemData(data.item_data).build();
//     }
  
//     build() {
//       return {
//         id: this.id,
//         type: this.type,
//         item_data: this.item_data,
//       }
//     }
//   }
  
//   class SquareItemWrapper {
//     constructor(data) {
//       this.object = new SquareCatalogItem(data).build();
//     }
  
//     build() {
//       return {
//         object: this.object,
//       }
//     }
//   }