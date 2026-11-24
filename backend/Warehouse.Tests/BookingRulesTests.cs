using Warehouse.Api.Services;

namespace Warehouse.Tests;

public class BookingRulesTests
{
    [Theory]
    [InlineData("2026-12-10", "2026-12-24", "2026-12-10", "2026-12-24", true)]  // identical
    [InlineData("2026-12-10", "2026-12-24", "2026-12-20", "2026-12-30", true)]  // partial overlap
    [InlineData("2026-12-10", "2026-12-24", "2026-12-12", "2026-12-15", true)]  // one inside the other
    [InlineData("2026-12-10", "2026-12-24", "2026-12-24", "2027-01-07", false)] // back to back
    [InlineData("2026-12-10", "2026-12-24", "2026-12-01", "2026-12-10", false)] // back to back, before
    [InlineData("2026-12-10", "2026-12-24", "2027-02-01", "2027-02-15", false)] // far apart
    public void Overlaps_returns_expected_result(
        string aStart, string aEnd, string bStart, string bEnd, bool expected)
    {
        var result = BookingRules.Overlaps(
            DateOnly.Parse(aStart), DateOnly.Parse(aEnd),
            DateOnly.Parse(bStart), DateOnly.Parse(bEnd));

        Assert.Equal(expected, result);
    }

    [Fact]
    public void Days_counts_nights_with_exclusive_end()
    {
        var days = BookingRules.Days(new DateOnly(2026, 12, 10), new DateOnly(2026, 12, 24));

        Assert.Equal(14, days);
    }

    [Theory]
    [InlineData(45000, 14, 21000.00)]
    [InlineData(30000, 30, 30000.00)]
    [InlineData(10000, 7, 2333.33)]  // 70000 / 30 = 2333.333..., rounded to 2 decimals
    public void CalculateTotal_prorates_monthly_price(decimal monthly, int days, decimal expected)
    {
        Assert.Equal(expected, BookingRules.CalculateTotal(monthly, days));
    }
}