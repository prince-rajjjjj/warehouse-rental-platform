using Microsoft.EntityFrameworkCore;
using Warehouse.Api.Models;

namespace Warehouse.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<WarehouseListing> WarehouseListings => Set<WarehouseListing>();
    public DbSet<WarehouseImage> WarehouseImages => Set<WarehouseImage>();
    public DbSet<BlockedDate> BlockedDates => Set<BlockedDate>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Review> Reviews => Set<Review>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Name).HasMaxLength(100);
            e.Property(u => u.Email).HasMaxLength(200);
            e.Property(u => u.Role).HasConversion<string>().HasMaxLength(20);
        });

        b.Entity<WarehouseListing>(e =>
        {
            e.Property(w => w.Title).HasMaxLength(200);
            e.Property(w => w.City).HasMaxLength(100);
            e.Property(w => w.PricePerMonth).HasPrecision(12, 2);
            e.Property(w => w.Type).HasConversion<string>().HasMaxLength(20);
            e.Property(w => w.Status).HasConversion<string>().HasMaxLength(20);
            e.HasIndex(w => new { w.City, w.Status });

            e.HasOne(w => w.Owner)
             .WithMany(u => u.Warehouses)
             .HasForeignKey(w => w.OwnerId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<WarehouseImage>(e =>
        {
            e.Property(i => i.Status).HasConversion<string>().HasMaxLength(20);
            e.HasIndex(i => new { i.WarehouseListingId, i.Status });

            e.HasOne(i => i.WarehouseListing)
             .WithMany(w => w.Images)
             .HasForeignKey(i => i.WarehouseListingId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<BlockedDate>(e =>
        {
            e.HasOne(d => d.WarehouseListing)
             .WithMany(w => w.BlockedDates)
             .HasForeignKey(d => d.WarehouseListingId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Booking>(e =>
        {
            e.Property(x => x.TotalAmount).HasPrecision(12, 2);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.HasIndex(x => new { x.WarehouseListingId, x.StartDate, x.EndDate });

            e.HasOne(x => x.WarehouseListing)
             .WithMany(w => w.Bookings)
             .HasForeignKey(x => x.WarehouseListingId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Renter)
             .WithMany(u => u.Bookings)
             .HasForeignKey(x => x.RenterId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<Payment>(e =>
        {
            e.Property(p => p.Amount).HasPrecision(12, 2);
            e.Property(p => p.Status).HasConversion<string>().HasMaxLength(20);
            e.HasOne(p => p.Booking)
             .WithMany(x => x.Payments)
             .HasForeignKey(p => p.BookingId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<Review>(e =>
        {
            e.HasIndex(r => r.BookingId).IsUnique();   // one review per booking

            e.HasOne(r => r.Booking)
             .WithOne(x => x.Review)
             .HasForeignKey<Review>(r => r.BookingId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(r => r.WarehouseListing)
             .WithMany(w => w.Reviews)
             .HasForeignKey(r => r.WarehouseListingId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(r => r.Renter)
             .WithMany()
             .HasForeignKey(r => r.RenterId)
             .OnDelete(DeleteBehavior.Restrict);
        });
    }
}