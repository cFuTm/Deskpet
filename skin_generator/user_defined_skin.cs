//批量处理图片尺寸
using System;
using System.IO;
using System.Drawing;
using System.Drawing.Imaging;
using System.Drawing.Drawing2D;

class SkinResizer
{
    static string[] skinNames = {
        "normal", "happy", "surprised", "sleepy", "thinking",
        "shy", "sad", "angry", "contempt"
    };

    static void Main()
    {
        string projectDir = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ".."));
        string srcDir = Path.Combine(projectDir, "skin_src");
        string outDir = Path.Combine(srcDir, "skin_src_resized");

        Directory.CreateDirectory(srcDir);
        Directory.CreateDirectory(outDir);
        int targetW = 130, targetH = 170;

        foreach (string name in skinNames)
        {
            string srcPath = Path.Combine(srcDir, name + ".png");
            string dst = Path.Combine(outDir, name + ".png");

            if (!File.Exists(srcPath))
            {
                Console.WriteLine("  Skip (not found): " + srcPath);
                continue;
            }

            using (var srcImg = Image.FromFile(srcPath))
            using (var bmp = new Bitmap(targetW, targetH, PixelFormat.Format32bppArgb))
            {
                bmp.SetResolution(96, 96);
                using (var g = Graphics.FromImage(bmp))
                {
                    g.CompositingMode = CompositingMode.SourceOver;
                    g.CompositingQuality = CompositingQuality.HighQuality;
                    g.SmoothingMode = SmoothingMode.HighQuality;
                    g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                    g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                    g.Clear(Color.Transparent);

                    // 计算缩放比例，保持宽高比，裁剪居中
                    float srcRatio = (float)srcImg.Width / srcImg.Height;
                    float dstRatio = (float)targetW / targetH;
                    int sx, sy, sw, sh;

                    if (srcRatio > dstRatio)
                    {
                        sh = srcImg.Height;
                        sw = (int)(sh * dstRatio);
                        sx = (srcImg.Width - sw) / 2;
                        sy = 0;
                    }
                    else
                    {
                        sw = srcImg.Width;
                        sh = (int)(sw / dstRatio);
                        sx = 0;
                        sy = (srcImg.Height - sh) / 2;
                    }

                    g.DrawImage(srcImg,
                        new Rectangle(0, 0, targetW, targetH),
                        new Rectangle(sx, sy, sw, sh),
                        GraphicsUnit.Pixel);
                }

                bmp.Save(dst, ImageFormat.Png);
                Console.WriteLine("  " + name + ": " + srcImg.Width + "x" + srcImg.Height + " -> " + targetW + "x" + targetH);
            }
        }

        Console.WriteLine("Resized user skins: " + outDir);
    }
}
