param([Parameter(Mandatory=$true)][string]$Doc)

$ErrorActionPreference = 'Stop'
$hwp = New-Object -ComObject HWPFrame.HwpObject
try {
  $null = $hwp.SetMessageBoxMode(0x10000)
  try {
    $registered = $hwp.RegisterModule('FilePathCheckDLL', 'FilePathCheckerModule')
  } catch {
    $registered = $false
  }
  $hwp.XHwpWindows.Item(0).Visible = $false
  $opened = $hwp.Open($Doc, 'HWP', 'forceopen:true;lock:false')
  $text = $hwp.GetTextFile('TEXT', '')
  [pscustomobject]@{
    Registered = $registered
    Opened = $opened
    PageCount = $hwp.PageCount
    TextLength = $text.Length
    Preview = $text.Substring(0, [Math]::Min(1600, $text.Length))
  } | ConvertTo-Json -Depth 3
} finally {
  try { $hwp.Clear(1) } catch {}
  try { $hwp.Quit() } catch {}
  [System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($hwp) | Out-Null
}
