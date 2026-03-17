$ErrorActionPreference = 'Stop'

function EnvVal([string]$name) {
  $line = Get-Content .env | Where-Object { $_ -like "$name=*" } | Select-Object -First 1
  if (-not $line) { throw "Missing $name" }
  return $line.Substring($name.Length + 1)
}

function HashHex([string]$input) {
  $sha = [System.Security.Cryptography.SHA256]::Create()
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($input)
  $hash = $sha.ComputeHash($bytes)
  return (-join ($hash | ForEach-Object { $_.ToString('x2') }))
}

function PostJson($url, $headers, $obj) {
  $json = $obj | ConvertTo-Json -Depth 10 -Compress
  try {
    $resp = Invoke-RestMethod -Method Post -Uri $url -Headers $headers -ContentType 'application/json' -Body $json
    return @{ ok = $true; msg = 'ok'; body = $resp }
  } catch {
    $raw = ''
    if ($_.Exception.Response) {
      $sr = New-Object IO.StreamReader($_.Exception.Response.GetResponseStream())
      $raw = $sr.ReadToEnd()
      $sr.Close()
    }
    return @{ ok = $false; msg = $raw; body = $null }
  }
}

function PatchJson($url, $headers, $obj) {
  $json = $obj | ConvertTo-Json -Depth 10 -Compress
  try {
    Invoke-RestMethod -Method Patch -Uri $url -Headers $headers -ContentType 'application/json' -Body $json | Out-Null
    return @{ ok = $true; msg = 'ok' }
  } catch {
    $raw = ''
    if ($_.Exception.Response) {
      $sr = New-Object IO.StreamReader($_.Exception.Response.GetResponseStream())
      $raw = $sr.ReadToEnd()
      $sr.Close()
    }
    return @{ ok = $false; msg = $raw }
  }
}

$anon = EnvVal 'EXPO_PUBLIC_SUPABASE_ANON_KEY'
$service = EnvVal 'SUPABASE_SERVICE_ROLE_KEY'
$base = 'https://kvuzqrrzeugpzffbyyep.supabase.co'
$fn = 'https://kvuzqrrzeugpzffbyyep.functions.supabase.co'
$suffix = Get-Random -Minimum 10000 -Maximum 99999
$expiry = (Get-Date).ToUniversalTime().AddMinutes(10).ToString('o')

$script:rows = @()
function AddRow($flow, $check, $ok, $detail) {
  $script:rows += [pscustomobject]@{
    flow = $flow
    check = $check
    status = $(if ($ok) { 'PASS' } else { 'FAIL' })
    detail = $detail
  }
}

# Signup OTP flow
$signupEmail = "final.signup.$suffix@mealmitra.app"
$signupReq = PostJson "$fn/request-signup-otp" @{ apikey = $anon; Authorization = "Bearer $anon" } @{ email = $signupEmail }
AddRow 'Signup OTP' 'request_otp' $signupReq.ok $signupReq.msg

$signupCode = '123456'
$signupHash = HashHex "$signupEmail:signup:$signupCode"
$signupPatch = PatchJson "$base/rest/v1/signup_otps?email=eq.$signupEmail" @{ apikey = $service; Authorization = "Bearer $service" } @{
  otp_hash = $signupHash
  attempt_count = 0
  consumed_at = $null
  expires_at = $expiry
}
AddRow 'Signup OTP' 'inject_known_code' $signupPatch.ok $signupPatch.msg

$signupComplete = PostJson "$fn/complete-signup-with-otp" @{ apikey = $anon; Authorization = "Bearer $anon" } @{
  email = $signupEmail
  code = $signupCode
  password = 'Password#1234'
  name = 'Final Signup'
  username = "final_signup_$suffix"
  avatarIcon = 'chef-hat'
}
AddRow 'Signup OTP' 'verify_and_create' $signupComplete.ok $signupComplete.msg

# Profile-backed auth user for other flows
$acctEmail = "final.acct.$suffix@mealmitra.app"
$acctPass = 'AcctFlow#2026'
$createUser = PostJson "$base/auth/v1/admin/users" @{ apikey = $service; Authorization = "Bearer $service" } @{
  email = $acctEmail
  password = $acctPass
  email_confirm = $true
  user_metadata = @{ name = 'Final Flow User' }
}

$userId = ''
if ($createUser.ok -and $createUser.body) {
  if ($createUser.body.id) { $userId = $createUser.body.id }
  elseif ($createUser.body.user -and $createUser.body.user.id) { $userId = $createUser.body.user.id }
}
AddRow 'Setup' 'create_auth_user' ([bool]$userId) $userId

$profileInsert = PostJson "$base/rest/v1/user_profiles" @{ apikey = $service; Authorization = "Bearer $service"; Prefer = 'resolution=merge-duplicates,return=minimal' } @(@{
  id = $userId
  name = 'Final Flow User'
  email = $acctEmail
})
AddRow 'Setup' 'upsert_profile' $profileInsert.ok $profileInsert.msg

$signin = PostJson "$base/auth/v1/token?grant_type=password" @{ apikey = $anon } @{ email = $acctEmail; password = $acctPass }
$token = ''
if ($signin.ok -and $signin.body -and $signin.body.access_token) { $token = $signin.body.access_token }
AddRow 'Setup' 'signin_user' ([bool]$token) $(if ($token) { 'token' } else { $signin.msg })

# Forgot password flow
$forgotReq = PostJson "$fn/request-password-reset-otp" @{ apikey = $anon; Authorization = "Bearer $anon" } @{ email = $acctEmail }
AddRow 'Forgot Password OTP' 'request_otp' $forgotReq.ok $forgotReq.msg

$resetCode = '654321'
$resetHash = HashHex "$userId:reset_password:$resetCode"
$resetPatch = PatchJson "$base/rest/v1/password_reset_otps?user_id=eq.$userId" @{ apikey = $service; Authorization = "Bearer $service" } @{
  otp_hash = $resetHash
  attempt_count = 0
  consumed_at = $null
  expires_at = $expiry
}
AddRow 'Forgot Password OTP' 'inject_known_code' $resetPatch.ok $resetPatch.msg

$newPass = 'Reset#2026!'
$forgotConfirm = PostJson "$fn/confirm-password-reset-otp" @{ apikey = $anon; Authorization = "Bearer $anon" } @{
  email = $acctEmail
  code = $resetCode
  newPassword = $newPass
}
AddRow 'Forgot Password OTP' 'verify_and_reset' $forgotConfirm.ok $forgotConfirm.msg

$signinAfter = PostJson "$base/auth/v1/token?grant_type=password" @{ apikey = $anon } @{ email = $acctEmail; password = $newPass }
AddRow 'Forgot Password OTP' 'login_with_new_password' ($signinAfter.ok -and $signinAfter.body.access_token) $signinAfter.msg

# Change email
$sendEmailOtp = PostJson "$fn/send-account-otp" @{ apikey = $anon; Authorization = "Bearer $token" } @{ action = 'change_email' }
AddRow 'Change Email OTP' 'request_otp' $sendEmailOtp.ok $sendEmailOtp.msg

$emailOtpHash = HashHex "$userId:change_email:222222"
$emailPatch = PatchJson "$base/rest/v1/account_action_otps?user_id=eq.$userId&action=eq.change_email" @{ apikey = $service; Authorization = "Bearer $service" } @{
  otp_hash = $emailOtpHash
  attempt_count = 0
  consumed_at = $null
  expires_at = $expiry
}
$verifyEmailOtp = PostJson "$fn/verify-account-otp" @{ apikey = $anon; Authorization = "Bearer $token" } @{ action = 'change_email'; code = '222222' }
AddRow 'Change Email OTP' 'verify_code' ($emailPatch.ok -and $verifyEmailOtp.ok) ("patch=$($emailPatch.msg); verify=$($verifyEmailOtp.msg)")

# Change username
$sendUsernameOtp = PostJson "$fn/send-account-otp" @{ apikey = $anon; Authorization = "Bearer $token" } @{ action = 'change_username' }
$usernameHash = HashHex "$userId:change_username:333333"
$usernamePatch = PatchJson "$base/rest/v1/account_action_otps?user_id=eq.$userId&action=eq.change_username" @{ apikey = $service; Authorization = "Bearer $service" } @{
  otp_hash = $usernameHash
  attempt_count = 0
  consumed_at = $null
  expires_at = $expiry
}
$verifyUsernameOtp = PostJson "$fn/verify-account-otp" @{ apikey = $anon; Authorization = "Bearer $token" } @{ action = 'change_username'; code = '333333' }
AddRow 'Change Username OTP' 'request_and_verify' ($sendUsernameOtp.ok -and $usernamePatch.ok -and $verifyUsernameOtp.ok) ("send=$($sendUsernameOtp.msg); patch=$($usernamePatch.msg); verify=$($verifyUsernameOtp.msg)")

# Change password
$sendPasswordOtp = PostJson "$fn/send-account-otp" @{ apikey = $anon; Authorization = "Bearer $token" } @{ action = 'change_password' }
$passwordHash = HashHex "$userId:change_password:444444"
$passwordPatch = PatchJson "$base/rest/v1/account_action_otps?user_id=eq.$userId&action=eq.change_password" @{ apikey = $service; Authorization = "Bearer $service" } @{
  otp_hash = $passwordHash
  attempt_count = 0
  consumed_at = $null
  expires_at = $expiry
}
$verifyPasswordOtp = PostJson "$fn/verify-account-otp" @{ apikey = $anon; Authorization = "Bearer $token" } @{ action = 'change_password'; code = '444444' }
AddRow 'Change Password OTP' 'request_and_verify' ($sendPasswordOtp.ok -and $passwordPatch.ok -and $verifyPasswordOtp.ok) ("send=$($sendPasswordOtp.msg); patch=$($passwordPatch.msg); verify=$($verifyPasswordOtp.msg)")

# Duplicate protection
$dup = PostJson "$fn/send-account-otp" @{ apikey = $anon; Authorization = "Bearer $token" } @{ action = 'change_password' }
$dupOk = (-not $dup.ok) -and ($dup.msg -match '30 seconds')
AddRow 'Duplicate Protection' 'account_action_30s_cooldown' $dupOk $dup.msg

Write-Output 'FINAL_MATRIX_START'
foreach ($row in $script:rows) {
  Write-Output ("{0} | {1} | {2} | {3}" -f $row.flow, $row.check, $row.status, $row.detail)
}
Write-Output 'FINAL_MATRIX_END'
