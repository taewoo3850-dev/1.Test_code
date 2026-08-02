# 이미지 정렬 배치 처리 스크립트
# D드라이브의 사진을 연도별로 정렬

param(
    [string]$LogPath = "D:\0. Gemini_Project\1.Test\photo_sort_log.txt"
)

# 로그 파일 초기화
$logContent = @()
$startTime = Get-Date
$logContent += "=== 이미지 정렬 작업 시작 ==="
$logContent += "시작 시간: $startTime"
$logContent += ""

# 설정
$imageFolders = @(
    @{Path = "D:\백업\Camera"; Name = "백업-Camera"},
    @{Path = "D:\DCIM\Camera"; Name = "DCIM-Camera"},
    @{Path = "D:\백업\Screenshots"; Name = "백업-Screenshots"}
)

$targetRoot = "D:\1.사진"
$imageExtensions = @(".jpg", ".jpeg", ".png", ".gif", ".bmp")

# 통계
$stats = @{
    TotalFiles = 0
    CopiedFiles = 0
    SkippedFiles = 0
    DuplicateRenamed = 0
    YearStats = @{}
    TotalSize = 0
}

function Get-ImageYear {
    param([string]$FilePath)

    try {
        $file = Get-Item -Path $FilePath -ErrorAction Stop
        $year = $file.CreationTime.Year
        return $year
    }
    catch {
        return $null
    }
}

function Copy-ImageWithDuplicateHandling {
    param(
        [string]$SourcePath,
        [string]$TargetPath,
        [string]$FileName
    )

    # 대상 디렉토리 생성 (필요한 경우)
    if (-not (Test-Path -Path $TargetPath)) {
        New-Item -ItemType Directory -Path $TargetPath -Force | Out-Null
    }

    $targetFile = Join-Path -Path $TargetPath -ChildPath $FileName

    # 파일이 이미 존재하면 이름 변경
    if (Test-Path -Path $targetFile) {
        $baseName = [System.IO.Path]::GetFileNameWithoutExtension($FileName)
        $extension = [System.IO.Path]::GetExtension($FileName)
        $counter = 1

        while (Test-Path -Path $targetFile) {
            $newFileName = "${baseName}_${counter}${extension}"
            $targetFile = Join-Path -Path $TargetPath -ChildPath $newFileName
            $counter++
        }

        $stats.DuplicateRenamed++
    }

    # 파일 복사
    try {
        Copy-Item -Path $SourcePath -Destination $targetFile -Force -ErrorAction Stop
        $fileSize = (Get-Item -Path $targetFile).Length
        $stats.CopiedFiles++
        $stats.TotalSize += $fileSize
        return $true
    }
    catch {
        $logContent += "ERROR: $_"
        $stats.SkippedFiles++
        return $false
    }
}

# 각 폴더에서 이미지 처리
foreach ($folder in $imageFolders) {
    $folderPath = $folder.Path
    $folderName = $folder.Name

    $logContent += ""
    $logContent += "=== ${folderName} 처리 중 ==="

    if (-not (Test-Path -Path $folderPath)) {
        $logContent += "경고: 폴더를 찾을 수 없음 - $folderPath"
        continue
    }

    # 이미지 파일 가져오기 (배치 처리)
    $imageFiles = @()

    foreach ($ext in $imageExtensions) {
        $files = Get-ChildItem -Path $folderPath -Recurse -Filter "*$ext" -File -ErrorAction SilentlyContinue
        if ($files) {
            $imageFiles += $files
        }
    }

    $logContent += "발견된 파일: $($imageFiles.Count)개"
    $stats.TotalFiles += $imageFiles.Count

    # 파일을 연도별로 그룹화 (배치 처리 최적화)
    $filesByYear = @{}

    foreach ($file in $imageFiles) {
        $year = Get-ImageYear -FilePath $file.FullName

        if ($year) {
            if (-not $filesByYear.ContainsKey($year)) {
                $filesByYear[$year] = @()
            }
            $filesByYear[$year] += $file
        }
        else {
            $logContent += "경고: 메타데이터 없음 - $($file.Name)"
        }
    }

    # 연도별로 복사
    foreach ($year in $filesByYear.Keys | Sort-Object) {
        $files = $filesByYear[$year]
        $yearFolder = Join-Path -Path $targetRoot -ChildPath $year.ToString()

        # 통계 업데이트
        if (-not $stats.YearStats.ContainsKey($year)) {
            $stats.YearStats[$year] = @{Count = 0; Size = 0}
        }

        foreach ($file in $files) {
            $success = Copy-ImageWithDuplicateHandling `
                -SourcePath $file.FullName `
                -TargetPath $yearFolder `
                -FileName $file.Name

            if ($success) {
                $stats.YearStats[$year].Count++
                $stats.YearStats[$year].Size += $file.Length
            }
        }
    }

    $logContent += "완료: ${folderName}"
}

# 최종 통계
$logContent += ""
$logContent += "=== 최종 통계 ==="
$logContent += "총 처리 파일: $($stats.TotalFiles)개"
$logContent += "복사 완료: $($stats.CopiedFiles)개"
$logContent += "중복 파일명 변경: $($stats.DuplicateRenamed)개"
$logContent += "건너뛴 파일: $($stats.SkippedFiles)개"
$logContent += "총 용량: $('{0:N2}' -f ($stats.TotalSize / 1GB)) GB"
$logContent += ""

# 연도별 상세 통계
$logContent += "=== 연도별 상세 통계 ==="
foreach ($year in $stats.YearStats.Keys | Sort-Object) {
    $count = $stats.YearStats[$year].Count
    $size = $stats.YearStats[$year].Size
    $sizeGB = '{0:N2}' -f ($size / 1GB)
    $logContent += "${year}년: $count개 파일, ${sizeGB} GB"
}

$endTime = Get-Date
$duration = $endTime - $startTime
$logContent += ""
$logContent += "종료 시간: $endTime"
$logContent += "소요 시간: $($duration.TotalMinutes)분"
$logContent += "=== 작업 완료 ==="

# 로그 파일에 저장
$logContent | Out-File -FilePath $LogPath -Encoding UTF8

# 콘솔에도 출력
$logContent | ForEach-Object { Write-Host $_ }
