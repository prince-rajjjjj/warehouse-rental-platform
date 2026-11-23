namespace Warehouse.Api.Services;

public static class BookingRules
{
    public const int MinDays = 7;
    public const int MaxDays = 365;

    // End dates are exclusive (checkout style).
    public static bool Overlaps(DateOnly aStart, DateOnly aEnd, DateOnly bStart, DateOnly bEnd)
        => aStart < bEnd && aEnd > bStart;

    public static int Days(DateOnly start, DateOnly end)
        => end.DayNumber - start.DayNumber;

    public static decimal CalculateTotal(decimal pricePerMonth, int days)
        => Math.Round(pricePerMonth * days / 30m, 2, MidpointRounding.AwayFromZero);
}