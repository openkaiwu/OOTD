$ErrorActionPreference = "Stop"

$target = Join-Path $PSScriptRoot "..\src\static\demo-wardrobe"
New-Item -ItemType Directory -Force -Path $target | Out-Null

$assets = @(
  @{ File = "red-dress.jpg"; Url = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Red-Dress.jpg/960px-Red-Dress.jpg" },
  @{ File = "black-dress.jpg"; Url = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Kort_svart_sidenkl%C3%A4nning_med_l%C3%A5nga_%C3%A4rmar%2C_puffade_upptill._Tyll-_och_banddekor_p%C3%A5_liv_och_kjol_-_Hallwylska_museet_-_89326.tif/lossy-page1-960px-Kort_svart_sidenkl%C3%A4nning_med_l%C3%A5nga_%C3%A4rmar%2C_puffade_upptill._Tyll-_och_banddekor_p%C3%A5_liv_och_kjol_-_Hallwylska_museet_-_89326.tif.jpg" },
  @{ File = "lilac-dress.jpg"; Url = "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/KL%C3%84NNING_Syrenlila_sidenkl%C3%A4nning_med_cape_och_underkl%C3%A4nning._Tillh%C3%B6rt_Ebba_von_Eckermann%2C_f_-_Hallwylska_museet_-_89129_%28cropped%29.tif/lossy-page1-960px-KL%C3%84NNING_Syrenlila_sidenkl%C3%A4nning_med_cape_och_underkl%C3%A4nning._Tillh%C3%B6rt_Ebba_von_Eckermann%2C_f_-_Hallwylska_museet_-_89129_%28cropped%29.tif.jpg" },
  @{ File = "rose-dress.jpg"; Url = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/KL%C3%84NNING_Av_rosabeige_siden%2C_tv%C3%A5delad_med_blus_och_kjol._Tillh%C3%B6rt_Irma_von_Geijer_-_Hallwylska_museet_-_89130.tif/lossy-page1-960px-KL%C3%84NNING_Av_rosabeige_siden%2C_tv%C3%A5delad_med_blus_och_kjol._Tillh%C3%B6rt_Irma_von_Geijer_-_Hallwylska_museet_-_89130.tif.jpg" },
  @{ File = "blue-dress.jpg"; Url = "https://upload.wikimedia.org/wikipedia/commons/b/b8/Satin_Blue_Dress.jpg" },
  @{ File = "white-shirt.jpg"; Url = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Arnaud_Rousseau_Dress_Shirt_with_a_Modern_Spread_Collar.jpg/960px-Arnaud_Rousseau_Dress_Shirt_with_a_Modern_Spread_Collar.jpg" },
  @{ File = "madras-shirt.jpg"; Url = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Madraskarohemd_Sir_Oliver.jpg/960px-Madraskarohemd_Sir_Oliver.jpg" },
  @{ File = "green-shirt.jpg"; Url = "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Chilean_Scouting_shirt_of_San_Ignacio.jpg/960px-Chilean_Scouting_shirt_of_San_Ignacio.jpg" },
  @{ File = "cycling-pants.jpg"; Url = "https://upload.wikimedia.org/wikipedia/commons/5/54/Cycling-knickers-capri-pants.jpg" },
  @{ File = "training-pants.jpg"; Url = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Trainingpants.jpg/960px-Trainingpants.jpg" },
  @{ File = "blue-jeans.jpg"; Url = "https://upload.wikimedia.org/wikipedia/commons/2/2b/Jeans_Gul%26Bl%C3%A5_i_modellen_Dallas.jpg" },
  @{ File = "mini-skirt.jpg"; Url = "https://upload.wikimedia.org/wikipedia/commons/6/6b/Microskirt2.jpg" },
  @{ File = "field-jacket.jpg"; Url = "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/%28US%29_JACKET%2C_FIELD%2C_OD_%28SECOND_TYPE_-_STOCK_No_55-J-200-55-J-304%29%2C_2002.1766.jpg/960px-%28US%29_JACKET%2C_FIELD%2C_OD_%28SECOND_TYPE_-_STOCK_No_55-J-200-55-J-304%29%2C_2002.1766.jpg" },
  @{ File = "leather-coat.jpg"; Url = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Black_Leather_Coat_of_Charles_A._Lindbergh_-_DPLA_-_eec840e73527f044387d2568bbdb7f20_%28page_1%29.jpg/960px-Black_Leather_Coat_of_Charles_A._Lindbergh_-_DPLA_-_eec840e73527f044387d2568bbdb7f20_%28page_1%29.jpg" },
  @{ File = "jacket-scarf.jpg"; Url = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/BW_jacket_Red_scarf_%283213392759%29.jpg/960px-BW_jacket_Red_scarf_%283213392759%29.jpg" },
  @{ File = "asics-shoes.jpg"; Url = "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/ASICS_GEL-Kayano_19.jpg/960px-ASICS_GEL-Kayano_19.jpg" },
  @{ File = "merrell-shoes.jpg"; Url = "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Merrell_All_Out_Crush_Light.jpg/960px-Merrell_All_Out_Crush_Light.jpg" },
  @{ File = "running-shoes.jpg"; Url = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Running_shoes.jpg/960px-Running_shoes.jpg" },
  @{ File = "white-sneakers.jpg"; Url = "https://api.openverse.org/v1/images/d9cf2562-e5e7-449d-b1cc-4f0da7bff20c/thumb/" },
  @{ File = "black-handbag.jpg"; Url = "https://api.openverse.org/v1/images/49a3bc98-b7aa-4646-93ad-82a67b1df95f/thumb/" },
  @{ File = "brown-handbag.jpg"; Url = "https://api.openverse.org/v1/images/563f540e-8708-4ad7-8694-fcd4a39f2af8/thumb/" },
  @{ File = "blue-tie.jpg"; Url = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Corbata_azul_con_rayas_blancas.jpg/960px-Corbata_azul_con_rayas_blancas.jpg" },
  @{ File = "bow-tie.jpg"; Url = "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Bow_tie_-_2010-02-17_at_20-03-33.jpg/960px-Bow_tie_-_2010-02-17_at_20-03-33.jpg" }
)

foreach ($asset in $assets) {
  $path = Join-Path $target $asset.File
  if (-not (Test-Path -LiteralPath $path)) {
    $attempt = 0
    while (-not (Test-Path -LiteralPath $path) -and $attempt -lt 4) {
      $attempt += 1
      try {
        Invoke-WebRequest -Uri $asset.Url -OutFile $path -Headers @{
          "User-Agent" = "TomorrowWear-DemoAssetFetcher/0.1 (local prototype; contact: local-development@example.invalid)"
        }
      } catch {
        if ($attempt -ge 4) { throw }
        Start-Sleep -Seconds ($attempt * 3)
      }
    }
    Start-Sleep -Milliseconds 900
  }
  Write-Output "$($asset.File) $((Get-Item -LiteralPath $path).Length)"
}
