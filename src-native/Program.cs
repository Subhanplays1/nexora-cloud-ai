using System;
using System.IO;
using System.Net;
using System.Diagnostics;
using System.Threading;
using System.Windows.Forms;

namespace NexoraLauncher
{
    static class Program
    {
        private static HttpListener listener;
        private static string distPath;
        private static int port = 5180;
        private static bool isRunning = true;

        [STAThread]
        static void Main()
        {
            try
            {
                // Resolve path to packages/desktop/dist
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                distPath = Path.Combine(baseDir, "packages", "desktop", "dist");

                if (!Directory.Exists(distPath))
                {
                    // Fallback to checking working directory or parent directories
                    distPath = Path.Combine("D:\\nexora-ai", "packages", "desktop", "dist");
                }

                // Start local static server for React bundle
                StartHttpServer();

                // Locate Microsoft Edge or Chrome
                string browserPath = FindBrowser();
                if (string.IsNullOrEmpty(browserPath))
                {
                    MessageBox.Show("Could not find Microsoft Edge or Google Chrome to launch Nexora AI.", "Nexora AI Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }

                // Prepare dedicated desktop profile directory on D:
                string profileDir = Path.Combine("D:\\nexora-ai", "desktop-profile");
                if (!Directory.Exists(profileDir))
                {
                    Directory.CreateDirectory(profileDir);
                }

                string appUrl = string.Format("http://127.0.0.1:{0}/index.html", port);
                string arguments = string.Format(
                    "--app=\"{0}\" --window-size=1360,880 --user-data-dir=\"{1}\" --no-first-run --no-default-browser-check",
                    appUrl,
                    profileDir
                );

                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = browserPath,
                    Arguments = arguments,
                    UseShellExecute = false
                };

                Process appProcess = Process.Start(psi);
                if (appProcess != null)
                {
                    appProcess.WaitForExit();
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Error launching Nexora AI: " + ex.Message, "Nexora AI", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                isRunning = false;
                if (listener != null && listener.IsListening)
                {
                    listener.Stop();
                }
            }
        }

        private static string FindBrowser()
        {
            string edge = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe");
            if (File.Exists(edge)) return edge;

            edge = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe");
            if (File.Exists(edge)) return edge;

            string chrome = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\Chrome\Application\chrome.exe");
            if (File.Exists(chrome)) return chrome;

            chrome = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Google\Chrome\Application\chrome.exe");
            if (File.Exists(chrome)) return chrome;

            return null;
        }

        private static void StartHttpServer()
        {
            listener = new HttpListener();
            listener.Prefixes.Add(string.Format("http://127.0.0.1:{0}/", port));
            listener.Start();

            ThreadPool.QueueUserWorkItem((state) =>
            {
                while (isRunning && listener.IsListening)
                {
                    try
                    {
                        var context = listener.GetContext();
                        ProcessRequest(context);
                    }
                    catch { }
                }
            });
        }

        private static void ProcessRequest(HttpListenerContext context)
        {
            try
            {
                string rawUrl = context.Request.Url.AbsolutePath.TrimStart('/');
                if (string.IsNullOrEmpty(rawUrl)) rawUrl = "index.html";

                string filePath = Path.Combine(distPath, rawUrl.Replace('/', Path.DirectorySeparatorChar));

                // Fallback to index.html for client-side routing
                if (!File.Exists(filePath))
                {
                    filePath = Path.Combine(distPath, "index.html");
                }

                if (File.Exists(filePath))
                {
                    byte[] bytes = File.ReadAllBytes(filePath);
                    context.Response.ContentType = GetMimeType(filePath);
                    context.Response.ContentLength64 = bytes.Length;
                    context.Response.OutputStream.Write(bytes, 0, bytes.Length);
                }
                else
                {
                    context.Response.StatusCode = 404;
                }
            }
            catch
            {
                context.Response.StatusCode = 500;
            }
            finally
            {
                context.Response.OutputStream.Close();
            }
        }

        private static string GetMimeType(string path)
        {
            string ext = Path.GetExtension(path).ToLower();
            switch (ext)
            {
                case ".html": return "text/html; charset=utf-8";
                case ".js": return "application/javascript; charset=utf-8";
                case ".css": return "text/css; charset=utf-8";
                case ".svg": return "image/svg+xml";
                case ".png": return "image/png";
                case ".jpg":
                case ".jpeg": return "image/jpeg";
                case ".json": return "application/json";
                case ".ico": return "image/x-icon";
                default: return "application/octet-stream";
            }
        }
    }
}
