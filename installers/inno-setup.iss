[Setup]
AppName=Taptap CLI
AppVersion=2.4.0
DefaultDirName={autopf}\Taptap
DefaultGroupName=Taptap
OutputDir=build
OutputBaseFilename=taptap-setup
Compression=lzma
SolidCompression=yes

[Files]
Source: "..\dist\taptap-win.exe"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\Taptap CLI"; Filename: "{app}\taptap-win.exe"
