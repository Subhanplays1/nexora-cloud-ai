using System;
using System.IO;
using System.Diagnostics;
using System.Windows.Forms;

namespace NexoraLauncher
{
    static class Program
    {
        [STAThread]
        static void Main(string[] args)
        {
            try
            {
                // Target cloud backend URL or custom argument
                string targetUrl = "https://nexora-cloud-ai.onrender.com";
                if (args.Length > 0 && !string.IsNullOrEmpty(args[0]))
                {
                    targetUrl = args[0];
                }

                // Locate Microsoft Edge or Chrome
                string browserPath = FindBrowser();
                if (string.IsNullOrEmpty(browserPath))
                {
                    MessageBox.Show(
                        "Microsoft Edge or Google Chrome is required to run Nexora AI Desktop.\nPlease ensure one is installed on this computer.",
                        "Nexora AI",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error
                    );
                    return;
                }

                // Profile directory on D: for desktop app cache and cookies
                string profileDir = Path.Combine("D:\\nexora-ai", "desktop-profile");
                if (!Directory.Exists(profileDir))
                {
                    Directory.CreateDirectory(profileDir);
                }

                // Launch in standalone application window mode (frameless, no tabs, no address bar)
                string arguments = string.Format(
                    "--app=\"{0}\" --window-size=1360,880 --user-data-dir=\"{1}\" --no-first-run --no-default-browser-check",
                    targetUrl,
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
                MessageBox.Show("Error starting Nexora AI: " + ex.Message, "Nexora AI", MessageBoxButtons.OK, MessageBoxIcon.Error);
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
