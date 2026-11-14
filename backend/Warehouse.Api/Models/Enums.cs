namespace Warehouse.Api.Models;

public enum UserRole { Renter = 0, Owner = 1, Admin = 2 }

public enum WarehouseType { Dry = 0, Cold = 1, Mixed = 2 }

public enum ListingStatus { Pending = 0, Approved = 1, Rejected = 2 }

public enum BookingStatus
{
    PendingPayment = 0,
    Pending = 1,
    Confirmed = 2,
    Rejected = 3,
    Cancelled = 4,
    Completed = 5
}

public enum PaymentStatus { Created = 0, Paid = 1, Failed = 2 }