!include "nsDialogs.nsh"

Var SushiDesktopPage
Var SushiDesktopShortcutCheckbox
Var SushiDesktopShortcutState

Function SushiDesktopPageCreate
  nsDialogs::Create 1018
  Pop $SushiDesktopPage
  ${If} $SushiDesktopPage == error
    Abort
  ${EndIf}
  ${NSD_CreateLabel} 0 0 100% 24u "ショートカット"
  Pop $0
  ${NSD_CreateCheckbox} 0 34u 100% 14u "デスクトップにすし授業のアイコンを作成する"
  Pop $SushiDesktopShortcutCheckbox
  ${NSD_SetState} $SushiDesktopShortcutCheckbox ${BST_CHECKED}
  nsDialogs::Show
FunctionEnd

Function SushiDesktopPageLeave
  ${NSD_GetState} $SushiDesktopShortcutCheckbox $SushiDesktopShortcutState
FunctionEnd

!macro customPageAfterChangeDir
  Page custom SushiDesktopPageCreate SushiDesktopPageLeave
!macroend

!macro customInstall
  ${If} $SushiDesktopShortcutState == ${BST_CHECKED}
    CreateShortCut "$DESKTOP\Sushi Kome Overlay.lnk" "$INSTDIR\Sushi Kome Overlay.exe" "" "$INSTDIR\Sushi Kome Overlay.exe" 0
  ${EndIf}
!macroend
