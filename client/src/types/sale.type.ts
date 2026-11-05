export interface ISale {
  product: string;
  quantity: number;
  buyerName: string;
  date: string;
  price: number
}

export interface ITableSale {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
  }
  productPrice: number;
  variantSize?: string;
  variantColor?: string;
  productName: string;
  quantity: number;
  buyerName: string;
  date: string;
  totalPrice: number
}