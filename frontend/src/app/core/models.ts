export type UserRole = 'Renter' | 'Owner' | 'Admin';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: User;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export type WarehouseType = 'Dry' | 'Cold' | 'Mixed';
export type ListingStatus = 'Pending' | 'Approved' | 'Rejected';

export interface WarehouseRequest {
  title: string;
  description: string;
  city: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  sizeSqFt: number;
  pricePerMonth: number;
  type: WarehouseType;
  amenities: string | null;
}

export interface OwnerWarehouse extends WarehouseRequest {
  id: number;
  status: ListingStatus;
  createdAt: string;
  imageUrls: string[];
}

export interface PublicWarehouse {
  id: number;
  title: string;
  description: string;
  city: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  sizeSqFt: number;
  pricePerMonth: number;
  type: WarehouseType;
  amenities: string | null;
  ownerName: string;
  averageRating: number | null;
  reviewCount: number;
  imageUrls: string[];
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface WarehouseSearchQuery {
  city?: string;
  type?: WarehouseType | '';
  minPrice?: number | null;
  maxPrice?: number | null;
  sort?: string;
  page: number;
  pageSize: number;
}

export interface AdminWarehouse extends OwnerWarehouse {
  ownerName: string;
  ownerEmail: string;
}

export interface UnavailableRange {
  start: string; // "2026-12-10"
  end: string;   // exclusive: the checkout day
}

export interface CreateBookingRequest {
  warehouseId: number;
  startDate: string;
  endDate: string;
}

export interface Booking {
  id: number;
  warehouseId: number;
  warehouseTitle: string;
  warehouseCity: string;
  startDate: string;
  endDate: string;
  days: number;
  totalAmount: number;
  status: string;
  holdExpiresAt: string | null;
  createdAt: string;
}