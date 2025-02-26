export interface Product {
  productName: string;
  price: number;
  description: string;
}

export interface Category {
  categoryName: string;
  products: Product[];
}

export interface Restaurant {
  name: string;
  address: string;
  phone: string;
  email: string;
  categories: Category[];
}