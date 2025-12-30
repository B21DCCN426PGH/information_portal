# Script xoa Module Dang ky Thuc tap
# Chay script nay de xoa tat ca cac file lien quan den internship

Write-Host "=== XOA MODULE DANG KY THUC TAP ===" -ForegroundColor Yellow
Write-Host ""

# Xac nhan truoc khi xoa
$confirm = Read-Host "Ban co chac chan muon xoa toan bo module dang ky thuc tap? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Da huy." -ForegroundColor Red
    exit
}

Write-Host "Dang xoa cac file..." -ForegroundColor Cyan

# Xoa frontend admin components
$frontendAdminFiles = @(
    "client/src/admin/InternshipLecturersManager.jsx",
    "client/src/admin/InternshipPeriodsManager.jsx",
    "client/src/admin/InternshipUnitsManager.jsx",
    "client/src/admin/InternshipRegistrationsManager.jsx"
)

foreach ($file in $frontendAdminFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "OK Da xoa: $file" -ForegroundColor Green
    } else {
        Write-Host "X Khong tim thay: $file" -ForegroundColor Yellow
    }
}

# Xoa frontend student pages
$frontendStudentFiles = @(
    "client/src/pages/InternshipRegistration.jsx",
    "client/src/student/LecturerRegistration.jsx",
    "client/src/student/PreferenceRegistration.jsx"
)

foreach ($file in $frontendStudentFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "OK Da xoa: $file" -ForegroundColor Green
    } else {
        Write-Host "X Khong tim thay: $file" -ForegroundColor Yellow
    }
}

# Xoa backend routes
$backendRouteFiles = @(
    "server/src/routes/internship.js",
    "server/src/routes/internship-lecturers.js",
    "server/src/routes/internship-periods.js",
    "server/src/routes/internship-period-units.js"
)

foreach ($file in $backendRouteFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "OK Da xoa: $file" -ForegroundColor Green
    } else {
        Write-Host "X Khong tim thay: $file" -ForegroundColor Yellow
    }
}

# Xoa backend middleware
$backendMiddlewareFiles = @(
    "server/src/middleware/validateInternshipPeriod.js",
    "server/src/middleware/checkPeriod.js"
)

foreach ($file in $backendMiddlewareFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "OK Da xoa: $file" -ForegroundColor Green
    } else {
        Write-Host "X Khong tim thay: $file" -ForegroundColor Yellow
    }
}

# Xoa docs
$docFiles = @(
    "docs/internship_schema.sql",
    "docs/migration_internship_safe.sql",
    "docs/migration_add_period_units_lecturers.sql",
    "docs/seed_test_internship_lecturer.sql",
    "docs/fix_period_lecturers_mapping.sql"
)

foreach ($file in $docFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "OK Da xoa: $file" -ForegroundColor Green
    } else {
        Write-Host "X Khong tim thay: $file" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== HOAN TAT XOA FILE ===" -ForegroundColor Green
Write-Host ""
Write-Host "BUOC TIEP THEO:" -ForegroundColor Yellow
Write-Host "1. Sua file client/src/App.jsx - da xoa imports va routes" -ForegroundColor Cyan
Write-Host "2. Sua file server/src/server.js - da xoa imports va route registrations" -ForegroundColor Cyan
Write-Host "3. Sua file client/src/admin/AdminLayout.jsx - da xoa menu items" -ForegroundColor Cyan
Write-Host "4. Sua file client/src/services/api.js - da xoa API functions" -ForegroundColor Cyan
Write-Host "5. Xoa cac bang database (neu muon) - xem docs/REMOVE_INTERNSHIP_MODULE.md" -ForegroundColor Cyan
Write-Host ""
