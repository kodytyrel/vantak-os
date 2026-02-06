/**
 * Terminology Helper Functions
 * Maps business_type (craft) to appropriate UI terminology
 */

export type CraftType = 'service' | 'education' | 'retail' | 'professional' | 'beauty_lifestyle' | 'therapy_health';

export interface Terminology {
  customer: string;
  customers: string;
  service: string;
  services: string;
  bookService: string;
  bookNow: string;
  scheduleButton: string;
}

export function getTerminology(craft?: CraftType): Terminology {
  switch (craft) {
    case 'education':
      return {
        customer: 'Student',
        customers: 'Students',
        service: 'Lesson Type',
        services: 'Lesson Types',
        bookService: 'Schedule a Lesson',
        bookNow: 'Schedule Lesson',
        scheduleButton: 'Schedule Lesson',
      };
    case 'retail':
      return {
        customer: 'Buyer',
        customers: 'Buyers',
        service: 'Product',
        services: 'Catalog',
        bookService: 'Browse Catalog',
        bookNow: 'Shop Now',
        scheduleButton: 'Shop Now',
      };
    case 'professional':
      return {
        customer: 'Client',
        customers: 'Clients',
        service: 'Service',
        services: 'Services',
        bookService: 'Book Consultation',
        bookNow: 'Book Now',
        scheduleButton: 'Book Consultation',
      };
    case 'therapy_health':
      return {
        customer: 'Client',
        customers: 'Clients',
        service: 'Session',
        services: 'Sessions',
        bookService: 'Schedule Session',
        bookNow: 'Schedule Session',
        scheduleButton: 'Schedule Session',
      };
    case 'beauty_lifestyle':
      return {
        customer: 'Customer',
        customers: 'Customers',
        service: 'Service',
        services: 'Services',
        bookService: 'Book a Service',
        bookNow: 'Book Now',
        scheduleButton: 'Book Now',
      };
    default: // 'service'
      return {
        customer: 'Customer',
        customers: 'Customers',
        service: 'Service',
        services: 'Services',
        bookService: 'Book a Service',
        bookNow: 'Book Now',
        scheduleButton: 'Book Now',
      };
  }
}

export function getCustomerLabel(craft?: CraftType): string {
  return getTerminology(craft).customers;
}

export function getServiceLabel(craft?: CraftType): string {
  return getTerminology(craft).services;
}

export function getBookNowLabel(craft?: CraftType): string {
  return getTerminology(craft).bookNow;
}

