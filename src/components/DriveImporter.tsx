import React, { useState } from "react";
import { FolderOpen, ArrowDownToLine, CheckCircle2, AlertCircle, RefreshCw, Folder, FileCode, Link2 } from "lucide-react";

interface DriveImporterProps {
  accessToken: string | null;
  onLoginNeeded: () => void;
}

export const DriveImporter: React.FC<DriveImporterProps> = ({ accessToken, onLoginNeeded }) => {
  const [folderInput, setFolderInput] = useState("https://drive.google.com/drive/folders/16g5XRcPLTODeZPmCnAKj-0j5m852yzc7?usp=drive_link");
  const [isScanning, setIsScanning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<{ id: string; name: string } | null>(null);
  const [detectedFiles, setDetectedFiles] = useState<any[]>([]);

  const extractFolderId = (input: string): string => {
    const trimmed = input.trim();
    const folderIdRegex = /\/folders\/([a-zA-Z0-9-_]+)/;
    const match = trimmed.match(folderIdRegex);
    if (match && match[1]) {
      return match[1];
    }
    return trimmed; // Fallback to raw string if it is already an ID
  };

  const handleScan = async () => {
    if (!accessToken) {
      onLoginNeeded();
      return;
    }

    if (!folderInput.trim()) {
      setError("Please provide a valid Google Drive folder URL or Folder ID.");
      return;
    }

    setIsScanning(true);
    setError(null);
    setSuccess(null);
    setSelectedFolder(null);
    setDetectedFiles([]);

    try {
      const customFolderId = extractFolderId(folderInput);
      const response = await fetch("/api/drive/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessToken, customFolderId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to scan Google Drive folder.");
      }

      if (data.selectedFolder) {
        setSelectedFolder(data.selectedFolder);
        setDetectedFiles(data.files || []);
      } else {
        setError(data.message || "No Google Drive folder was located at that destination. Ensure sharing settings are correct.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while communicating with Google Drive.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleImport = async () => {
    if (!accessToken || !selectedFolder) return;

    const confirmed = window.confirm(
      `Warning: This will overwrite files in your workspace with those from the Google Drive folder "${selectedFolder.name}". Are you sure you want to proceed?`
    );
    if (!confirmed) return;

    setIsImporting(true);
    setError(null);

    try {
      const response = await fetch("/api/drive/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken,
          folderId: selectedFolder.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Import failed.");
      }

      setSuccess(`Success! Successfully imported and configured ${data.files?.length || 0} files. Please wait while the build system completes integration...`);
      setSelectedFolder(null);
      setDetectedFiles([]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to complete Google Drive import.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50/50 to-white border border-indigo-100 rounded-2xl p-6 shadow-sm text-left" id="drive-importer-panel">
      {/* Importer Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-md shadow-indigo-100">
          <FolderOpen className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-extrabold text-slate-800 text-sm">
            Import Vibe2ship from Google Drive
          </h2>
          <p className="text-xs text-slate-500">
            Fetch custom solutions, code configurations, and profiles directly from your Drive
          </p>
        </div>
      </div>

      {!accessToken ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-xs space-y-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <p className="font-semibold leading-relaxed">
              Google Sign-In with Drive permissions is required to import. Please sign in or authorize permissions using the profile button in the header.
            </p>
          </div>
          <button
            onClick={onLoginNeeded}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg transition-colors cursor-pointer text-center"
          >
            Authorize Google Account
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Action Trigger */}
          {!selectedFolder && !success && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1">
                  <Link2 className="w-3 h-3 text-indigo-500" />
                  Google Drive Folder Link or Folder ID
                </label>
                <input
                  type="text"
                  value={folderInput}
                  onChange={(e) => setFolderInput(e.target.value)}
                  placeholder="Paste Google Drive folder URL or Folder ID"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
                />
              </div>
              
              <div className="flex justify-between items-center gap-4 pt-1">
                <span className="text-[11px] text-slate-500 leading-normal max-w-xs">
                  Scans files recursively within your specified Google Drive folder for workspace import.
                </span>
                <button
                  type="button"
                  onClick={handleScan}
                  disabled={isScanning}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50 shrink-0"
                >
                  {isScanning ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Folder className="w-3.5 h-3.5" />
                  )}
                  <span>Scan Folder</span>
                </button>
              </div>
            </div>
          )}

          {/* Error Feed */}
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3.5 rounded-xl flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Feed */}
          {success && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs p-4 rounded-xl flex items-start gap-2.5 animate-fadeIn font-semibold leading-relaxed">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <div>
                <p className="font-extrabold text-emerald-800">Files Imported Successfully!</p>
                <p className="mt-1">{success}</p>
              </div>
            </div>
          )}

          {/* Folder found - file list list */}
          {selectedFolder && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Target Folder Detected</span>
                  <h3 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                    <Folder className="w-4 h-4 text-indigo-500" />
                    {selectedFolder.name} ({detectedFiles.length} files)
                  </h3>
                </div>

                <button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-50 disabled:opacity-50"
                >
                  {isImporting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                  )}
                  <span>Import Project</span>
                </button>
              </div>

              {/* Detected list */}
              <div className="max-h-[180px] overflow-y-auto pr-1 space-y-1.5">
                {detectedFiles.length > 0 ? (
                  detectedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1 px-2 hover:bg-slate-50 rounded-lg text-slate-700 text-xs transition-colors">
                      <span className="font-medium truncate flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5 text-slate-400" />
                        {file.path}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-slate-400 shrink-0 ml-2">Code</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-4">No code files detected in this folder.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
