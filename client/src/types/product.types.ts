export type IProduct = {
  _id: string
  name: string
  category: ICategory
  brand?: IBrand
  price: number
  stock: number
  variants: IProductVariant[]
  seller: ISeller
  description?: string
  images?: string[]
  status?: 'active' | 'inactive'
  createdAt?: string
  updatedAt?: string
}

export interface IProductVariant {
  _id: string
  size: string
  color: string
  stock: number
  lowStockThreshold: number
  sku?: string
}

export interface ILowStockVariant {
  _id: string
  name: string
  variant: IProductVariant
}

export interface ISeller {
  _id: string
  name: string
  email: string
  contactNo: string
}

export interface ICategory {
  _id: string
  name: string
}

export interface IBrand {
  _id: string
  name: string
}

export type StockMovementType = 'initial_stock' | 'purchase' | 'sale' | 'return' | 'adjustment'

export interface IStockMovement {
  _id: string
  type: StockMovementType
  variantId: string
  variantSize: string
  variantColor: string
  variantSku?: string
  previousStock: number
  quantityChanged: number
  newStock: number
  reason: string
  referenceId?: string
  performedBy?: string | { name?: string; email?: string }
  createdAt: string
}

export interface IProductNote {
  _id: string
  body: string
  author?: string | { name?: string; email?: string }
  createdAt: string
}