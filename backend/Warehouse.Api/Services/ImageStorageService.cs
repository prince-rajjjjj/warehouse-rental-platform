namespace Warehouse.Api.Services;

public class ImageSaveResult
{
    public string? Url { get; init; }
    public string? Error { get; init; }
    public bool Success => Error is null;
}

public class ImageStorageService
{
    public const long MaxBytes = 5 * 1024 * 1024;   // 5 MB

    private readonly string _folder;

    public ImageStorageService(IWebHostEnvironment env)
    {
        var root = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
        _folder = Path.Combine(root, "uploads");
        Directory.CreateDirectory(_folder);
    }

    public async Task<ImageSaveResult> SaveAsync(IFormFile file)
    {
        if (file.Length == 0) return Fail("The file is empty.");
        if (file.Length > MaxBytes) return Fail("The file is larger than 5 MB.");

        await using var stream = file.OpenReadStream();

        // Look at the first bytes to find the real file type.
        var header = new byte[12];
        var read = await stream.ReadAsync(header.AsMemory(0, 12));
        var extension = read == 12 ? DetectExtension(header) : null;
        if (extension is null) return Fail("Only JPG, PNG and WebP images are allowed.");

        var fileName = $"{Guid.NewGuid():N}{extension}";
        var path = Path.Combine(_folder, fileName);

        stream.Seek(0, SeekOrigin.Begin);
        await using var target = File.Create(path);
        await stream.CopyToAsync(target);

        return new ImageSaveResult { Url = $"/uploads/{fileName}" };
    }

    public void Delete(string url)
    {
        // Keep only the file name, so a bad value can't point outside the uploads folder.
        var name = Path.GetFileName(url);
        if (string.IsNullOrEmpty(name)) return;

        var path = Path.Combine(_folder, name);
        if (File.Exists(path)) File.Delete(path);
    }

    private static string? DetectExtension(byte[] h)
    {
        if (h[0] == 0xFF && h[1] == 0xD8 && h[2] == 0xFF) return ".jpg";
        if (h[0] == 0x89 && h[1] == 0x50 && h[2] == 0x4E && h[3] == 0x47) return ".png";

        // WebP files start with "RIFF", then 4 size bytes, then "WEBP".
        if (h[0] == 0x52 && h[1] == 0x49 && h[2] == 0x46 && h[3] == 0x46
            && h[8] == 0x57 && h[9] == 0x45 && h[10] == 0x42 && h[11] == 0x50) return ".webp";

        return null;
    }

    private static ImageSaveResult Fail(string message) => new() { Error = message };
}