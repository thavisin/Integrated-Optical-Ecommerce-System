export interface Product {
  id: number
  name: string
  brand: string
  description: string
  category: string
  price: number
  stock: number
  imageUrl?: string | null
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: number
  productId: number
  quantity: number
  price: number
  product?: Product
}

export interface Order {
  id: number
  total: number
  status: string
  slipUrl?: string | null
  note?: string | null
  shippingName: string
  phone: string
  address: string
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  user?: { id: number; name: string; email: string }
}

export interface AdminStats {
  cards: {
    revenue: number
    totalOrders: number
    customers: number
    products: number
    pendingVerify: number
    lowStock: number
  }
  revenueByDay: { date: string; amount: number; orders: number }[]
  revenueByMonth: { month: string; amount: number; orders: number }[]
  topProducts: { name: string; quantity: number; revenue: number }[]
  ordersByStatus: { status: string; count: number }[]
  recentOrders: { id: number; total: number; status: string; createdAt: string; customer: string; itemCount: number }[]
}
