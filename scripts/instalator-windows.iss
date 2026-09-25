; Instalator Windows: z folderu release\Hub klasowy (npm run pakiet:windows) robi release\Hub-klasowy-setup.exe.
; Kompilacja: ISCC.exe /DAppVersion=1.0.0 scripts\instalator-windows.iss
; Instaluje bez uprawnień administratora do Dokumentów, bo serwer.ps1 zapisuje folder "dane" obok siebie.

#ifndef AppVersion
  #define AppVersion "1.0.0"
#endif
#define Source "..\release\Hub klasowy"

[Setup]
AppId={{7C1E6A2B-4F0D-4B8E-9A51-3D2C8F6B1E90}
AppName=Hub klasowy
AppVersion={#AppVersion}
AppPublisher=Adrian Kędzior
DefaultDirName={userdocs}\Hub klasowy
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputDir=..\release
OutputBaseFilename=Hub-klasowy-setup
SetupIconFile={#Source}\hub-klasowy.ico
UninstallDisplayIcon={app}\hub-klasowy.ico
Compression=lzma2
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "polish"; MessagesFile: "compiler:Languages\Polish.isl"

[Tasks]
Name: "pulpit"; Description: "Skrót na pulpicie"
Name: "autostart"; Description: "Uruchamiaj hub automatycznie po zalogowaniu do Windows"; Flags: unchecked

[Files]
Source: "{#Source}\aplikacja\*"; DestDir: "{app}\aplikacja"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "{#Source}\*"; Excludes: "aplikacja,relaks,Zainstaluj na pulpicie.bat"; DestDir: "{app}"; Flags: ignoreversion
; Pliki relaksu tylko przy pierwszej instalacji — aktualizacja nie przywraca usuniętych ani nie rusza dodanych.
Source: "{#Source}\relaks\*"; DestDir: "{app}\relaks"; Flags: recursesubdirs createallsubdirs; Check: RelaksNowy

[InstallDelete]
; Stara wersja aplikacji znika przed wgraniem nowej (folderów "dane" i "relaks" nie ruszamy).
Type: filesandordirs; Name: "{app}\aplikacja"

[Icons]
Name: "{autoprograms}\Hub klasowy"; Filename: "{app}\Uruchom hub klasowy.bat"; WorkingDir: "{app}"; IconFilename: "{app}\hub-klasowy.ico"; Flags: runminimized
Name: "{autodesktop}\Hub klasowy"; Filename: "{app}\Uruchom hub klasowy.bat"; WorkingDir: "{app}"; IconFilename: "{app}\hub-klasowy.ico"; Flags: runminimized; Tasks: pulpit
Name: "{userstartup}\Hub klasowy"; Filename: "{app}\Uruchom hub klasowy.bat"; WorkingDir: "{app}"; IconFilename: "{app}\hub-klasowy.ico"; Flags: runminimized; Tasks: autostart

[Run]
Filename: "{app}\Uruchom hub klasowy.bat"; WorkingDir: "{app}"; Description: "Uruchom Hub klasowy"; Flags: postinstall nowait shellexec runminimized skipifsilent

[UninstallRun]
Filename: "{app}\Zatrzymaj hub klasowy.bat"; WorkingDir: "{app}"; Flags: runhidden waituntilterminated; RunOnceId: "Zatrzymaj"

[Code]
var
  RelaksBylo: Boolean;

function RelaksNowy: Boolean;
begin
  Result := not RelaksBylo;
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  Kod: Integer;
begin
  if CurStep = ssInstall then
  begin
    RelaksBylo := DirExists(ExpandConstant('{app}\relaks'));
    // Działający serwer zatrzymujemy przed podmianą plików.
    if FileExists(ExpandConstant('{app}\Zatrzymaj hub klasowy.bat')) then
      Exec(ExpandConstant('{app}\Zatrzymaj hub klasowy.bat'), '', ExpandConstant('{app}'), SW_HIDE, ewWaitUntilTerminated, Kod);
  end;
end;
