export interface IPurchase {
  _id: string
  user: string
  seller: string
  product: string
  variantId?: string
  variantSize?: string
  variantColor?: string
  sellerName: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  paid: number
  createdAt: string
}
