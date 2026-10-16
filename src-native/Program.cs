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
        [STAThread]
        static void Main()
        {
            Process devProcess = null;
            try
            {
                string desktopDir = Path.Combine("D:\\nexora-ai", "packages", "desktop");
                if (!Directory.Exists(desktopDir))
                {
                    desktopDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "packages", "desktop");
                }

                // 1. Launch `npm run dev` in background
                ProcessStartInfo npmPsi = new ProcessStartInfo
                {
                    FileName = "cmd.exe",
                    Arguments = "/c npm run dev",
                    WorkingDirectory = desktopDir,
                    CreateNoWindow = true,
                    UseShellExecute = false
                };

                devProcess = Process.Start(npmPsi);

                // 2. Wait until dev server is listening on port 5173
                string targetUrl = "http://localhost:5173";
                bool serverReady = false;
                for (int i = 0; i < 30; i++)
                {
                    try
                    {
                        HttpWebRequest req = (HttpWebRequest)WebRequest.Create(targetUrl);
                        req.Timeout = 800;
                        using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse())
                        {
                            if ((int)resp.StatusCode >= 200 && (int)resp.StatusCode < 400)
                            {
                                serverReady = true;
                                break;
                            }
                        }
                    }
                    catch
                    {
                        Thread.Sleep(500);
                    }
                }

                // 3. Find browser (Edge or Chrome)
                string browserPath = FindBrowser();
                if (string.IsNullOrEmpty(browserPath))
                {
                    MessageBox.Show(
                        "Microsoft Edge or Google Chrome is required to launch Nexora AI.",
                        "Nexora AI",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error
                    );
                    return;
                }

                // 4. Dedicated profile directory on D:
                string profileDir = Path.Combine("D:\\nexora-ai", "desktop-profile");
                if (!Directory.Exists(profileDir))
                {
                    Directory.CreateDirectory(profileDir);
                }

                // 5. Open standalone app window pointing to http://localhost:5173
                string arguments = string.Format(
                    "--app=\"{0}\" --window-size=1360,880 --user-data-dir=\"{1}\" --no-first-run --no-default-browser-check",
                    targetUrl,
                    profileDir
                );

                ProcessStartInfo browserPsi = new ProcessStartInfo
                {
                    FileName = browserPath,
                    Arguments = arguments,
                    UseShellExecute = false
                };

                Process browserProcess = Process.Start(browserPsi);
                if (browserProcess != null)
                {
                    browserProcess.WaitForExit();
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Error starting Nexora AI: " + ex.Message, "Nexora AI", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                // Kill dev server process tree cleanly on exit
                if (devProcess != null && !devProcess.HasExited)
                {
                    try
                    {
                        ProcessStartInfo killPsi = new ProcessStartInfo
                        {
                            FileName = "taskkill",
                            Arguments = string.Format("/F /T /PID {0}", devProcess.Id),
                            CreateNoWindow = true,
                            UseShellExecute = false
                        };
                        Process.Start(killPsi);
                    }
                    catch { }
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
    }
}
