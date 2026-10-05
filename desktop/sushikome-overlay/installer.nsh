!include "nsDialogs.nsh"

Var SushiDesktopShortcutCheckbox
Var SushiDesktopShortcutState

Function CreateSushiDesktopShortcut
  CreateShortCut "$newDesktopLink" "$appExe" "" "$appExe" 0 "" "" "${APP_DESCRIPTION}"
  ClearErrors
  WinShell::SetLnkAUMI "$newDesktopLink" "${APP_ID}"
  System::Call 'Shell32::SHChangeNotify(i 0x1002, i 0, i 0, i 0)'
FunctionEnd

Function SushiFinishShow
  ${NSD_CreateCheckbox} 120u 110u 195u 10u "デスクトップにアイコンを作成する"
  Pop $SushiDesktopShortcutCheckbox
  ${NSD_SetState} $SushiDesktopShortcutCheckbox ${BST_CHECKED}
FunctionEnd

Function SushiFinishLeave
  ${NSD_GetState} $SushiDesktopShortcutCheckbox $SushiDesktopShortcutState
  ${If} $SushiDesktopShortcutState == ${BST_CHECKED}
    Call CreateSushiDesktopShortcut
  ${EndIf}
FunctionEnd

!macro customFinishPage
  !ifndef HIDE_RUN_AFTER_FINISH
    Function StartApp
      ${if} ${isUpdated}
        StrCpy $1 "--updated"
      ${else}
        StrCpy $1 ""
      ${endif}
      ${StdUtils.ExecShellAsUser} $0 "$launchLink" "open" "$1"
    FunctionEnd
    !define MUI_FINISHPAGE_RUN
    !define MUI_FINISHPAGE_RUN_FUNCTION "StartApp"
  !endif
  !define MUI_PAGE_CUSTOMFUNCTION_SHOW SushiFinishShow
  !define MUI_PAGE_CUSTOMFUNCTION_LEAVE SushiFinishLeave
  !insertmacro MUI_PAGE_FINISH
!macroend
